import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

const Marriages = () => {
  const { user, token } = useAuth();
  const [marriages, setMarriages] = useState([]);
  const [showForm, setShowForm] = useState(false);
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

  const fetchMarriages = async () => {
    const res = await fetch(`${API_URL}/api/marriages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setMarriages(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/marriages`, {
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
      fetchMarriages();
    }
  };

  return (
    <div className="records-page">
      <section className="records-hero card">
        <span className="section-label">Sacramental Records</span>
        <h2>Marriage Records</h2>
        <p style={{ color: 'var(--text-muted)' }}>View and manage marriage records for the parish community.</p>
        {user?.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>
            {showForm ? 'Cancel' : '+ Add Marriage Record'}
          </button>
        )}
      </section>

      {showForm && (
        <div className="card records-form">
          <h3>Add Marriage Record</h3>
          <form onSubmit={handleSubmit} className="records-form-grid">
            <div className="form-group">
              <label>Bride Name</label>
              <input
                type="text"
                value={formData.brideName}
                onChange={(e) => setFormData({...formData, brideName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Groom Name</label>
              <input
                type="text"
                value={formData.groomName}
                onChange={(e) => setFormData({...formData, groomName: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Bride Date of Birth</label>
              <input
                type="date"
                value={formData.brideDateOfBirth}
                onChange={(e) => setFormData({...formData, brideDateOfBirth: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Groom Date of Birth</label>
              <input
                type="date"
                value={formData.groomDateOfBirth}
                onChange={(e) => setFormData({...formData, groomDateOfBirth: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Wedding Date</label>
              <input
                type="date"
                value={formData.weddingDate}
                onChange={(e) => setFormData({...formData, weddingDate: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Witness 1</label>
              <input
                type="text"
                value={formData.witnesses.witness1}
                onChange={(e) => setFormData({...formData, witnesses: {...formData.witnesses, witness1: e.target.value}})}
                required
              />
            </div>
            <div className="form-group">
              <label>Witness 2</label>
              <input
                type="text"
                value={formData.witnesses.witness2}
                onChange={(e) => setFormData({...formData, witnesses: {...formData.witnesses, witness2: e.target.value}})}
                required
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
              <label>Marriage License</label>
              <input
                type="text"
                value={formData.marriageLicense}
                onChange={(e) => setFormData({...formData, marriageLicense: e.target.value})}
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
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / -1' }}>Save Marriage Record</button>
          </form>
        </div>
      )}

      <div className="records-grid">
        {marriages.map(marriage => (
          <div key={marriage._id} className="card records-card">
            <h3>{marriage.brideName} & {marriage.groomName}</h3>
            <div className="records-card__details">
              <p><strong>Wedding Date:</strong> {new Date(marriage.weddingDate).toLocaleDateString()}</p>
              <p><strong>Priest:</strong> {marriage.priest}</p>
              <p><strong>Location:</strong> {marriage.location}</p>
              <p><strong>Witnesses:</strong> {marriage.witnesses.witness1} & {marriage.witnesses.witness2}</p>
              {marriage.marriageLicense && <p><strong>License:</strong> {marriage.marriageLicense}</p>}
              {marriage.notes && <p><strong>Notes:</strong> {marriage.notes}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Marriages;