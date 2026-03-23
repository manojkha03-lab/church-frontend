import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { AdminMenu } from './AdminDashboard';
import { API_URL } from '../config/api';

const AdminAnnouncements = () => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    startDate: '',
    endDate: '',
    pinned: false,
  });

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetch(`${API_URL}/api/announcements`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  }, [user, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      const data = await res.json();
      setAnnouncements([...announcements, data.announcement]);
      setFormData({ title: '', content: '', startDate: '', endDate: '', pinned: false });
      setShowForm(false);
      toast.success('Announcement posted');
    } else {
      const error = await res.json();
      toast.error(error.message || 'Failed to post announcement');
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API_URL}/api/announcements/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setAnnouncements(announcements.filter(a => a._id !== id));
      toast.success('Announcement deleted');
    } else {
      const error = await res.json();
      toast.error(error.message || 'Failed to delete announcement');
    }
  };

  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="admin-container">
      <AdminMenu />
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h2 className="admin-page-title">Manage Announcements</h2>
            <p className="admin-page-sub">Publish updates for members and visitors</p>
          </div>
          <button className="admin-btn admin-btn--primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Post Announcement'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="admin-form-card" style={{ marginBottom: '1rem' }}>
            <div className="admin-form-group">
              <label>Title</label>
              <input
                type="text"
                placeholder="Announcement title"
                className="admin-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="admin-form-group">
              <label>Content</label>
              <textarea
                placeholder="Write the announcement content"
                className="admin-input"
                rows="4"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Start Date</label>
                <input
                  type="datetime-local"
                  className="admin-input"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>End Date</label>
                <input
                  type="datetime-local"
                  className="admin-input"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <input
                type="checkbox"
                checked={formData.pinned}
                onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
              />
              Pin announcement
            </label>
            <div className="admin-form-footer">
              <button type="submit" className="admin-btn admin-btn--primary">Publish</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="admin-loading"><span className="dash-spinner" />Loading announcements...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Content</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Pinned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((ann) => (
                  <tr key={ann._id}>
                    <td>{ann.title}</td>
                    <td>{ann.content}</td>
                    <td>{ann.startDate ? new Date(ann.startDate).toLocaleString() : '-'}</td>
                    <td>{ann.endDate ? new Date(ann.endDate).toLocaleString() : '-'}</td>
                    <td>{ann.pinned ? <span className="admin-badge admin-badge--gold">Pinned</span> : '-'}</td>
                    <td>
                      <button className="admin-btn admin-btn--danger" onClick={() => setConfirm({ id: ann._id, label: ann.title })}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {announcements.length === 0 && <p className="admin-empty">No announcements found.</p>}
          </div>
        )}

        {confirm && (
          <div className="admin-modal-backdrop" onClick={() => setConfirm(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h3 className="admin-modal__title">Delete Announcement</h3>
              <p className="admin-modal__body">Delete <strong>{confirm.label}</strong>? This cannot be undone.</p>
              <div className="admin-modal__footer">
                <button className="admin-btn" onClick={() => setConfirm(null)}>Cancel</button>
                <button className="admin-btn admin-btn--danger" onClick={() => { handleDelete(confirm.id); setConfirm(null); }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;
