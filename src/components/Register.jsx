import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../config/firebase';

// ─── 6-box OTP input component ───────────────────────────────────────────────
const OtpInput = ({ value, onChange, disabled }) => {
  const inputRefs = useRef([]);
  const digits = value.padEnd(6, '').slice(0, 6).split('');

  const focusInput = (idx) => inputRefs.current[idx]?.focus();

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    onChange(next.join(''));
    if (val && idx < 5) focusInput(idx + 1);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      focusInput(idx - 1);
    }
    if (e.key === 'ArrowLeft' && idx > 0) focusInput(idx - 1);
    if (e.key === 'ArrowRight' && idx < 5) focusInput(idx + 1);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      focusInput(Math.min(pasted.length, 5));
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => inputRefs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          disabled={disabled}
          autoFocus={i === 0}
          style={{
            width: 44, height: 52, textAlign: 'center', fontSize: '1.25rem',
            fontWeight: 700, borderRadius: 10, border: '2px solid #d1d5db',
            outline: 'none', transition: 'border-color 0.15s',
            ...(d ? { borderColor: '#6366f1' } : {}),
          }}
          onFocus={e => { e.target.style.borderColor = '#6366f1'; }}
          onBlur={e => { if (!d) e.target.style.borderColor = '#d1d5db'; }}
          aria-label={`OTP digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

// ─── Main Register component ─────────────────────────────────────────────────
const Register = () => {
  const [step, setStep]               = useState(1); // 1=form, 2=otp, 3=pending
  const [name, setName]               = useState('');
  const [mobile, setMobile]           = useState('');
  const [password, setPassword]       = useState('');
  const [otp, setOtp]                 = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [visible, setVisible]         = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmResult, setConfirmResult] = useState(null);

  const navigate  = useNavigate();
  const firstRef  = useRef(null);
  const recaptchaRef = useRef(null);

  // Trigger enter animation
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (visible && step === 1) firstRef.current?.focus();
  }, [visible, step]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  // Close modal
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

  // Setup invisible reCAPTCHA
  const setupRecaptcha = useCallback(() => {
    if (recaptchaRef.current) return;
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {},
    });
  }, []);

  // Step 1: Validate → Send Firebase OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check availability on backend first
      const checkRes = await fetch(`${API_URL}/api/auth/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) {
        setError(checkData.message || 'Validation failed.');
        setLoading(false);
        return;
      }

      // Setup reCAPTCHA and send OTP via Firebase
      setupRecaptcha();
      const phoneNumber = '+91' + mobile; // India country code — adjust as needed
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaRef.current);
      setConfirmResult(result);
      setStep(2);
      setResendTimer(30);
    } catch (err) {
      console.error('Firebase OTP error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Too many OTP requests. Please wait and try again later.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format.');
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.');
      }
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch {}
        recaptchaRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP via Firebase → Register on backend
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Verify OTP with Firebase
      await confirmResult.confirm(otp);

      // OTP verified — register user on backend
      const regRes = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, password }),
      });
      const regData = await regRes.json();
      if (regRes.ok) {
        setStep(3); // Show pending approval screen
      } else {
        setError(regData.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('OTP verify error:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.');
      } else {
        setError(err.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      // Reset reCAPTCHA
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch {}
        recaptchaRef.current = null;
      }
      setupRecaptcha();
      const phoneNumber = '+91' + mobile;
      const result = await signInWithPhoneNumber(auth, phoneNumber, recaptchaRef.current);
      setConfirmResult(result);
      setOtp('');
      setResendTimer(30);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear(); } catch {}
        recaptchaRef.current = null;
      }
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

        {/* Success state → Pending Approval */}
        {step === 3 ? (
          <div className="reg-success">
            <div className="reg-success-icon" aria-hidden="true" style={{ background: '#fef3c7', color: '#d97706' }}>⏳</div>
            <h2 className="reg-success-title">Registration Successful!</h2>
            <p className="reg-success-sub" style={{ color: '#6b7280', lineHeight: 1.6 }}>
              Your account has been created and is now
              <strong style={{ color: '#d97706' }}> pending admin approval</strong>.
              <br />
              You will be able to log in once an administrator approves your account.
            </p>
            <Link
              to="/login"
              className="reg-btn"
              style={{ display: 'inline-flex', marginTop: '1rem', textDecoration: 'none' }}
            >
              Go to Login
            </Link>
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
            {step === 1 ? (
            <form onSubmit={handleSendOtp} className="reg-form" noValidate>

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

              {/* Mobile */}
              <div className="reg-field">
                <label htmlFor="reg-mobile" className="reg-label">Mobile Number</label>
                <div className="reg-input-wrap">
                  <svg className="reg-input-icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  <input
                    id="reg-mobile"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError(); }}
                    required
                    autoComplete="tel"
                    className="reg-input"
                    maxLength={10}
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

              {/* Invisible reCAPTCHA container */}
              <div id="recaptcha-container" />

              {/* Submit - Send OTP */}
              <button type="submit" className="reg-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="reg-spinner" aria-hidden="true" />
                    Sending OTP&hellip;
                  </>
                ) : (
                  <>
                    <span>Send OTP</span>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>
            </form>
            ) : step === 2 ? (
            <form onSubmit={handleVerifyAndRegister} className="reg-form" noValidate>

              <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '0.5rem' }}>
                OTP sent to <strong>+91 {mobile}</strong>
              </p>
              <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Enter the 6-digit code from your SMS
              </p>

              {/* 6-box OTP Input */}
              <div className="reg-field">
                <label className="reg-label" style={{ textAlign: 'center', display: 'block' }}>Verification Code</label>
                <OtpInput value={otp} onChange={(val) => { setOtp(val); clearError(); }} disabled={loading} />
              </div>

              {/* Verify & Register */}
              <button type="submit" className="reg-btn" disabled={loading || otp.length < 6}>
                {loading ? (
                  <>
                    <span className="reg-spinner" aria-hidden="true" />
                    Verifying&hellip;
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Create Account</span>
                    <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18" aria-hidden="true">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </>
                )}
              </button>

              {/* Resend / Back */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '0.875rem' }} onClick={() => { setStep(1); setOtp(''); clearError(); }}>
                  &#8592; Back
                </button>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: resendTimer > 0 ? '#9ca3af' : '#6366f1', fontSize: '0.875rem', fontWeight: resendTimer > 0 ? 400 : 600 }}
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                >
                  {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
            ) : null}

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