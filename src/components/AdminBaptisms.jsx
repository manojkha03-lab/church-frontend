import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { AdminMenu } from './AdminDashboard';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';

const AdminBaptisms = () => {
  const { user, token } = useAuth();
  const toast = useToast();
  const [baptisms, setBaptisms] = useState([]);
  const [filteredBaptisms, setFilteredBaptisms] = useState([]);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [formData, setFormData] = useState({
    personName: '',
    dateOfBirth: '',
    baptismDate: '',
    parents: { father: '', mother: '' },
    godparents: { godfather: '', godmother: '' },
    priest: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    fetchBaptisms();
  }, [token]);

  useEffect(() => {
    let filtered = baptisms;

    if (searchTerm) {
      filtered = filtered.filter(baptism =>
        baptism.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        baptism.priest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        baptism.parents.father.toLowerCase().includes(searchTerm.toLowerCase()) ||
        baptism.parents.mother.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterYear) {
      filtered = filtered.filter(baptism =>
        new Date(baptism.baptismDate).getFullYear().toString() === filterYear
      );
    }

    setFilteredBaptisms(filtered);
  }, [baptisms, searchTerm, filterYear]);

  const fetchBaptisms = async () => {
    try {
      const res = await fetch(`${API_URL}/api/baptisms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBaptisms(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error('Failed to load baptism records');
    }
  };

  const handleEdit = (baptism) => {
    setEditing(baptism._id);
    setFormData({
      personName: baptism.personName,
      dateOfBirth: baptism.dateOfBirth.split('T')[0],
      baptismDate: baptism.baptismDate.split('T')[0],
      parents: baptism.parents,
      godparents: baptism.godparents,
      priest: baptism.priest,
      location: baptism.location,
      notes: baptism.notes || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/baptisms/${editing}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditing(null);
        fetchBaptisms();
        toast.success('Baptism record updated');
      } else {
        toast.error('Failed to update baptism record');
      }
    } catch {
      toast.error('Network error — please try again');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/baptisms/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Baptism record deleted');
        fetchBaptisms();
      } else {
        toast.error('Failed to delete baptism record');
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
            <h2 className="admin-page-title">Baptism Records</h2>
            <p className="admin-page-sub">View and manage all baptism records ({filteredBaptisms.length})</p>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, flex: '1', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search by name, priest, or parents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">All Years</option>
                {Array.from(new Set(baptisms.map(b => new Date(b.baptismDate).getFullYear())))
                  .sort((a, b) => b - a)
                  .map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
              </select>
            </div>
            <button
              onClick={() => { setSearchTerm(''); setFilterYear(''); }}
              className="btn-secondary"
              style={{ alignSelf: 'flex-end' }}
            >
              Clear Filters
            </button>
          </div>

          {filteredBaptisms.map(baptism => (
            <div key={baptism._id} className="card" style={{ marginBottom: '1rem' }}>
              {editing === baptism._id ? (
                <form onSubmit={handleUpdate}>
                  <h4>Edit Baptism Record</h4>
                  <div className="form-group">
                    <label>Person Name</label>
                    <input type="text" value={formData.personName} onChange={(e) => setFormData({ ...formData, personName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Baptism Date</label>
                    <input type="date" value={formData.baptismDate} onChange={(e) => setFormData({ ...formData, baptismDate: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Father</label>
                    <input type="text" value={formData.parents.father} onChange={(e) => setFormData({ ...formData, parents: { ...formData.parents, father: e.target.value } })} required />
                  </div>
                  <div className="form-group">
                    <label>Mother</label>
                    <input type="text" value={formData.parents.mother} onChange={(e) => setFormData({ ...formData, parents: { ...formData.parents, mother: e.target.value } })} required />
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
                      <h4>{baptism.personName}</h4>
                      <p><strong>Baptism Date:</strong> {new Date(baptism.baptismDate).toLocaleDateString()}</p>
                      <p><strong>Parents:</strong> {baptism.parents.father} & {baptism.parents.mother}</p>
                      <p><strong>Priest:</strong> {baptism.priest}</p>
                      <p><strong>Location:</strong> {baptism.location}</p>
                    </div>
                    <div>
                      <button onClick={() => handleEdit(baptism)} className="btn-secondary" style={{ marginRight: '0.5rem' }}>Edit</button>
                      <button onClick={() => setConfirm({ id: baptism._id, label: baptism.personName })} className="admin-btn admin-btn--danger">Delete</button>
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
              <h3 className="admin-modal__title">Delete Baptism Record</h3>
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

export default AdminBaptisms;
