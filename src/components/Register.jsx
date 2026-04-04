import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../config/api';

const Register = () => {
  const [step, setStep]         = useState(1); // 1=form, 3=pending
  const [name, setName]         = useState('');
  const [mobile, setMobile]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [visible, setVisible]   = useState(false);

  const navigate = useNavigate();
  const firstRef = useRef(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (visible && step === 1) firstRef.current?.focus();
  }, [visible, step]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => navigate(-1), 280);
  };
  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) handleClose(); };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const clearError = () => setError('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const trimmedName = name.trim();
    if (!trimmedName || !mobile || !password) {
      setError('All fields are required.');
      return;
    }
    if (!/^[0-9]{10,15}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, mobile, password }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (res.ok) {
        setStep(3);
      } else {
        setError(data.message || data.error || 'Registration failed.');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-redirect to login after success
  useEffect(() => {
    if (step === 3) {
      const id = setTimeout(() => navigate('/login'), 3000);
      return () => clearTimeout(id);
    }
  }, [step, navigate]);

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

        {/* STEP 3: Success / Pending Approval */}
        {step === 3 ? (
          <div className="reg-success">
            <div className="reg-success-icon" aria-hidden="true" style={{ background: '#fef3c7', color: '#d97706' }}>&#9203;</div>
            <h2 className="reg-success-title">Registration Successful!</h2>
            <p className="reg-success-sub" style={{ color: '#6b7280', lineHeight: 1.6 }}>
              Your account has been created and is now
              <strong style={{ color: '#d97706' }}> pending admin approval</strong>.<br />
              You will be able to log in once an administrator approves your account.<br />
              <span style={{ color: '#10b981', fontWeight: 600 }}>Redirecting to login&hellip;</span>
            </p>
            <Link to="/login" className="reg-btn" style={{ display: 'inline-flex', marginTop: '1rem', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="reg-header">
              <span className="reg-cross" aria-hidden="true">&#10013;</span>
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
                <button className="reg-error-close" onClick={clearError} aria-label="Dismiss">&times;</button>
              </div>
            )}

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="reg-form" noValidate>
              {/* Name */}
              <div className="reg-field">
                <label htmlFor="reg-name" className="reg-label">Full Name</label>
                <div className="reg-input-wrap">
                  <svg className="reg-input-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <input id="reg-name" ref={firstRef} type="text" placeholder="Your full name" value={name}
                    onChange={(e) => { setName(e.target.value); clearError(); }} required autoComplete="name" className="reg-input" />
                </div>
              </div>

              {/* Mobile */}
              <div className="reg-field">
                <label htmlFor="reg-mobile" className="reg-label">Mobile Number</label>
                <div className="reg-input-wrap">
                  <svg className="reg-input-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <input id="reg-mobile" type="tel" placeholder="10-digit mobile number" value={mobile}
                    onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError(); }}
                    required autoComplete="tel" className="reg-input" maxLength={10} />
                </div>
              </div>

              {/* Password */}
              <div className="reg-field">
                <label htmlFor="reg-password" className="reg-label">Password</label>
                <div className="reg-input-wrap">
                  <svg className="reg-input-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <input id="reg-password" type="password" placeholder="Create a strong password" value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError(); }} required autoComplete="new-password" minLength={6} className="reg-input" />
                </div>
                <p className="reg-hint">Minimum 6 characters</p>
              </div>

              {/* Submit */}
              <button type="submit" className="reg-btn" disabled={loading}>
                {loading ? (
                  <><span className="reg-spinner" aria-hidden="true" />Creating Account&hellip;</>
                ) : (
                  <><span>Create Account</span>
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
