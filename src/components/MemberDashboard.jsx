import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';

// ─── Minimal SVG icon ────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const icons = {
  events:   'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  sermon:   'M15 10l4.553-2.069A1 1 0 0121 8.82V15.18a1 1 0 01-1.447.89L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z',
  prayer:   'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z',
  donate:   'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  profile:  'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
  announce: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
  pin:      'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
};

// ─── Skeleton block ───────────────────────────────────────────────────────────
const Skel = ({ h = 48 }) => (
  <div className="member-db-skel" style={{ height: h }} />
);

// ─── Card header row ──────────────────────────────────────────────────────────
const CardHeader = ({ title, sub, to, linkLabel = 'View all →' }) => (
  <div className="member-db-card-header">
    <div>
      <h2 className="member-db-card-title">{title}</h2>
      {sub && <p className="member-db-card-sub">{sub}</p>}
    </div>
    {to && <Link to={to} className="member-db-card-link">{linkLabel}</Link>}
  </div>
);


// ─── Main Component ───────────────────────────────────────────────────────────
const MemberDashboard = () => {
  const { user, token } = useAuth();
  const toast = useToast();

  const [events,        setEvents]        = useState([]);
  const [sermons,       setSermons]       = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [donations,     setDonations]     = useState([]);
  const [prayers,       setPrayers]       = useState([]);
  const [loading,       setLoading]       = useState(true);

  // Prayer form
  const [prayerText, setPrayerText]   = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const authHeaders = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [evRes, serRes, annRes, donRes, prRes] = await Promise.allSettled([
          fetch(`${API_URL}/api/events`,         { headers: authHeaders }),
          fetch(`${API_URL}/api/sermons`,        { headers: authHeaders }),
          fetch(`${API_URL}/api/announcements`,  { headers: authHeaders }),
          fetch(`${API_URL}/api/donations/mine`, { headers: authHeaders }),
          fetch(`${API_URL}/api/prayer-requests`,   { headers: authHeaders }),
        ]);
        const safe = async (res) => {
          if (res.status === 'fulfilled' && res.value.ok) return res.value.json();
          return [];
        };
        const [ev, ser, ann, don, pr] = await Promise.all([
          safe(evRes), safe(serRes), safe(annRes), safe(donRes), safe(prRes),
        ]);
        setEvents(Array.isArray(ev)  ? ev.slice(0, 4)  : []);
        setSermons(Array.isArray(ser) ? ser.slice(0, 4) : []);
        setAnnouncements(Array.isArray(ann) ? ann.slice(0, 4) : []);
        setDonations(Array.isArray(don) ? don.slice(0, 5) : []);
        setPrayers(Array.isArray(pr)  ? pr               : []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [token]);

  const handlePrayerSubmit = async (e) => {
    e.preventDefault();
    if (!prayerText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title:       `Prayer from ${user?.name || 'a member'}`,
          description: prayerText,
          isAnonymous: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Prayer request submitted ✝');
        setPrayerText('');
        setPrayers(prev => [data, ...prev]);
      } else {
        toast.error('Could not submit prayer request.');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Beloved';

  const totalDonated = useMemo(
    () => donations.reduce((s, d) => s + (d.amount || 0), 0),
    [donations],
  );

  return (
    <div className="member-db-page">

      {/* ═══ TOP BAR ═══════════════════════════════════════════════════════════ */}
      <header className="member-db-topbar">
        <div className="member-db-topbar-inner">
          <Link to="/member/dashboard" className="member-db-brand">
            <div className="member-db-brand-icon">✝</div>
            <span className="member-db-brand-name">Sacred Heart Church</span>
          </Link>

          <nav className="member-db-topnav" aria-label="Quick navigation">
            {[
              { to: '/events',        label: 'Events',   icon: 'events'   },
              { to: '/sermons',       label: 'Sermons',  icon: 'sermon'   },
              { to: '/announcements', label: 'News',     icon: 'announce' },
              { to: '/donations',     label: 'Give',     icon: 'donate'   },
            ].map(({ to, label, icon }) => (
              <Link key={to} to={to} className="member-db-topnav-link">
                <Icon d={icons[icon]} size={15} />
                {label}
              </Link>
            ))}
          </nav>

          <Link to="/member/profile" className="member-db-profile-btn">
            <div className="member-db-avatar-sm">
              {user?.name?.[0]?.toUpperCase() || 'M'}
            </div>
            <span>{firstName}</span>
          </Link>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ══════════════════════════════════════════════════════ */}
      <main className="member-db-main">

        {/* ── Welcome hero ── */}
        <section className="member-db-hero">
          <p className="member-db-hero-eyebrow">{greeting}</p>
          <h1 className="member-db-hero-title">Welcome back, {firstName} 🙏</h1>
          <p className="member-db-hero-verse">
            "Be still, and know that I am God." — Psalm 46:10
          </p>
          <div className="member-db-hero-actions">
            <Link to="/donations"       className="member-db-hero-btn member-db-hero-btn--white">Give Now</Link>
            <Link to="/prayer-requests" className="member-db-hero-btn member-db-hero-btn--ghost">Prayer Request</Link>
          </div>
        </section>

        {/* ── Stats row ── */}
        <div className="member-db-stats" role="list" aria-label="Your activity">

          <Link to="/events" className="member-db-stat" role="listitem">
            <div className="member-db-stat-icon member-db-stat-icon--blue">
              <Icon d={icons.events} size={22} />
            </div>
            <div>
              <p className="member-db-stat-val">{loading ? '–' : events.length}</p>
              <p className="member-db-stat-lbl">Upcoming Events</p>
            </div>
          </Link>

          <Link to="/sermons" className="member-db-stat" role="listitem">
            <div className="member-db-stat-icon member-db-stat-icon--indigo">
              <Icon d={icons.sermon} size={22} />
            </div>
            <div>
              <p className="member-db-stat-val">{loading ? '–' : sermons.length}</p>
              <p className="member-db-stat-lbl">Sermons Available</p>
            </div>
          </Link>

          <Link to="/prayer-requests" className="member-db-stat" role="listitem">
            <div className="member-db-stat-icon member-db-stat-icon--sky">
              <Icon d={icons.prayer} size={22} />
            </div>
            <div>
              <p className="member-db-stat-val">{loading ? '–' : prayers.length}</p>
              <p className="member-db-stat-lbl">Prayer Requests</p>
            </div>
          </Link>

          <Link to="/donations" className="member-db-stat" role="listitem">
            <div className="member-db-stat-icon member-db-stat-icon--green">
              <Icon d={icons.donate} size={22} />
            </div>
            <div>
              <p className="member-db-stat-val">₹{loading ? '–' : totalDonated.toFixed(0)}</p>
              <p className="member-db-stat-lbl">Total Given</p>
            </div>
          </Link>
        </div>

        {/* ── Two-column grid ── */}
        <div className="member-db-grid">

          {/* ══ LEFT COLUMN ══ */}
          <div className="member-db-col">

            {/* Announcements */}
            <div className="member-db-card">
              <CardHeader title="📣 Announcements" sub="Latest from the church" to="/announcements" />
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Skel h={52} /><Skel h={52} /><Skel h={52} />
                </div>
              ) : announcements.length === 0 ? (
                <div className="member-db-empty">No announcements yet.</div>
              ) : (
                <div className="member-db-ann-list">
                  {announcements.map((a, i) => (
                    <div key={a._id || i} className="member-db-ann-item">
                      <div className="member-db-ann-icon">
                        <Icon d={icons.announce} size={15} />
                      </div>
                      <div>
                        <p className="member-db-ann-title">{a.title}</p>
                        {a.content && <p className="member-db-ann-body">{a.content}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Events */}
            <div className="member-db-card">
              <CardHeader title="📅 Upcoming Events" to="/events" />
              {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Skel h={80} /><Skel h={80} />
                </div>
              ) : events.length === 0 ? (
                <div className="member-db-empty">No upcoming events.</div>
              ) : (
                <div className="member-db-events-grid">
                  {events.map((ev, i) => (
                    <div key={ev._id || i} className="member-db-event-card">
                      <p className="member-db-event-date">
                        {ev.date
                          ? new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'Coming soon'}
                      </p>
                      <p className="member-db-event-title">{ev.title}</p>
                      {ev.location && (
                        <p className="member-db-event-loc">
                          <Icon d={icons.pin} size={12} /> {ev.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sermons */}
            <div className="member-db-card">
              <CardHeader title="🎤 Recent Sermons" to="/sermons" />
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Skel h={56} /><Skel h={56} /><Skel h={56} />
                </div>
              ) : sermons.length === 0 ? (
                <div className="member-db-empty">No sermons yet.</div>
              ) : (
                <div className="member-db-sermon-list">
                  {sermons.map((s, i) => (
                    <div key={s._id || i} className="member-db-sermon-item">
                      <div className="member-db-sermon-icon">
                        <Icon d={icons.sermon} size={18} />
                      </div>
                      <div className="member-db-sermon-info">
                        <p className="member-db-sermon-title">{s.title}</p>
                        <p className="member-db-sermon-speaker">
                          {s.speaker || 'Sacred Heart Ministries'}
                        </p>
                      </div>
                      <Link to="/sermons" className="member-db-sermon-watch">
                        Watch →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="member-db-col">

            {/* Quick links */}
            <div className="member-db-card">
              <h2 className="member-db-card-title" style={{ marginBottom: '0.9rem' }}>
                Quick Links
              </h2>
              <div className="member-db-quick-grid">
                {[
                  { to: '/events',          icon: 'events',   label: 'Events'   },
                  { to: '/sermons',         icon: 'sermon',   label: 'Sermons'  },
                  { to: '/donations',       icon: 'donate',   label: 'Give'     },
                  { to: '/announcements',   icon: 'announce', label: 'News'     },
                  { to: '/prayer-requests', icon: 'prayer',   label: 'Prayer'   },
                  { to: '/member/profile',  icon: 'profile',  label: 'Profile'  },
                ].map(({ to, icon, label }) => (
                  <Link key={to} to={to} className="member-db-quick-tile">
                    <div className="member-db-quick-tile-icon">
                      <Icon d={icons[icon]} size={18} />
                    </div>
                    <span className="member-db-quick-tile-label">{label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Prayer request quick form */}
            <div className="member-db-card">
              <CardHeader title="🙏 Prayer Request" to="/prayer-requests" linkLabel="All →" />
              <form onSubmit={handlePrayerSubmit} className="member-db-prayer-form">
                <textarea
                  rows={4}
                  value={prayerText}
                  onChange={e => setPrayerText(e.target.value)}
                  placeholder="Share your prayer request with our community…"
                  disabled={submitting}
                  className="member-db-prayer-textarea"
                />
                <button
                  type="submit"
                  disabled={submitting || !prayerText.trim()}
                  className="member-db-prayer-submit"
                >
                  {submitting ? 'Submitting…' : 'Submit Prayer ✝'}
                </button>
              </form>
              {prayers.length > 0 && (
                <div className="member-db-prayer-recent">
                  <p className="member-db-prayer-recent-label">Recent Requests</p>
                  {prayers.slice(0, 2).map((p, i) => (
                    <div key={p._id || i} className="member-db-prayer-snippet">
                      {p.description || p.message || p.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Donation history */}
            <div className="member-db-card">
              <CardHeader title="💳 Recent Gifts" to="/donations" linkLabel="Give →" />
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <Skel h={42} /><Skel h={42} />
                </div>
              ) : donations.length === 0 ? (
                <div className="member-db-empty">
                  <p>No gifts yet.</p>
                  <Link to="/donations" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.82rem' }}>
                    Make your first gift →
                  </Link>
                </div>
              ) : (
                <div className="member-db-donation-list">
                  {donations.map((d, i) => (
                    <div key={d._id || i} className="member-db-donation-item">
                      <div>
                        <p className="member-db-donation-amount">₹{(d.amount || 0).toFixed(2)}</p>
                        <p className="member-db-donation-meta">
                          {d.method && `${d.method} · `}
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ''}
                        </p>
                      </div>
                      <span className="member-db-donation-badge">
                        {d.status || 'completed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </main>

      {/* ═══ FOOTER ════════════════════════════════════════════════════════════ */}
      <footer className="member-db-footer">
        <span style={{ color: 'var(--gold)' }}>✝</span> Sacred Heart Church — Faith · Love · Service
      </footer>

    </div>
  );
};

export default MemberDashboard;
