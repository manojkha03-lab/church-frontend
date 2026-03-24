import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { auth, googleProvider, signInWithPopup, isFirebaseAvailable } from '../config/firebase';

const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const clearError = () => setError('');
  const anyLoading = loading || googleLoading;

  // ── Role-based redirect ──
  const redirectByRole = (user) => {
    if (!user) { navigate('/login'); return; }
    if (user.status === 'pending' || user.isApproved === false) {
      navigate('/pending');
    } else if (user.role === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/member/dashboard');
    }
  };

  // ── Google login (optional — only if Firebase is available) ──
  const handleGoogle = async () => {
    clearError();
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const res = await fetch(`${API_URL}/api/auth/firebase-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (data.token && data.user) {
        login(data.token, data.user);
        redirectByRole(data.user);
      } else if (data.pendingApproval) {
        navigate('/pending');
      } else {
        setError(data.message || 'Google login failed.');
      }
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('Google login failed. Use password login instead.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Password login (always works) ──
  const handleLogin = async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.token && data.user) {
        login(data.token, data.user);
        redirectByRole(data.user);
      } else if (data.pendingApproval) {
        navigate('/pending');
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch {
      setError('Network error. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-orb login-orb--gold" aria-hidden="true" />
      <div className="login-orb login-orb--blue" aria-hidden="true" />

      <div className="login-card max-w-full sm:max-w-md mx-auto px-4 sm:px-0 my-4 sm:my-auto">
        <div className="login-cross" aria-hidden="true">✝</div>

        <div className="login-header">
          <h2 className="login-title text-2xl sm:text-3xl">Welcome Back</h2>
          <p className="login-subtitle text-sm sm:text-base">Sign in to your Sacred Heart account</p>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error p-3 sm:p-4 rounded-lg border border-red-300 bg-red-50" role="alert">
            <div className="flex gap-3 items-start">
              <svg className="login-error-icon flex-shrink-0 mt-0.5" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="flex-1 text-sm text-red-700">{error}</span>
              <button className="flex-shrink-0 text-red-400 hover:text-red-600 transition" onClick={clearError} aria-label="Dismiss error">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </div>
        )}

        {/* Google Sign-In (only shown when Firebase is available) */}
        {isFirebaseAvailable && (
          <>
            <button type="button" onClick={handleGoogle} disabled={anyLoading}
              className="w-full py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-base hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3">
              {googleLoading ? (
                <><span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /><span>Signing in…</span></>
              ) : (
                <><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Continue with Google</span></>
              )}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>
          </>
        )}

        {/* Password login form (always available) */}
        <form onSubmit={handleLogin} className="login-form space-y-4" noValidate>
          <div className="login-field">
            <label className="login-label block text-sm font-medium text-gray-900 mb-2">Full Name</label>
            <input type="text" placeholder="Your full name" value={name}
              onChange={e => { setName(e.target.value); clearError(); }} required autoComplete="name"
              className="login-input w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="login-field">
            <label className="login-label block text-sm font-medium text-gray-900 mb-2">Password</label>
            <input type="password" placeholder="Your password" value={password}
              onChange={e => { setPassword(e.target.value); clearError(); }} required autoComplete="current-password"
              className="login-input w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={anyLoading}
            className="login-btn w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2">
            {loading ? <><span className="login-spinner inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Signing In…</span></> : <span>Sign In</span>}
          </button>
        </form>

        <p className="login-register-hint text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="login-register-link text-blue-600 hover:text-blue-700 font-medium">Register</Link>
        </p>

        <p className="login-footer-brand text-center text-xs sm:text-sm text-gray-500 mt-6 pt-6 border-t border-gray-200">
          Sacred Heart Church — Faith, Love, Service
        </p>
      </div>
    </div>
  );
};

export default Login;