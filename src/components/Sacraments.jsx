import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const Sacraments = () => {
  const { user, token } = useAuth();
  const [sacraments, setSacraments] = useState([]);
  const [showForm, setShowForm] = useState(false);
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

  const fetchSacraments = async () => {
    const res = await fetch(`${API_URL}/api/sacraments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setSacraments(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/sacraments`, {
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
        sacramentType: 'Confirmation',
        dateOfBirth: '',
        sacramentDate: '',
        sponsor: '',
        priest: '',
        location: '',
        notes: ''
      });
      fetchSacraments();
    }
  };

  return (
    <div className="records-page">
      <section className="records-hero card">
        <span className="section-label">Sacramental Records</span>
        <h2>Sacrament Records</h2>
        <p style={{ color: 'var(--text-muted)' }}>View and manage sacrament records for the parish community.</p>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>
            {showForm ? 'Cancel' : '+ Add Sacrament Record'}
          </button>
        )}
      </section>

      {showForm && (
        <div className="card records-form">
          <h3>Add Sacrament Record</h3>
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
              <label>Sacrament Type</label>
              <select
                value={formData.sacramentType}
                onChange={(e) => setFormData({...formData, sacramentType: e.target.value})}
                required
              >
                <option value="Confirmation">Confirmation</option>
                <option value="Eucharist">Eucharist</option>
                <option value="Reconciliation">Reconciliation</option>
                <option value="Anointing of the Sick">Anointing of the Sick</option>
                <option value="Holy Orders">Holy Orders</option>
              </select>
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
              <label>Sacrament Date</label>
              <input
                type="date"
                value={formData.sacramentDate}
                onChange={(e) => setFormData({...formData, sacramentDate: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Sponsor</label>
              <input
                type="text"
                value={formData.sponsor}
                onChange={(e) => setFormData({...formData, sponsor: e.target.value})}
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
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }}>Save Sacrament Record</button>
          </form>
        </div>
      )}

      <div className="records-grid">
        {sacraments.map(sacrament => (
          <div key={sacrament._id} className="card records-card">
            <h3>{sacrament.personName} - {sacrament.sacramentType}</h3>
            <div className="records-card__details">
              <p><strong>Sacrament Date:</strong> {new Date(sacrament.sacramentDate).toLocaleDateString()}</p>
              <p><strong>Priest:</strong> {sacrament.priest}</p>
              <p><strong>Location:</strong> {sacrament.location}</p>
              {sacrament.sponsor && <p><strong>Sponsor:</strong> {sacrament.sponsor}</p>}
              {sacrament.notes && <p><strong>Notes:</strong> {sacrament.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sacraments;