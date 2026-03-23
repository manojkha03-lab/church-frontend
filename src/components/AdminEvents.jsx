import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminMenu } from './AdminDashboard';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';

const AdminEvents = () => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    capacity: 0,
  });

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetch(`${API_URL}/api/events`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setEvents);
  }, [user, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      const data = await res.json();
      setEvents([...events, data.event]);
      setFormData({ title: '', description: '', location: '', startDate: '', endDate: '', capacity: 0 });
      setShowForm(false);
      toast.success('Event created');
    } else {
      const error = await res.json();
      toast.error(error.message || 'Failed to create event');
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API_URL}/api/events/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setEvents(events.filter(e => e._id !== id));
      toast.success('Event deleted');
    } else {
      const error = await res.json();
      toast.error(error.message || 'Failed to delete event');
    }
  };

  if (user?.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="admin-container">
      <AdminMenu />
      <div className="admin-content">
        <div className="admin-topbar">
          <div>
            <h2 className="admin-page-title">Manage Events</h2>
            <p className="admin-page-sub">Create and manage church events</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="admin-btn admin-btn--primary">
            {showForm ? 'Cancel' : '+ New Event'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="form-section">
            <div className="form-group">
              <label>Title *</label>
              <input type="text" placeholder="Event title" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description *</label>
              <textarea placeholder="Event description" rows="4" value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Location *</label>
              <input type="text" placeholder="Event location" value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Start Date *</label>
              <input type="datetime-local" value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="datetime-local" value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Capacity</label>
              <input type="number" placeholder="Event capacity" value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })} />
            </div>
            <button type="submit" className="btn btn-primary">Create Event</button>
          </form>
        )}

        <div style={{ marginTop: '2rem' }}>
          {events.length === 0 ? (
            <p>No events yet. Create one to get started!</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th><th>Description</th><th>Location</th>
                  <th>Start Date</th><th>End Date</th><th>Capacity</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event._id}>
                    <td><strong>{event.title}</strong></td>
                    <td>{event.description}</td>
                    <td>{event.location}</td>
                    <td>{event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{event.endDate ? new Date(event.endDate).toLocaleDateString() : 'N/A'}</td>
                    <td>{event.capacity || 'Unlimited'}</td>
                    <td>
                      <button onClick={() => setConfirm({ id: event._id, label: event.title })}
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
              <h3 className="admin-modal__title">Delete Event</h3>
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

export default AdminEvents;
