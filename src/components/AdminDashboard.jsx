import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { API_URL } from '../config/api';

const SHEET_API = 'https://script.google.com/macros/s/AKfycbx93f9Sl6DslSWhsumC9XqYPg1cxsAH1atVgfPATngvRUg0LJCYpfDFhmo39zTxGN4Dvw/exec';

const normalizeSheetData = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

const fetchSheetData = async () => {
  try {
    const res = await fetch(SHEET_API, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Sheet API returned ${res.status}`);
    }
    const data = await res.json();
    return normalizeSheetData(data);
  } catch (err) {
    console.error('Sheet fetch error:', err);
    return [];
  }
};

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

const RANGE_OPTIONS = [
  { key: '24h', label: '24h' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
];

const RANGE_TO_MS = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

const Sparkline = ({ points = [], stroke = '#0f766e' }) => {
  const width = 120;
  const height = 36;
  const padding = 3;

  if (!Array.isArray(points) || points.length === 0) {
    return <div className="h-9" />;
  }

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;

  const polyline = points
    .map((value, index) => {
      const x = padding + index * stepX;
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="mt-2" viewBox={`0 0 ${width} ${height}`} width="100%" height="36" role="img" aria-label="Trend sparkline">
      <polyline points={polyline} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const AnalyticsCard = ({ label, value, trend, series }) => {
  const title = `${label}: ${trend?.detail || 'No trend data'}`;
  const stroke = trend?.direction === 'up' ? '#15803d' : trend?.direction === 'down' ? '#be123c' : '#475569';

  return (
    <div className="p-4 bg-white rounded-xl shadow border border-slate-100">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm text-slate-600">{label}</h4>
        <span className="text-slate-400 text-xs cursor-help" title={title} aria-label={title}>ⓘ</span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <span className={`inline-flex mt-2 px-2 py-1 text-[11px] rounded-full font-medium ${trend.badgeClass}`} title={title}>
        {trend.text}
      </span>
      <Sparkline points={series} stroke={stroke} />
    </div>
  );
};

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [sheetData, setSheetData] = useState([]);
  const [sheetLoading, setSheetLoading] = useState(true);
  const [lastSheetSync, setLastSheetSync] = useState(null);
  const [selectedRange, setSelectedRange] = useState('24h');

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

  useEffect(() => {
    if (user?.role !== 'admin') return;

    let active = true;
    const syncSheetData = async () => {
      const rows = await fetchSheetData();
      if (!active) return;
      setSheetData(Array.isArray(rows) ? rows : []);
      setSheetLoading(false);
      setLastSheetSync(new Date());
    };

    syncSheetData();
    const interval = setInterval(syncSheetData, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user?.role]);

  const dismissNotification = async (id) => {
    const res = await fetch(`${API_URL}/api/admin/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setNotifications(notifications.filter(n => n._id !== id));
    }
  };

  const getType = (entry) => String(entry?.type || '').toUpperCase();
  const getEntryDate = (entry) => {
    const raw = entry?.timestamp || entry?.time || entry?.createdAt || entry?.date;
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const parsedSheetData = useMemo(
    () => sheetData.map((entry) => ({ ...entry, __date: getEntryDate(entry) })),
    [sheetData]
  );

  const hasDatedData = parsedSheetData.some((entry) => entry.__date);
  const rangeMs = RANGE_TO_MS[selectedRange] || RANGE_TO_MS['24h'];
  const now = Date.now();
  const currentStart = now - rangeMs;
  const previousStart = now - (2 * rangeMs);

  const filteredSheetData = useMemo(() => {
    if (!hasDatedData) return parsedSheetData;
    return parsedSheetData.filter((entry) => {
      if (!entry.__date) return false;
      const time = entry.__date.getTime();
      return time >= currentStart && time <= now;
    });
  }, [parsedSheetData, hasDatedData, currentStart, now]);

  const countByType = (items, type) => items.filter((d) => getType(d) === String(type).toUpperCase()).length;

  const formatTrend = (current, previous) => {
    const delta = current - previous;
    const windowLabel = selectedRange;

    if (delta === 0) {
      return {
        text: 'No change',
        badgeClass: 'bg-slate-100 text-slate-600',
        direction: 'flat',
        detail: `No difference versus previous ${windowLabel} window (${current} vs ${previous})`,
      };
    }

    if (previous === 0) {
      return {
        text: delta > 0 ? `+${delta} new` : `${delta} drop`,
        badgeClass: delta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
        direction: delta > 0 ? 'up' : 'down',
        detail: delta > 0
          ? `${current} in current ${windowLabel}; previous ${windowLabel} had 0`
          : `${current} in current ${windowLabel}; down ${Math.abs(delta)} from previous ${windowLabel}`,
      };
    }

    const percent = Math.round((Math.abs(delta) / previous) * 100);
    return {
      text: delta > 0 ? `↑ ${percent}%` : `↓ ${percent}%`,
      badgeClass: delta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700',
      direction: delta > 0 ? 'up' : 'down',
      detail: delta > 0
        ? `${current} vs ${previous} compared to previous ${windowLabel} (${percent}% increase)`
        : `${current} vs ${previous} compared to previous ${windowLabel} (${percent}% decrease)`,
    };
  };

  const getWindowTrend = (type) => {
    const normalized = String(type).toUpperCase();
    const latestWindow = sheetData.slice(-10);
    const previousWindow = sheetData.slice(-20, -10);
    const current = latestWindow.filter((d) => getType(d) === normalized).length;
    const previous = previousWindow.filter((d) => getType(d) === normalized).length;
    return formatTrend(current, previous);
  };

  const getTrend = (type) => {
    const normalized = String(type).toUpperCase();
    let current = 0;
    let previous = 0;
    let datedCount = 0;

    for (const entry of sheetData) {
      if (getType(entry) !== normalized) continue;
      const date = getEntryDate(entry);
      if (!date) continue;
      datedCount += 1;
      const time = date.getTime();

      if (time >= currentStart && time <= now) {
        current += 1;
      } else if (time >= previousStart && time < currentStart) {
        previous += 1;
      }
    }

    // Fallback to row-window trend if sheet rows do not include parseable timestamps.
    if (datedCount === 0) {
      return getWindowTrend(type);
    }

    return formatTrend(current, previous);
  };

  const buildSparklineSeries = (type) => {
    const normalized = String(type).toUpperCase();

    if (!hasDatedData) {
      const fallback = parsedSheetData.slice(-12);
      return fallback.map((entry) => (getType(entry) === normalized ? 1 : 0));
    }

    const bucketCount = selectedRange === '24h' ? 12 : 10;
    const bucketMs = rangeMs / bucketCount;
    const buckets = Array.from({ length: bucketCount }, () => 0);

    filteredSheetData.forEach((entry) => {
      if (getType(entry) !== normalized || !entry.__date) return;
      const diff = entry.__date.getTime() - currentStart;
      if (diff < 0 || diff > rangeMs) return;
      const index = Math.min(bucketCount - 1, Math.floor(diff / bucketMs));
      buckets[index] += 1;
    });

    return buckets;
  };

  const totalLogins = countByType(filteredSheetData, 'LOGIN');
  const totalUsers = countByType(filteredSheetData, 'REGISTER');
  const totalEvents = countByType(filteredSheetData, 'EVENT_CREATED');
  const totalDonations = countByType(filteredSheetData, 'DONATION');
  const recentSheetActivity = filteredSheetData.slice(-10).reverse();
  const usersTrend = getTrend('REGISTER');
  const loginsTrend = getTrend('LOGIN');
  const eventsTrend = getTrend('EVENT_CREATED');
  const donationsTrend = getTrend('DONATION');
  const usersSeries = buildSparklineSeries('REGISTER');
  const loginsSeries = buildSparklineSeries('LOGIN');
  const eventsSeries = buildSparklineSeries('EVENT_CREATED');
  const donationsSeries = buildSparklineSeries('DONATION');

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
              <StatCard icon="💰" label="Total Donations"  value={`$${(stats?.totalDonations ?? 0).toFixed(2)}`} to="/admin/donations" accent />
              <StatCard icon="✓" label="Completed Gifts"  value={stats?.completedDonations ?? 0}  to="/admin/donations" />
            </div>

            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <h3 className="admin-section-heading mb-0">Google Sheets Analytics</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setSelectedRange(option.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        selectedRange === option.key
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  <p className="text-xs text-gray-500">
                    Auto-refresh: 30s{lastSheetSync ? ` · Last sync ${lastSheetSync.toLocaleTimeString()}` : ''}
                  </p>
                </div>
              </div>

              {sheetLoading ? (
                <div className="admin-loading"><span className="dash-spinner" />Loading analytics...</div>
              ) : (
                <>
                  {!hasDatedData && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                      Timestamp fields were not found for all sheet rows. Range filters use available dated rows and trends fall back to row windows when needed.
                    </p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    <AnalyticsCard label="Total Users" value={totalUsers} trend={usersTrend} series={usersSeries} />
                    <AnalyticsCard label="Logins" value={totalLogins} trend={loginsTrend} series={loginsSeries} />
                    <AnalyticsCard label="Events" value={totalEvents} trend={eventsTrend} series={eventsSeries} />
                    <AnalyticsCard label="Donations" value={totalDonations} trend={donationsTrend} series={donationsSeries} />
                  </div>

                  <div className="mt-4 bg-white rounded-xl shadow border border-slate-100 p-4">
                    <h4 className="text-base font-semibold text-slate-900 mb-3">Recent Activity</h4>
                    {recentSheetActivity.length === 0 ? (
                      <p className="text-sm text-slate-500">No sheet activity available yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {recentSheetActivity.map((item, i) => (
                          <div key={`${item?.timestamp || item?.time || i}-${i}`} className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="break-words">
                              <span className="font-semibold text-slate-900">{item?.type || 'UNKNOWN'}</span>
                              <span className="text-slate-600"> - {item?.email || item?.name || 'N/A'}</span>
                            </div>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {item?.timestamp || item?.time || item?.createdAt || ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
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
