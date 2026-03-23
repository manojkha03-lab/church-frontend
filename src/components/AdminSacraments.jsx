import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminMenu } from './AdminDashboard';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';

const AdminSacraments = () => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [sacraments, setSacraments] = useState([]);
  const [filteredSacraments, setFilteredSacraments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [formData, setFormData] = useState({
    personName: '',
    sacramentType: 'Confirmation',
    dateOfBirth: '',
    sacramentDate: '',
    sponsor: '',
    priest: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    fetchSacraments();
  }, [token]);

  useEffect(() => {
    let filtered = sacraments;

    if (searchTerm) {
      filtered = filtered.filter(sacrament =>
        sacrament.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sacrament.priest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sacrament.sponsor && sacrament.sponsor.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterYear) {
      filtered = filtered.filter(sacrament =>
        new Date(sacrament.sacramentDate).getFullYear().toString() === filterYear
      );
    }

    if (filterType) {
      filtered = filtered.filter(sacrament => sacrament.sacramentType === filterType);
    }

    setFilteredSacraments(filtered);
  }, [sacraments, searchTerm, filterYear, filterType]);

  const fetchSacraments = async () => {
    const res = await fetch(`${API_URL}/api/sacraments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setSacraments(data);
    }
  };

  const handleEdit = (sacrament) => {
    setEditing(sacrament._id);
    setFormData({
      personName: sacrament.personName,
      sacramentType: sacrament.sacramentType,
      dateOfBirth: sacrament.dateOfBirth.split('T')[0],
      sacramentDate: sacrament.sacramentDate.split('T')[0],
      sponsor: sacrament.sponsor || '',
      priest: sacrament.priest,
      location: sacrament.location,
      notes: sacrament.notes || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/sacraments/${editing}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setEditing(null);
      fetchSacraments();
      toast.success('Sacrament record updated');
    } else {
      toast.error('Failed to update sacrament record');
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API_URL}/api/sacraments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      toast.success('Sacrament record deleted');
      fetchSacraments();
    } else {
      toast.error('Failed to delete sacrament record');
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
            <h2 className="admin-page-title">Sacrament Records</h2>
            <p className="admin-page-sub">View and manage all sacrament records ({filteredSacraments.length})</p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search by name, priest, or sponsor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Types</option>
                <option value="Confirmation">Confirmation</option>
                <option value="Eucharist">Eucharist</option>
                <option value="Reconciliation">Reconciliation</option>
                <option value="Anointing of the Sick">Anointing of the Sick</option>
                <option value="Holy Orders">Holy Orders</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
              <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} style={{ width: '100%' }}>
                <option value="">All Years</option>
                {Array.from(new Set(sacraments.map(s => new Date(s.sacramentDate).getFullYear())))
                  .sort((a, b) => b - a)
                  .map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
              </select>
            </div>
            <button onClick={() => { setSearchTerm(''); setFilterYear(''); setFilterType(''); }} className="btn-secondary" style={{ alignSelf: 'flex-end' }}>
              Clear Filters
            </button>
          </div>

          {filteredSacraments.map(sacrament => (
            <div key={sacrament._id} className="card" style={{ marginBottom: '1rem' }}>
              {editing === sacrament._id ? (
                <form onSubmit={handleUpdate}>
                  <h4>Edit Sacrament Record</h4>
                  <div className="form-group">
                    <label>Person Name</label>
                    <input type="text" value={formData.personName} onChange={(e) => setFormData({ ...formData, personName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Sacrament Type</label>
                    <select value={formData.sacramentType} onChange={(e) => setFormData({ ...formData, sacramentType: e.target.value })} required>
                      <option value="Confirmation">Confirmation</option>
                      <option value="Eucharist">Eucharist</option>
                      <option value="Reconciliation">Reconciliation</option>
                      <option value="Anointing of the Sick">Anointing of the Sick</option>
                      <option value="Holy Orders">Holy Orders</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Sacrament Date</label>
                    <input type="date" value={formData.sacramentDate} onChange={(e) => setFormData({ ...formData, sacramentDate: e.target.value })} required />
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
                      <h4>{sacrament.personName} - {sacrament.sacramentType}</h4>
                      <p><strong>Sacrament Date:</strong> {new Date(sacrament.sacramentDate).toLocaleDateString()}</p>
                      <p><strong>Priest:</strong> {sacrament.priest}</p>
                      <p><strong>Location:</strong> {sacrament.location}</p>
                      {sacrament.sponsor && <p><strong>Sponsor:</strong> {sacrament.sponsor}</p>}
                    </div>
                    <div>
                      <button onClick={() => handleEdit(sacrament)} className="btn-secondary" style={{ marginRight: '0.5rem' }}>Edit</button>
                      <button onClick={() => setConfirm({ id: sacrament._id, label: `${sacrament.personName} - ${sacrament.sacramentType}` })} className="admin-btn admin-btn--danger">Delete</button>
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
              <h3 className="admin-modal__title">Delete Sacrament Record</h3>
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

export default AdminSacraments;
