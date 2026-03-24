import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import {
  auth, googleProvider, signInWithPopup,
  signInWithPhoneNumber, RecaptchaVerifier,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  isFirebaseConfigured, missingFirebaseKeys,
} from '../config/firebase';

// ─── 6-box OTP input ──────────────────────────────────────────────────────────
const OtpInput = ({ value, onChange, disabled }) => {
  const refs = useRef([]);
  const digits = value.padEnd(6, '').slice(0, 6).split('');
  const focus = (i) => refs.current[i]?.focus();
  const handleChange = (i, v) => { if (!/^\d?$/.test(v)) return; const n = [...digits]; n[i] = v; onChange(n.join('')); if (v && i < 5) focus(i + 1); };
  const handleKey = (i, e) => { if (e.key === 'Backspace' && !digits[i] && i > 0) focus(i - 1); };
  const handlePaste = (e) => { e.preventDefault(); const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (p) { onChange(p); focus(Math.min(p.length, 5)); } };
  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input key={i} ref={el => refs.current[i] = el} type="text" inputMode="numeric" maxLength={1}
          value={d || ''} onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined} disabled={disabled} autoFocus={i === 0}
          style={{ width: 44, height: 52, textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, borderRadius: 10, border: `2px solid ${d ? '#6366f1' : '#d1d5db'}`, outline: 'none' }}
          aria-label={`OTP digit ${i + 1}`} />
      ))}
    </div>
  );
};

const Login = () => {
  const [tab, setTab] = useState(isFirebaseConfigured ? 'email' : 'password'); // 'email' | 'phone' | 'password'
  // Email (Firebase)
  const [email, setEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  // Phone OTP (Firebase)
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);
  // Legacy name+password
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  // Common
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef(null);

  const clearError = () => { setError(''); setPendingApproval(false); };
  const anyLoading = loading || googleLoading;

  const ensureFirebaseReady = () => {
    if (isFirebaseConfigured && auth) return true;
    const missingHint = missingFirebaseKeys.length
      ? ` Missing: ${missingFirebaseKeys.join(', ')}`
      : '';
    setError(`Firebase sign-in is not configured.${missingHint}`);
    return false;
  };

  // Resend countdown
  useEffect(() => { if (resendTimer <= 0) return; const id = setTimeout(() => setResendTimer(t => t - 1), 1000); return () => clearTimeout(id); }, [resendTimer]);

  // ── Shared: send Firebase ID token to backend ──
  const sendTokenToBackend = async (idToken) => {
    const res = await fetch(`${API_URL}/api/auth/firebase-login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await res.json();
    if (data.token) { login(data.token, data.user); navigate(data.user?.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'); return; }
    if (data.pendingApproval) { setPendingApproval(true); return; }
    throw new Error(data.message || 'Login failed.');
  };

  // ── Google ──
  const handleGoogle = async () => {
    if (!ensureFirebaseReady()) return;
    clearError(); setGoogleLoading(true);
    try { const r = await signInWithPopup(auth, googleProvider); await sendTokenToBackend(await r.user.getIdToken()); }
    catch (err) { if (err.code !== 'auth/popup-closed-by-user') setError(err.message || 'Google sign-in failed.'); }
    finally { setGoogleLoading(false); }
  };

  // ── Email/Password (Firebase) ──
  const handleEmail = async (e) => {
    e.preventDefault(); clearError(); setLoading(true);
    if (!ensureFirebaseReady()) { setLoading(false); return; }
    try {
      const fn = isSignUp ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
      const r = await fn(auth, email, emailPw);
      await sendTokenToBackend(await r.user.getIdToken());
    } catch (err) {
      const map = { 'auth/user-not-found': 'No account found. Try creating one.', 'auth/wrong-password': 'Incorrect password.', 'auth/invalid-credential': 'Invalid email or password.', 'auth/email-already-in-use': 'Email already registered. Sign in instead.', 'auth/weak-password': 'Password must be at least 6 characters.', 'auth/invalid-email': 'Invalid email address.' };
      setError(map[err.code] || err.message);
    } finally { setLoading(false); }
  };

  // ── Phone OTP (Firebase) ──
  const setupRecaptcha = useCallback(() => {
    if (recaptchaRef.current) return;
    if (!auth) {
      console.warn('setupRecaptcha: auth is null, skipping');
      return;
    }
    try {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'login-recaptcha', { size: 'invisible', callback: () => {} });
    } catch (err) {
      console.error('RecaptchaVerifier init failed:', err);
      recaptchaRef.current = null;
      throw new Error('Phone verification setup failed. Please reload the page and try again.');
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault(); clearError(); setLoading(true);
    if (!ensureFirebaseReady()) { setLoading(false); return; }
    try {
      setupRecaptcha();
      const r = await signInWithPhoneNumber(auth, '+91' + phone, recaptchaRef.current);
      setConfirmResult(r); setOtpSent(true); setResendTimer(30);
    } catch (err) {
      setError(err.code === 'auth/too-many-requests' ? 'Too many attempts. Wait and retry.' : (err.code === 'auth/invalid-phone-number' ? 'Invalid phone number.' : err.message));
      if (recaptchaRef.current) { try { recaptchaRef.current.clear(); } catch {} recaptchaRef.current = null; }
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); if (otp.length !== 6) { setError('Enter all 6 digits.'); return; }
    clearError(); setLoading(true);
    if (!ensureFirebaseReady()) { setLoading(false); return; }
    try { const r = await confirmResult.confirm(otp); await sendTokenToBackend(await r.user.getIdToken()); }
    catch (err) { setError(err.code === 'auth/invalid-verification-code' ? 'Invalid OTP. Check and try again.' : err.message); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    clearError(); setLoading(true);
    if (!ensureFirebaseReady()) { setLoading(false); return; }
    try {
      if (recaptchaRef.current) { try { recaptchaRef.current.clear(); } catch {} recaptchaRef.current = null; }
      setupRecaptcha();
      const r = await signInWithPhoneNumber(auth, '+91' + phone, recaptchaRef.current);
      setConfirmResult(r); setOtp(''); setResendTimer(30);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ── Legacy name+password ──
  const handlePassword = async (e) => {
    e.preventDefault(); clearError(); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (res.ok) { login(data.token, data.user); navigate(data.user?.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'); }
      else if (data.pendingApproval) { setPendingApproval(true); }
      else { setError(data.message || 'Login failed.'); }
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  };

  // Tab button style helper
  const tabStyle = (active) => ({
    flex: 1, padding: '0.6rem 0.25rem', border: 'none', borderRadius: 8,
    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
    background: active ? '#4f46e5' : 'transparent',
    color: active ? '#fff' : '#6b7280',
    transition: 'all 0.15s',
  });

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

        {/* Pending approval */}
        {pendingApproval && (
          <div className="p-4 rounded-lg border border-amber-300 bg-amber-50" role="status">
            <div className="flex gap-3 items-start">
              <span className="text-2xl flex-shrink-0">⏳</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Account Pending Approval</p>
                <p className="text-sm text-amber-700 mt-1">Your account is awaiting admin approval. You&apos;ll be able to sign in once approved.</p>
              </div>
            </div>
          </div>
        )}

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

        {/* ── Google Sign-In ── */}
        {isFirebaseConfigured ? (
          <button type="button" onClick={handleGoogle} disabled={anyLoading}
            className="w-full py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-base hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3">
            {googleLoading ? (
              <><span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /><span>Signing in…</span></>
            ) : (
              <><svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg><span>Continue with Google</span></>
            )}
          </button>
        ) : (
          <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
            Firebase sign-in is unavailable. Use the Password tab while configuration is updated.
          </div>
        )}

        {/* ── OR divider ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1rem 0' }}>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          <span style={{ color: '#9ca3af', fontSize: '0.875rem', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
        </div>

        {/* ── Method tabs ── */}
        <div style={{ display: 'flex', gap: 4, background: '#f3f4f6', borderRadius: 10, padding: 4, marginBottom: '1rem' }}>
          {isFirebaseConfigured && (
            <>
              <button type="button" style={tabStyle(tab === 'email')} onClick={() => { setTab('email'); clearError(); }}>Email</button>
              <button type="button" style={tabStyle(tab === 'phone')} onClick={() => { setTab('phone'); clearError(); setOtpSent(false); setOtp(''); }}>Phone OTP</button>
            </>
          )}
          <button type="button" style={tabStyle(tab === 'password')} onClick={() => { setTab('password'); clearError(); }}>Password</button>
        </div>

        {/* ═══ EMAIL TAB ═══ */}
        {tab === 'email' && (
          <form onSubmit={handleEmail} className="login-form space-y-4" noValidate>
            <div className="login-field">
              <label className="login-label block text-sm font-medium text-gray-900 mb-2">Email</label>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }} required
                className="login-input w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="login-field">
              <label className="login-label block text-sm font-medium text-gray-900 mb-2">Password</label>
              <input type="password" placeholder={isSignUp ? "Create a password (min 6)" : "Your password"} value={emailPw}
                onChange={e => { setEmailPw(e.target.value); clearError(); }} required minLength={6}
                className="login-input w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={anyLoading}
              className="login-btn w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2">
              {loading ? <><span className="login-spinner inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>{isSignUp ? 'Creating…' : 'Signing In…'}</span></> : <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>}
            </button>
            <p className="text-center text-sm text-gray-600">
              {isSignUp ? 'Already have an account? ' : "Don't have an email account? "}
              <button type="button" className="text-blue-600 hover:text-blue-700 font-medium" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => { setIsSignUp(!isSignUp); clearError(); }}>
                {isSignUp ? 'Sign In' : 'Create One'}
              </button>
            </p>
          </form>
        )}

        {/* ═══ PHONE OTP TAB ═══ */}
        {tab === 'phone' && (
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="login-form space-y-4" noValidate>
              <div className="login-field">
                <label className="login-label block text-sm font-medium text-gray-900 mb-2">Mobile Number</label>
                <div className="flex gap-2 items-center">
                  <span className="text-sm font-medium text-gray-500" style={{ whiteSpace: 'nowrap' }}>+91</span>
                  <input type="tel" placeholder="10-digit number" value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError(); }}
                    required maxLength={10}
                    className="login-input w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button type="submit" disabled={anyLoading || phone.length < 10}
                className="login-btn w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2">
                {loading ? <><span className="login-spinner inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Sending…</span></> : <span>Send OTP</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="login-form space-y-4" noValidate>
              <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '0.25rem' }}>OTP sent to <strong>+91 {phone}</strong></p>
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Enter the 6-digit code from your SMS</p>
              <OtpInput value={otp} onChange={v => { setOtp(v); clearError(); }} disabled={loading} />
              <button type="submit" disabled={anyLoading || otp.length < 6}
                className="login-btn w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-all flex items-center justify-center gap-2">
                {loading ? <><span className="login-spinner inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Verifying…</span></> : <span>Verify &amp; Sign In</span>}
              </button>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '0.875rem' }} onClick={() => { setOtpSent(false); setOtp(''); clearError(); }}>&#8592; Back</button>
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: resendTimer > 0 ? '#9ca3af' : '#6366f1', fontSize: '0.875rem', fontWeight: resendTimer > 0 ? 400 : 600 }}
                  onClick={handleResendOtp} disabled={resendTimer > 0 || loading}>
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )
        )}

        {/* ═══ PASSWORD TAB (legacy name+password) ═══ */}
        {tab === 'password' && (
          <form onSubmit={handlePassword} className="login-form space-y-4" noValidate>
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
        )}

        {/* reCAPTCHA container for phone auth */}
        <div id="login-recaptcha" />

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