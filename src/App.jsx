import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// ─── Page components ──────────────────────────────────────────────────────────
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Waiting from './components/Waiting';
import Profile from './components/Profile';
import Events from './components/Events';
import Sermons from './components/Sermons';
import Contact from './components/Contact';
import Announcements from './components/Announcements';
import Donations from './components/Donations';
import PrayerRequests from './components/PrayerRequests';
import Baptisms from './components/Baptisms';
import Marriages from './components/Marriages';
import Sacraments from './components/Sacraments';
import MemberDashboard from './components/MemberDashboard';
import MemberDirectory from './components/MemberDirectory';
import AdminDashboard from './components/AdminDashboard';
import AdminEvents from './components/AdminEvents';
import AdminSermons from './components/AdminSermons';
import AdminAnnouncements from './components/AdminAnnouncements';
import AdminPrayerRequests from './components/AdminPrayerRequests';
import AdminDonations from './components/AdminDonations';
import AdminBaptisms from './components/AdminBaptisms';
import AdminMarriages from './components/AdminMarriages';
import AdminSacraments from './components/AdminSacraments';
import AdminUsers from './components/AdminUsers';
import AdminRecords from './components/AdminRecords';

// ─── SVG icon helper ──────────────────────────────────────────────────────────
const NavIcon = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: 'orange', color: 'black', padding: '20px', margin: '20px', border: '2px solid red' }}>
          <h2>Component Error</h2>
          <p>A component failed to load: {this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Route guards ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { token, authLoading } = useAuth();
  if (authLoading) {
    return <div className="container" style={{ padding: '2rem' }}>Loading account...</div>;
  }
  return token ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ children, allowedRole }) => {
  const { user, role, token, authLoading } = useAuth();

  if (authLoading) {
    return <div className="container" style={{ padding: '2rem' }}>Loading account...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const effectiveRole = user?.role || role || localStorage.getItem('role');

  if (!effectiveRole) {
    return <Navigate to="/login" replace />;
  }

  if (effectiveRole !== allowedRole) {
    return (
      <Navigate
        to={effectiveRole === 'admin' ? '/admin/dashboard' : '/member/dashboard'}
        replace
      />
    );
  }

  return children;
};

const AdminRoute = ({ children }) => <RoleRoute allowedRole="admin">{children}</RoleRoute>;
const MemberRoute = ({ children }) => <RoleRoute allowedRole="member">{children}</RoleRoute>;

// ─── Routes ───────────────────────────────────────────────────────────────────
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/waiting" element={<Waiting />} />
    <Route path="/pending" element={<Waiting />} />
    <Route path="/dashboard" element={<Navigate to="/member/dashboard" replace />} />
    <Route path="/profile" element={<Navigate to="/member/profile" replace />} />

    <Route path="/member" element={<Navigate to="/member/dashboard" replace />} />
    <Route path="/member/dashboard" element={<MemberRoute><MemberDashboard /></MemberRoute>} />
    <Route path="/member/profile" element={<MemberRoute><Profile /></MemberRoute>} />

    <Route path="/profile/:id" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    <Route path="/events" element={<Events />} />
    <Route path="/sermons" element={<Sermons />} />
    <Route path="/contact" element={<Contact />} />
    <Route path="/announcements" element={<Announcements />} />
    <Route path="/donations" element={<MemberRoute><Donations /></MemberRoute>} />
    <Route path="/prayer-requests" element={<MemberRoute><PrayerRequests /></MemberRoute>} />
    <Route path="/baptisms" element={<MemberRoute><Baptisms /></MemberRoute>} />
    <Route path="/marriages" element={<MemberRoute><Marriages /></MemberRoute>} />
    <Route path="/sacraments" element={<MemberRoute><Sacraments /></MemberRoute>} />
    <Route path="/members" element={<MemberRoute><MemberDirectory /></MemberRoute>} />
    <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
    <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
    <Route path="/admin/sermons" element={<AdminRoute><AdminSermons /></AdminRoute>} />
    <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncements /></AdminRoute>} />
    <Route path="/admin/prayer-requests" element={<AdminRoute><AdminPrayerRequests /></AdminRoute>} />
    <Route path="/admin/donations" element={<AdminRoute><AdminDonations /></AdminRoute>} />
    <Route path="/admin/baptisms" element={<AdminRoute><AdminBaptisms /></AdminRoute>} />
    <Route path="/admin/marriages" element={<AdminRoute><AdminMarriages /></AdminRoute>} />
    <Route path="/admin/sacraments" element={<AdminRoute><AdminSacraments /></AdminRoute>} />
    <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
    <Route path="/admin/records" element={<AdminRoute><AdminRecords /></AdminRoute>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const sidebarLinks = [
  { to: '/member/dashboard', label: 'Dashboard', d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', auth: true },
  { to: '/announcements', label: 'Announcements', d: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
  { to: '/events', label: 'Events', d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/sermons', label: 'Sermons', d: 'M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z' },
  { to: '/prayer-requests', label: 'Prayer Requests', d: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z' },
  { to: '/donations', label: 'Donations', d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];
const sacramentLinks = [
  { to: '/baptisms', label: 'Baptisms', d: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { to: '/marriages', label: 'Marriages', d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { to: '/sacraments', label: 'Sacraments', d: 'M12 2v20M2 12h20' },
  { to: '/members', label: 'Members', d: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75' },
];

const SidebarLink = ({ to, label, d }) => {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(to + '/');
  return (
    <Link to={to} className={`sidebar-link${active ? ' active' : ''}`}>
      <NavIcon d={d} />
      {label}
    </Link>
  );
};

const Sidebar = ({ user, logout }) => (
  <aside className="sidebar">
    <div className="sidebar-card">
      <div className="sidebar-header-card">
        <span className="sidebar-cross">✝</span>
        <div className="sidebar-title">
          <h1>Sacred Heart Church</h1>
          <p className="sidebar-tagline">Faith · Love · Service</p>
        </div>
      </div>
    </div>

    <nav className="sidebar-nav">
      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Menu</h3>
        {sidebarLinks.map(({ to, label, d, auth }) =>
          (!auth || user) && <SidebarLink key={to} to={to} label={label} d={d} />
        )}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Sacraments</h3>
        {sacramentLinks.map(({ to, label, d }) => (
          <SidebarLink key={to} to={to} label={label} d={d} />
        ))}
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <h3 className="sidebar-section-title">Account</h3>
        {user ? (
          <>
            <SidebarLink to="/member/profile" label="Profile" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" />
            {user.role === 'admin' && (
              <SidebarLink to="/admin/dashboard" label="Admin Panel" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            )}
            <button onClick={logout} className="sidebar-link logout-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: '10px', fontSize: '0.875rem', fontWeight: 500 }}>
              <NavIcon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              Sign Out
            </button>
          </>
        ) : (
          <>
            <SidebarLink to="/login" label="Sign In" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            <Link to="/register" className="sidebar-link register" style={{ justifyContent: 'center', marginTop: '0.25rem' }}>
              Join Us — Register
            </Link>
          </>
        )}
      </div>
    </nav>
  </aside>
);

// ─── App Shell ────────────────────────────────────────────────────────────────
const AppShell = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isRegisterPage = location.pathname === '/register';
  const isLoginPage = location.pathname === '/login';
  const isPendingPage = location.pathname === '/pending' || location.pathname === '/waiting';
  const isDashboard = location.pathname === '/dashboard' || location.pathname === '/member/dashboard';
  const isAdminPage = location.pathname.startsWith('/admin');

  if (isRegisterPage) {
    return <AppRoutes />;
  }

  const fullWidth = isHomePage || isDashboard || isAdminPage || isLoginPage || isPendingPage;

  return (
    <div className={fullWidth ? 'app-wrapper app-home' : 'app-wrapper'}>
      {!fullWidth && <Sidebar user={user} logout={logout} />}
      <main className={fullWidth ? 'main-content main-content-home' : 'main-content main-with-sidebar'}>
        {fullWidth ? <AppRoutes /> : <div className="container"><AppRoutes /></div>}
      </main>
    </div>
  );
};

const AppContent = () => (
  <ErrorBoundary>
    <Router>
      <AppShell />
    </Router>
  </ErrorBoundary>
);

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </AuthProvider>
);

export default App;
