import { useEffect, useState } from "react";
import { API_URL } from '../config/api';

const Sermons = () => {
  const [sermons, setSermons] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/public/sermons`)
      .then(res => res.json())
      .then(data => setSermons(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="records-page" style={{ padding: '0.25rem 0 0.5rem' }}>

      <section className="records-hero card">
        <span className="section-label">Worship</span>
        <h2>Sermons</h2>
        <p style={{ color: 'var(--text-muted)' }}>Watch and listen to sermons from our pastors and guest speakers.</p>
      </section>

      <div className="records-grid records-grid--2col">

        {sermons.map((sermon, index) => (
          <div key={sermon._id || index} className="card records-card">

            {sermon.videoUrl ? (
              <div className="records-video-wrap">
                <iframe
                  src={sermon.videoUrl}
                  title={sermon.title}
                  allowFullScreen
                  loading="lazy"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, borderRadius: '14px' }}
                />
              </div>
            ) : (
              <div className="records-video-wrap" style={{ background: 'var(--mist)' }}>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Video coming soon</span>
              </div>
            )}

            <h3>{sermon.title}</h3>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {sermon.speaker} · {new Date(sermon.date).toLocaleDateString()}
            </p>

            <p>{sermon.notes || sermon.description || ''}</p>

          </div>
        ))}

      </div>

      {sermons.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No sermons available yet. Check back soon!</p>
        </div>
      )}

    </div>
  );
};

export default Sermons;