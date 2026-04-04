import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminMenu } from './AdminDashboard';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';

const AdminSermons = () => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [sermons, setSermons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    speaker: '',
    date: '',
    videoUrl: '',
    notes: '',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetch(`${API_URL}/api/sermons`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setSermons(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load sermons'))
      .finally(() => setLoading(false));
  }, [user, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/sermons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        const data = await res.json();
        setSermons([...sermons, data.sermon]);
        setFormData({ title: '', speaker: '', date: '', videoUrl: '', notes: '' });
        setShowForm(false);
        toast.success('Sermon added');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to add sermon');
      }
    } catch {
      toast.error('Network error — please try again');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/sermons/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSermons(sermons.filter(s => s._id !== id));
        toast.success('Sermon deleted');
      } else {
        const error = await res.json();
        toast.error(error.message || 'Failed to delete sermon');
      }
    } catch {
      toast.error('Network error — please try again');
    }
  };

  if (user?.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="admin-container">
      <AdminMenu />
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h2 className="admin-page-title">Manage Sermons</h2>
            <p className="admin-page-sub">Add and remove sermon recordings</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="admin-btn admin-btn--primary">
            {showForm ? 'Cancel' : '+ Add Sermon'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="form-section">
            <div className="form-group">
              <label>Title *</label>
              <input type="text" placeholder="Sermon title" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Speaker *</label>
              <input type="text" placeholder="Speaker name" value={formData.speaker}
                onChange={(e) => setFormData({ ...formData, speaker: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Date *</label>
              <input type="datetime-local" value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Video URL</label>
              <input type="url" placeholder="https://youtube.com/..." value={formData.videoUrl}
                onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea placeholder="Sermon notes or description" rows="4" value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary">Add Sermon</button>
          </form>
        )}

        <div style={{ marginTop: '2rem' }}>
          {sermons.length === 0 ? (
            <p>No sermons yet. Add one to get started!</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th><th>Speaker</th><th>Date</th><th>Video</th><th>Notes</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sermons.map(sermon => (
                  <tr key={sermon._id}>
                    <td><strong>{sermon.title}</strong></td>
                    <td>{sermon.speaker}</td>
                    <td>{sermon.date ? new Date(sermon.date).toLocaleDateString() : 'N/A'}</td>
                    <td>{sermon.videoUrl ? <a href={sermon.videoUrl} target="_blank" rel="noreferrer">Watch</a> : 'N/A'}</td>
                    <td>{sermon.notes ? sermon.notes.substring(0, 50) + '...' : 'N/A'}</td>
                    <td>
                      <button onClick={() => setConfirm({ id: sermon._id, label: sermon.title })}
                        className="admin-btn admin-btn--danger" style={{ fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {confirm && (
          <div className="admin-modal-backdrop" onClick={() => setConfirm(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h3 className="admin-modal__title">Delete Sermon</h3>
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

export default AdminSermons;
