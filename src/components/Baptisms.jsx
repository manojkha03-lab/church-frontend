import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const Baptisms = () => {
  const { user, token } = useAuth();
  const [baptisms, setBaptisms] = useState([]);
  const [showForm, setShowForm] = useState(false);
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
      console.error('Failed to load baptisms');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/baptisms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setShowForm(false);
      setFormData({
        personName: '',
        dateOfBirth: '',
        baptismDate: '',
        parents: { father: '', mother: '' },
        godparents: { godfather: '', godmother: '' },
        priest: '',
        location: '',
        notes: ''
      });
      fetchBaptisms();
    }
  };

  return (
    <div className="records-page">
      <section className="records-hero card">
        <span className="section-label">Sacramental Records</span>
        <h2>Baptism Records</h2>
        <p style={{ color: 'var(--text-muted)' }}>View and manage baptism records for the parish community.</p>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>
            {showForm ? 'Cancel' : '+ Add Baptism Record'}
          </button>
        )}
      </section>

      {showForm && (
        <div className="card records-form">
          <h3>Add Baptism Record</h3>
          <form onSubmit={handleSubmit} className="records-form-grid">
            <div className="form-group">
              <label>Person Name</label>
              <input
                type="text"
                value={formData.personName}
                onChange={(e) => setFormData({...formData, personName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Baptism Date</label>
              <input
                type="date"
                value={formData.baptismDate}
                onChange={(e) => setFormData({...formData, baptismDate: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Father</label>
              <input
                type="text"
                value={formData.parents.father}
                onChange={(e) => setFormData({...formData, parents: {...formData.parents, father: e.target.value}})}
                required
              />
            </div>
            <div className="form-group">
              <label>Mother</label>
              <input
                type="text"
                value={formData.parents.mother}
                onChange={(e) => setFormData({...formData, parents: {...formData.parents, mother: e.target.value}})}
                required
              />
            </div>
            <div className="form-group">
              <label>Godfather</label>
              <input
                type="text"
                value={formData.godparents.godfather}
                onChange={(e) => setFormData({...formData, godparents: {...formData.godparents, godfather: e.target.value}})}
              />
            </div>
            <div className="form-group">
              <label>Godmother</label>
              <input
                type="text"
                value={formData.godparents.godmother}
                onChange={(e) => setFormData({...formData, godparents: {...formData.godparents, godmother: e.target.value}})}
              />
            </div>
            <div className="form-group">
              <label>Priest</label>
              <input
                type="text"
                value={formData.priest}
                onChange={(e) => setFormData({...formData, priest: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }}>Save Baptism Record</button>
          </form>
        </div>
      )}

      <div className="records-grid">
        {baptisms.map(baptism => (
          <div key={baptism._id} className="card records-card">
            <h3>{baptism.personName}</h3>
            <div className="records-card__details">
              <p><strong>Baptism Date:</strong> {new Date(baptism.baptismDate).toLocaleDateString()}</p>
              <p><strong>Parents:</strong> {baptism.parents.father} & {baptism.parents.mother}</p>
              <p><strong>Priest:</strong> {baptism.priest}</p>
              <p><strong>Location:</strong> {baptism.location}</p>
              {baptism.godparents.godfather && <p><strong>Godfather:</strong> {baptism.godparents.godfather}</p>}
              {baptism.godparents.godmother && <p><strong>Godmother:</strong> {baptism.godparents.godmother}</p>}
              {baptism.notes && <p><strong>Notes:</strong> {baptism.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Baptisms;