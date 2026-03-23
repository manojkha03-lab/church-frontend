import { useEffect, useState } from 'react';
import { API_URL } from '../config/api';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/announcements`)
      .then(res => res.json())
      .then(setAnnouncements);
  }, []);

  return (
    <div className="records-page">
      <section className="records-hero card">
        <span className="section-label">Parish Updates</span>
        <h2>Church Announcements</h2>
        <p style={{ color: 'var(--text-muted)' }}>Stay informed with the latest news and updates from the church.</p>
      </section>

      {announcements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No announcements at this time.</p>
        </div>
      ) : (
        <div className="records-grid records-grid--wide">
          {announcements.map(ann => (
            <div key={ann._id} className="card records-card">
              <h3>{ann.title}</h3>
              <p>{ann.content}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Posted on {new Date(ann.startDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;