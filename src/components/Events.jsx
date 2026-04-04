import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { API_URL } from '../config/api';

const Events = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/events`)
      .then(res => res.json())
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="records-page" style={{ padding: '0.25rem 0 0.5rem' }}>

      <section className="records-hero card">
        <span className="section-label">Parish Calendar</span>
        <h2>Upcoming Events</h2>
        <p style={{ color: 'var(--text-muted)' }}>Join us for worship, fellowship, and community activities.</p>
      </section>

      <div className="records-grid records-grid--3col">

        {events.map((event, index) => (
          <motion.div
            key={event._id || index}
            whileHover={{ scale: 1.03 }}
            className="card records-card" style={{ padding: 0, overflow: 'hidden' }}
          >
            <img
              src={event.image || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=400&auto=format&fit=crop"}
              alt={event.title}
              loading="lazy"
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
            <div style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
              <h3>{event.title}</h3>
              <p style={{ marginTop: '0.5rem' }}>{event.description}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--gold)', marginTop: '0.75rem', fontWeight: 600 }}>
                {event.startDate ? new Date(event.startDate).toLocaleDateString() : event.date}
              </p>
            </div>
          </motion.div>
        ))}

      </div>

      {events.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No events published yet. Check back soon!</p>
        </div>
      )}

    </div>
  );
};

export default Events;