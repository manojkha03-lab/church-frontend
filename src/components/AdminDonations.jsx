import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Navigate } from 'react-router-dom';
import { AdminMenu } from './AdminDashboard';
import { API_URL } from '../config/api';

const METHODS = ['cash', 'check', 'upi', 'bank', 'stripe'];

const blank = { userId: '', amount: '', method: 'cash', note: '' };

const AdminDonations = () => {
  const { user, token } = useAuth();
  const toast = useToast();

  const [donations, setDonations] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [users, setUsers]         = useState([]);
  const [form, setForm]           = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo)   params.set('to', dateTo);
      const qs  = params.toString() ? `?${params}` : '';
      const res = await fetch(`${API_URL}/api/donations/all${qs}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setDonations(data.donations ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  }, [token, dateFrom, dateTo]);

  const fetchUsers = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => { fetchDonations(); fetchUsers(); }, [fetchDonations, fetchUsers]);

  if (user?.role !== 'admin') return <Navigate to="/" />;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.userId || !form.amount) { toast.warning('User and amount are required'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/donations/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (res.ok) {
        toast.success('Donation recorded');
        setForm(blank);
        setShowForm(false);
        fetchDonations();
      } else {
        const e = await res.json();
        toast.error(e.message || 'Failed to record donation');
      }
    } catch {
      toast.error('Failed to record donation');
    } finally {
      setSubmitting(false);
    }
  };

  const completed  = donations.filter(d => d.status === 'completed');
  const pending    = donations.filter(d => d.status === 'pending');

  return (
    <div className="admin-container">
      <AdminMenu />
      <div className="admin-content">

        <div className="admin-topbar">
          <div>
            <h2 className="admin-page-title">Donations</h2>
            <p className="admin-page-sub">Track and record all financial contributions</p>
          </div>
          <button className="admin-btn admin-btn--primary" onClick={() => setShowForm(s => !s)}>
            {showForm ? 'Cancel' : '+ Add Donation'}
          </button>
        </div>

        {/* Summary cards */}
        <div className="dash-stat-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="dash-stat-card dash-stat-card--accent">
            <div className="dash-stat-card__body">
              <span className="dash-stat-card__value">${total.toFixed(2)}</span>
              <span className="dash-stat-card__label">Total (filtered)</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-card__body">
              <span className="dash-stat-card__value">{completed.length}</span>
              <span className="dash-stat-card__label">Completed</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-card__body">
              <span className="dash-stat-card__value">{pending.length}</span>
              <span className="dash-stat-card__label">Pending</span>
            </div>
          </div>
        </div>

        {/* Manual donation form */}
        {showForm && (
          <form className="admin-form-card" onSubmit={handleAdd}>
            <h3 className="admin-section-heading" style={{ marginTop: 0 }}>Record New Donation</h3>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Member</label>
                <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))} className="admin-select" required>
                  <option value="">Select member...</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className="admin-form-group">
                <label>Amount ($)</label>
                <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="admin-input" placeholder="0.00" required />
              </div>
              <div className="admin-form-group">
                <label>Method</label>
                <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className="admin-select">
                  {METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="admin-form-group">
              <label>Note (optional)</label>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} className="admin-input" placeholder="e.g. Sunday tithe, Easter offering..." />
            </div>
            <div className="admin-form-footer">
              <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Record Donation'}
              </button>
            </div>
          </form>
        )}

        {/* Date filter */}
        <div className="admin-filter-row">
          <label>From:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="admin-input admin-input--sm" />
          <label>To:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="admin-input admin-input--sm" />
          <button className="admin-btn" onClick={fetchDonations}>Filter</button>
          {(dateFrom || dateTo) && <button className="admin-btn" onClick={() => { setDateFrom(''); setDateTo(''); }}>Clear</button>}
        </div>

        {/* Donations table */}
        {loading ? (
          <div className="admin-loading"><span className="dash-spinner" />Loading...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(d => (
                  <tr key={d._id}>
                    <td>{d.user?.name || 'Unknown'}</td>
                    <td>{d.user?.email || '—'}</td>
                    <td>${d.amount.toFixed(2)}</td>
                    <td><span className="admin-badge admin-badge--method">{d.method}</span></td>
                    <td><span className={`admin-badge admin-badge--${d.status}`}>{d.status}</span></td>
                    <td>{d.note || '—'}</td>
                    <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {donations.length === 0 && <p className="admin-empty">No donations found for the selected period.</p>}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDonations;
