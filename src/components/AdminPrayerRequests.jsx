import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminMenu } from './AdminDashboard';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';

const AdminPrayerRequests = () => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch prayer requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId, title) => {
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.message || 'Failed to delete prayer request');
        return;
      }

      setRequests((current) => current.filter((request) => request._id !== requestId));
      toast.success('Prayer request deleted');
    } catch (error) {
      console.error('Failed to delete prayer request:', error);
      toast.error('Failed to delete prayer request');
    }
  };

  if (loading) {
    return <div className="card"><p>Loading prayer requests...</p></div>;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const anonymousCount = requests.filter((request) => request.isAnonymous).length;
  const commentCount = requests.reduce((sum, request) => sum + (request.comments?.length || 0), 0);

  return (
    <div className="admin-container">
      <AdminMenu />
      <div className="admin-content">
        <h2>Prayer Request Management</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card">
            <h3>{requests.length}</h3>
            <p>Total prayer requests</p>
          </div>
          <div className="card">
            <h3>{anonymousCount}</h3>
            <p>Anonymous requests</p>
          </div>
          <div className="card">
            <h3>{commentCount}</h3>
            <p>Total comments</p>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <p>Admins can review all submitted prayer requests and remove entries when necessary.</p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Requested By</th>
                <th>Description</th>
                <th>Comments</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id}>
                  <td>{request.title}</td>
                  <td>{request.isAnonymous ? 'Anonymous' : request.user?.name || 'Unknown'}</td>
                  <td>{request.description}</td>
                  <td>{request.comments?.length || 0}</td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger" onClick={() => setConfirm({ id: request._id, label: request.title })}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {requests.length === 0 && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <p>No prayer requests found.</p>
          </div>
        )}
        {confirm && (
          <div className="admin-modal-backdrop" onClick={() => setConfirm(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h3 className="admin-modal__title">Delete Prayer Request</h3>
              <p className="admin-modal__body">Delete <strong>{confirm.label}</strong>? This cannot be undone.</p>
              <div className="admin-modal__footer">
                <button className="admin-btn" onClick={() => setConfirm(null)}>Cancel</button>
                <button className="admin-btn admin-btn--danger" onClick={() => { deleteRequest(confirm.id, confirm.label); setConfirm(null); }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPrayerRequests;

