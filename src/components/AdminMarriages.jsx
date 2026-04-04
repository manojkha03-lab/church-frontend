import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminMenu } from './AdminDashboard';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';

const AdminMarriages = () => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [marriages, setMarriages] = useState([]);
  const [filteredMarriages, setFilteredMarriages] = useState([]);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [formData, setFormData] = useState({
    brideName: '',
    groomName: '',
    brideDateOfBirth: '',
    groomDateOfBirth: '',
    weddingDate: '',
    witnesses: { witness1: '', witness2: '' },
    priest: '',
    location: '',
    marriageLicense: '',
    notes: ''
  });

  useEffect(() => {
    fetchMarriages();
  }, [token]);

  useEffect(() => {
    let filtered = marriages;

    if (searchTerm) {
      filtered = filtered.filter(marriage =>
        marriage.brideName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marriage.groomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marriage.priest.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterYear) {
      filtered = filtered.filter(marriage =>
        new Date(marriage.weddingDate).getFullYear().toString() === filterYear
      );
    }

    setFilteredMarriages(filtered);
  }, [marriages, searchTerm, filterYear]);

  const fetchMarriages = async () => {
    try {
      const res = await fetch(`${API_URL}/api/marriages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMarriages(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Failed to load marriage records');
    }
  };

  const handleEdit = (marriage) => {
    setEditing(marriage._id);
    setFormData({
      brideName: marriage.brideName,
      groomName: marriage.groomName,
      brideDateOfBirth: marriage.brideDateOfBirth.split('T')[0],
      groomDateOfBirth: marriage.groomDateOfBirth.split('T')[0],
      weddingDate: marriage.weddingDate.split('T')[0],
      witnesses: marriage.witnesses,
      priest: marriage.priest,
      location: marriage.location,
      marriageLicense: marriage.marriageLicense || '',
      notes: marriage.notes || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/marriages/${editing}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditing(null);
        fetchMarriages();
        toast.success('Marriage record updated');
      } else {
        toast.error('Failed to update marriage record');
      }
    } catch {
      toast.error('Network error — please try again');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/marriages/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Marriage record deleted');
        fetchMarriages();
      } else {
        toast.error('Failed to delete marriage record');
      }
    } catch {
      toast.error('Network error — please try again');
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
            <h2 className="admin-page-title">Marriage Records</h2>
            <p className="admin-page-sub">View and manage all marriage records ({filteredMarriages.length})</p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search by bride, groom, or priest..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Years</option>
                {Array.from(new Set(marriages.map(m => new Date(m.weddingDate).getFullYear())))
                  .sort((a, b) => b - a)
                  .map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
              </select>
            </div>
            <button onClick={() => { setSearchTerm(''); setFilterYear(''); }} className="btn-secondary" style={{ alignSelf: 'flex-end' }}>
              Clear Filters
            </button>
          </div>

          {filteredMarriages.map(marriage => (
            <div key={marriage._id} className="card" style={{ marginBottom: '1rem' }}>
              {editing === marriage._id ? (
                <form onSubmit={handleUpdate}>
                  <h4>Edit Marriage Record</h4>
                  <div className="form-group">
                    <label>Bride Name</label>
                    <input type="text" value={formData.brideName} onChange={(e) => setFormData({ ...formData, brideName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Groom Name</label>
                    <input type="text" value={formData.groomName} onChange={(e) => setFormData({ ...formData, groomName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Wedding Date</label>
                    <input type="date" value={formData.weddingDate} onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Priest</label>
                    <input type="text" value={formData.priest} onChange={(e) => setFormData({ ...formData, priest: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginRight: '0.5rem' }}>Update</button>
                  <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
                </form>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h4>{marriage.brideName} & {marriage.groomName}</h4>
                      <p><strong>Wedding Date:</strong> {new Date(marriage.weddingDate).toLocaleDateString()}</p>
                      <p><strong>Priest:</strong> {marriage.priest}</p>
                      <p><strong>Location:</strong> {marriage.location}</p>
                      <p><strong>Witnesses:</strong> {marriage.witnesses.witness1} & {marriage.witnesses.witness2}</p>
                    </div>
                    <div>
                      <button onClick={() => handleEdit(marriage)} className="btn-secondary" style={{ marginRight: '0.5rem' }}>Edit</button>
                      <button onClick={() => setConfirm({ id: marriage._id, label: `${marriage.brideName} & ${marriage.groomName}` })} className="admin-btn admin-btn--danger">Delete</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {confirm && (
          <div className="admin-modal-backdrop" onClick={() => setConfirm(null)}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>
              <h3 className="admin-modal__title">Delete Marriage Record</h3>
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

export default AdminMarriages;
