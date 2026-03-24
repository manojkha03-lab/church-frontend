import { Link } from 'react-router-dom';

const Waiting = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #4facfe, #ffffff)', padding: '1rem' }}>
    <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '2.5rem 2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#92400e', marginBottom: '0.75rem' }}>Pending Approval</h1>
      <p style={{ color: '#78716c', lineHeight: 1.7, marginBottom: '1.5rem' }}>
        Your account has been created and is waiting for an administrator to approve it. You&apos;ll be able to access your dashboard once approved.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/login" style={{ padding: '0.6rem 1.5rem', borderRadius: 8, background: '#4f46e5', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
          Try Signing In
        </Link>
        <Link to="/" style={{ padding: '0.6rem 1.5rem', borderRadius: 8, border: '1px solid #d1d5db', color: '#374151', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
          Go Home
        </Link>
      </div>
    </div>
  </div>
);

export default Waiting;
