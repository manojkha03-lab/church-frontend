import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { API_URL } from '../config/api';

// Shared sidebar nav exported for use in all admin pages
const AdminMenu = () => (
  <nav className="admin-sidebar">
    <h3>Admin Panel</h3>
    <Link to="/admin/dashboard"       className="admin-menu-item">Dashboard</Link>
    <Link to="/admin/users"           className="admin-menu-item">Users</Link>
    <Link to="/admin/donations"       className="admin-menu-item">Donations</Link>
    <Link to="/admin/records"         className="admin-menu-item">Records</Link>
    <hr style={{ border: 'none', borderTop: '1px solid rgba(47,93,255,0.12)', margin: '0.5rem 0' }} />
    <Link to="/admin/events"          className="admin-menu-item">Events</Link>
    <Link to="/admin/sermons"         className="admin-menu-item">Sermons</Link>
    <Link to="/admin/announcements"   className="admin-menu-item">Announcements</Link>
    <Link to="/admin/prayer-requests" className="admin-menu-item">Prayer Requests</Link>
    <Link to="/admin/baptisms"        className="admin-menu-item">Baptisms</Link>
    <Link to="/admin/marriages"       className="admin-menu-item">Marriages</Link>
    <Link to="/admin/sacraments"      className="admin-menu-item">Sacraments</Link>
  </nav>
);

const StatCard = ({ label, value, sub, to, icon, accent }) => (
  <Link to={to} className={`dash-stat-card${accent ? ' dash-stat-card--accent' : ''} p-4 sm:p-6 rounded-xl shadow hover:shadow-lg transition-all`}>
    <span className="dash-stat-card__icon text-2xl sm:text-3xl" aria-hidden="true">{icon}</span>
    <div className="dash-stat-card__body mt-3">
      <span className="dash-stat-card__value block text-xl sm:text-2xl font-bold">{value}</span>
      <span className="dash-stat-card__label block text-xs sm:text-sm text-gray-600 mt-1">{label}</span>
      {sub && <span className="dash-stat-card__sub block text-xs text-gray-500 mt-2">{sub}</span>}
    </div>
  </Link>
);

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const headers = { Authorization: `Bearer ${token}` };
    const loadJson = async (url, fallback) => {
      try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
          return fallback;
        }
        return await response.json();
      } catch {
        return fallback;
      }
    };

    Promise.all([
      loadJson(`${API_URL}/api/admin/stats`, null),
      loadJson(`${API_URL}/api/admin/notifications`, []),
      loadJson(`${API_URL}/api/admin/activity-logs`, []),
    ]).then(([statsData, notifs, logs]) => {
      setStats(statsData);
      setNotifications(Array.isArray(notifs) ? notifs : []);
      setActivityLogs(Array.isArray(logs) ? logs : []);
      setLoading(false);
    });
  }, [user, token]);

  const dismissNotification = async (id) => {
    const res = await fetch(`${API_URL}/api/admin/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setNotifications(notifications.filter(n => n._id !== id));
    }
  };

  if (user?.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="admin-container">
      <AdminMenu />
      <div className="admin-content">

        <div className="admin-topbar">
          <div>
            <h2 className="admin-page-title">Dashboard</h2>
            <p className="admin-page-sub">Welcome back, {user?.name} - Sacred Heart Church</p>
          </div>
          <span className="admin-badge admin-badge--gold">Admin</span>
        </div>

        {loading ? (
          <div className="admin-loading"><span className="dash-spinner" />Loading stats...</div>
        ) : (
          <>
            {/* Stats Grid - Responsive: 1 col on mobile, 2 on tablet, 4 on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <StatCard icon="👥" label="Total Members"    value={stats?.totalUsers ?? 0}          to="/admin/users"     accent />
              <StatCard icon="⏱️"  label="Pending Approval" value={stats?.pendingUsers ?? 0}         to="/admin/users"     accent={stats?.pendingUsers > 0} />
              <StatCard icon="💰" label="Total Donations"  value={`₹${(stats?.totalDonations ?? 0).toFixed(2)}`} to="/admin/donations" accent />
              <StatCard icon="✓" label="Completed Gifts"  value={stats?.completedDonations ?? 0}  to="/admin/donations" />
            </div>

            <h3 className="admin-section-heading">Quick Access</h3>
            {/* Quick Access Grid - Responsive: 2 cols on mobile, 4 on tablet, 4 on desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[
                { to: '/admin/events',           label: 'Events' },
                { to: '/admin/sermons',          label: 'Sermons' },
                { to: '/admin/announcements',    label: 'Announcements' },
                { to: '/admin/prayer-requests',  label: 'Prayers' },
                { to: '/admin/baptisms',         label: 'Baptisms' },
                { to: '/admin/marriages',        label: 'Marriages' },
                { to: '/admin/sacraments',       label: 'Sacraments' },
                { to: '/admin/records',          label: 'Records' },
              ].map(({ to, label }) => (
                <Link key={to} to={to} className="dash-quick-tile p-3 sm:p-4 rounded-lg border border-blue-200 text-center text-sm sm:text-base font-medium hover:bg-blue-50 transition">
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            {/* Recent Logins Table - Responsive */}
            {stats?.recentLogins?.length > 0 && (
              <>
                <h3 className="admin-section-heading">Recent Login Activity</h3>
                
                {/* Mobile Cards View */}
                <div className="block md:hidden space-y-3 mb-6">
                  {stats.recentLogins.map(u => (
                    <div key={u._id} className="bg-white rounded-lg shadow p-4">
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-600 break-all">{u.email}</p>
                        </div>
                        <span className={`admin-badge admin-badge--${u.status} text-xs flex-shrink-0`}>{u.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-gray-600">Role</p>
                          <p className="font-medium">{u.role}</p>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-gray-600">Last Login</p>
                          <p className="font-medium">{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="admin-table-wrap hidden md:block overflow-x-auto mb-6">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentLogins.map(u => (
                        <tr key={u._id}>
                          <td className="break-words">{u.name}</td>
                          <td className="break-all">{u.email}</td>
                          <td><span className={`admin-badge admin-badge--${u.role}`}>{u.role}</span></td>
                          <td><span className={`admin-badge admin-badge--${u.status}`}>{u.status}</span></td>
                          <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Notifications Panel */}
            {notifications.length > 0 && (
              <>
                <h3 className="admin-section-heading">Notifications</h3>
                <div className="flex flex-col gap-2 mb-6">
                  {notifications.slice(0, 10).map(n => (
                    <div key={n._id} className="bg-white rounded-lg shadow p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm break-words">{n.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(n.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => dismissNotification(n._id)}
                        className="flex-shrink-0 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition"
                      >
                        Dismiss
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Activity Logs Table - Responsive */}
            {activityLogs.length > 0 && (
              <>
                <h3 className="admin-section-heading">Activity Logs</h3>

                {/* Mobile Cards View */}
                <div className="block md:hidden space-y-3">
                  {activityLogs.slice(0, 20).map(log => (
                    <div key={log._id} className="bg-white rounded-lg shadow p-4">
                      <p className="font-semibold text-gray-900 text-sm">{log.action}</p>
                      <p className="text-xs text-gray-600 mt-1">Target: {log.targetUser || '-'}</p>
                      <p className="text-xs text-gray-500 mt-2">{new Date(log.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="admin-table-wrap hidden md:block overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Target</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.slice(0, 20).map(log => (
                        <tr key={log._id}>
                          <td className="break-words">{log.action}</td>
                          <td className="break-words">{log.targetUser || '-'}</td>
                          <td>{new Date(log.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
};

export { AdminMenu };
export default AdminDashboard;
