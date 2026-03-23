import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const Register = () => {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [visible, setVisible]   = useState(false);

  const navigate  = useNavigate();
  const { login } = useAuth();
  const firstRef  = useRef(null);

  // Trigger enter animation on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Focus first field once visible
  useEffect(() => {
    if (visible) firstRef.current?.focus();
  }, [visible]);

  // Close: animate out then go back
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => navigate(-1), 280);
  };

  // Dismiss on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const clearError = () => setError('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        // Auto-login and navigate to dashboard after brief success pause
        if (data.token) {
          login(data.token, data.user);
        }
        setTimeout(() => navigate('/member/dashboard'), 1400);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`reg-overlay${visible ? ' reg-overlay--in' : ''}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-title"
    >
      <div className={`reg-card${visible ? ' reg-card--in' : ''}`}>

        {/* Close button */}
        <button className="reg-close" onClick={handleClose} aria-label="Close registration">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20" aria-hidden="true">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Success state */}
        {success ? (
          <div className="reg-success">
            <div className="reg-success-icon" aria-hidden="true">✓</div>
            <h2 className="reg-success-title">Welcome to the Family!</h2>
            <p className="reg-success-sub">Your account has been created. Redirecting&hellip;</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="reg-header">
              <span className="reg-cross" aria-hidden="true">✝</span>
              <h2 className="reg-title" id="reg-title">Create Account</h2>
              <p className="reg-subtitle">Join the Sacred Heart community</p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="reg-error" role="alert">
                <svg className="reg-error-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
                <button className="reg-error-close" onClick={clearError} aria-label="Dismiss">×</button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="reg-form" noValidate>

              {/* Name */}
              <div className="reg-field">
                <label htmlFor="reg-name" className="reg-label">Full Name</label>
                <div className="reg-input-wrap">
                  <svg className="reg-input-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <input
                    id="reg-name"
                    ref={firstRef}
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); clearError(); }}
                    required
                    autoComplete="name"
                    className="reg-input"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="reg-field">
                <label htmlFor="reg-email" className="reg-label">Email Address</label>
                <div className="reg-input-wrap">
                  <svg className="reg-input-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    required
                    autoComplete="email"
                    className="reg-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="reg-field">
                <label htmlFor="reg-password" className="reg-label">Password</label>
                <div className="reg-input-wrap">
                  <svg className="reg-input-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <input
                    id="reg-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }}
                    required
                    autoComplete="new-password"
                    minLength={6}
                    className="reg-input"
                  />
                </div>
                <p className="reg-hint">Minimum 6 characters</p>
              </div>

              {/* Submit */}
              <button type="submit" className="reg-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="reg-spinner" aria-hidden="true" />
                    Creating Account&hellip;
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Login hint */}
            <p className="reg-login-hint">
              Already have an account?{' '}
              <Link to="/login" className="reg-login-link">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;