import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminMenu } from './AdminDashboard';
import { API_URL } from '../config/api';

const AdminRecords = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  if (user?.role !== 'admin') return <Navigate to="/" />;

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, donationsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/donations/all`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const statsData = await statsRes.json();
      const donationsData = await donationsRes.json();

      setStats(statsData || null);
      setDonations(donationsData?.donations || []);
    } catch {
      setStats(null);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <div className="admin-container">
      <AdminMenu />
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h2 className="admin-page-title">Records</h2>
            <p className="admin-page-sub">Audit log of member login activity and donation history</p>
          </div>
          <button className="admin-btn" onClick={loadRecords}>Refresh</button>
        </div>

        {loading ? (
          <div className="admin-loading"><span className="dash-spinner" />Loading records...</div>
        ) : (
          <>
            <h3 className="admin-section-heading">Login Activity</h3>
            <div className="admin-table-wrap" style={{ marginBottom: '1.25rem' }}>
              <table className="table">
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
                  {(stats?.recentLogins || []).map((u) => (
                    <tr key={u._id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td><span className={`admin-badge admin-badge--${u.role}`}>{u.role}</span></td>
                      <td><span className={`admin-badge admin-badge--${u.status}`}>{u.status}</span></td>
                      <td>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(stats?.recentLogins || []).length === 0 && <p className="admin-empty">No recent login records found.</p>}
            </div>

            <h3 className="admin-section-heading">Donation History</h3>
            <div className="admin-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Donor</th>
                    <th>Email</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d) => (
                    <tr key={d._id}>
                      <td>{d.user?.name || 'Unknown'}</td>
                      <td>{d.user?.email || '—'}</td>
                      <td>${d.amount.toFixed(2)}</td>
                      <td><span className="admin-badge admin-badge--method">{d.method}</span></td>
                      <td><span className={`admin-badge admin-badge--${d.status}`}>{d.status}</span></td>
                      <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {donations.length === 0 && <p className="admin-empty">No donation records found.</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminRecords;
