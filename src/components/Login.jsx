import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const Login = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPendingApproval(false);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        navigate(data.user?.role === 'admin' ? '/admin/dashboard' : '/member/dashboard');
      } else if (data.pendingApproval) {
        setPendingApproval(true);
      } else {
        setError(data.message || 'Unable to login. Please check your name and password.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => { setError(''); setPendingApproval(false); };

  return (
    <div className="login-page">
      {/* Soft ambient glow orbs */}
      <div className="login-orb login-orb--gold" aria-hidden="true" />
      <div className="login-orb login-orb--blue" aria-hidden="true" />

      <div className="login-card max-w-full sm:max-w-md mx-auto px-4 sm:px-0 my-4 sm:my-auto">
        {/* Cross icon */}
        <div className="login-cross" aria-hidden="true">✝</div>

        <div className="login-header">
          <h2 className="login-title text-2xl sm:text-3xl">Welcome Back</h2>
          <p className="login-subtitle text-sm sm:text-base">Sign in to your Sacred Heart account</p>
        </div>

        {/* Pending approval message */}
        {pendingApproval && (
          <div className="p-4 rounded-lg border border-amber-300 bg-amber-50" role="status">
            <div className="flex gap-3 items-start">
              <span className="text-2xl flex-shrink-0">⏳</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Account Pending Approval</p>
                <p className="text-sm text-amber-700 mt-1">Your account is awaiting admin approval. You'll be able to log in once approved.</p>
              </div>
              <button className="flex-shrink-0 text-amber-400 hover:text-amber-600 transition" onClick={clearError} aria-label="Dismiss">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Inline error message */}
        {error && (
          <div className="login-error p-3 sm:p-4 rounded-lg border border-red-300 bg-red-50" role="alert">
            <div className="flex gap-3 items-start">
              <svg className="login-error-icon flex-shrink-0 mt-0.5" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="flex-1 text-sm text-red-700">{error}</span>
              <button className="flex-shrink-0 text-red-400 hover:text-red-600 transition" onClick={clearError} aria-label="Dismiss error">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form space-y-4 sm:space-y-5" noValidate>
          {/* Name field */}
          <div className="login-field">
            <label htmlFor="login-name" className="login-label block text-sm font-medium text-gray-900 mb-2">Full Name</label>
            <div className="login-input-wrap relative">
              <svg className="login-input-icon absolute left-3 top-3 sm:top-4 w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <input
                id="login-name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => { setName(e.target.value); clearError(); }}
                required
                autoComplete="name"
                className="login-input w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="login-field">
            <div className="login-field-header flex justify-between items-center mb-2">
              <label htmlFor="login-password" className="login-label text-sm font-medium text-gray-900">Password</label>
              <a href="#" className="forgot-link text-xs sm:text-sm text-blue-600 hover:text-blue-700">Forgot?</a>
            </div>
            <div className="login-input-wrap relative">
              <svg className="login-input-icon absolute left-3 top-3 sm:top-4 w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                required
                autoComplete="current-password"
                className="login-input w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn w-full py-3 sm:py-4 rounded-lg bg-blue-600 text-white font-medium text-base sm:text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                <span>Signing In…</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="18" height="18">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </button>
        </form>

        <p className="login-register-hint text-center text-sm text-gray-600 mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="login-register-link text-blue-600 hover:text-blue-700 font-medium">Create one free</Link>
        </p>

        <p className="login-footer-brand text-center text-xs sm:text-sm text-gray-500 mt-6 pt-6 border-t border-gray-200">
          Sacred Heart Church — Faith, Love, Service
        </p>
      </div>
    </div>
  );
};

export default Login;