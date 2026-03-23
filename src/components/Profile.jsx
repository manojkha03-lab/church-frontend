import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';

// ─── Tiny icon ────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const ICONS = {
  user:   'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z',
  mail:   'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  phone:  'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  shield: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  cal:    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  donate: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  edit:   'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  close:  'M6 18L18 6M6 6l12 12',
  back:   'M10 19l-7-7m0 0l7-7m-7 7h18',
  info:   'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const ProfileSkeleton = () => (
  <div className="profile-page">
    <div className="prof-hero card prof-hero--loading">
      <div className="prof-hero__left">
        <div className="events-skeleton events-skeleton--avatar prof-skel-avatar" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <div className="events-skeleton" style={{ height: 14, width: '40%', borderRadius: 8 }} />
          <div className="events-skeleton events-skeleton--title" />
          <div className="events-skeleton events-skeleton--line" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
    <div className="prof-body-grid">
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="events-skeleton" style={{ height: 60, borderRadius: 14 }} />)}
        </div>
      </div>
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1,2,3].map(i => <div key={i} className="events-skeleton" style={{ height: 60, borderRadius: 14 }} />)}
        </div>
      </div>
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const Profile = () => {
  const { id }                     = useParams();
  const { user: currentUser, token } = useAuth();
  const toast                      = useToast();
  const navigate                   = useNavigate();

  const [profile,  setProfile]  = useState(null);
  const [donations, setDonations] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', bio: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(false);

  const resolveProfileImage = (imagePath) => {
    if (!imagePath) return '';
    // Cloudinary URLs are already absolute
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    // Legacy local uploads fallback
    if (imagePath.startsWith('/')) {
      return API_URL ? `${API_URL}${imagePath}` : imagePath;
    }
    return API_URL ? `${API_URL}/${imagePath}` : `/${imagePath}`;
  };

  // Build Cloudinary responsive srcSet for an image URL
  const buildCloudinarySrcSet = (url) => {
    if (!url || !url.includes('res.cloudinary.com')) return null;
    const widths = [200, 400, 600];
    const srcSet = widths
      .map((w) => {
        const optimized = url.replace('/upload/', `/upload/w_${w},c_fill,g_face,q_auto,f_auto/`);
        return `${optimized} ${w}w`;
      })
      .join(', ');
    return { srcSet, sizes: '(max-width: 480px) 200px, (max-width: 768px) 400px, 600px' };
  };

  const isOwn = !id || id === (currentUser?.id || currentUser?._id);

  // Redirect to login if no token
  useEffect(() => {
    if (!token) navigate('/login', { replace: true });
  }, [token, navigate]);

  // Fetch profile data
  useEffect(() => {
    if (!token) return;
    // Own profile → /api/profile/me (authenticated), else /api/profile/:id
    const endpoint = isOwn ? `${API_URL}/api/profile/me` : `${API_URL}/api/profile/${id}`;
    fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('profile_not_found');
        return res.json();
      })
      .then(data => {
        setProfile(data);
        setFormData({ name: data.name || '', email: data.email || '', phone: data.phone || '', bio: data.bio || '' });
      })
      .catch(() => { toast.error('Unable to load profile.'); setError(true); })
      .finally(() => setLoading(false));
  }, [id, token, isOwn]);

  // Fetch own donations for activity section
  useEffect(() => {
    if (!token || !isOwn) return;
    fetch(`${API_URL}/api/donations/mine`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => setDonations(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [token, isOwn]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('email', formData.email);
      payload.append('phone', formData.phone);
      payload.append('bio', formData.bio);
      if (selectedFile) {
        payload.append('photo', selectedFile);
      }

      const res = await fetch(`${API_URL}/api/profile/update`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    payload,
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated.user);
        setSelectedFile(null);
        setEditOpen(false);
        toast.success('Profile updated successfully ✓');
      } else {
        let message = 'Failed to update profile.';
        try {
          const errData = await res.json();
          message = errData?.error || errData?.message || message;
        } catch {
          // keep fallback message when response body isn't JSON
        }
        toast.error(message);
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const totalDonated = useMemo(
    () => donations.reduce((s, d) => s + (d.amount || 0), 0),
    [donations],
  );

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const initials = profile?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  if (loading) return <ProfileSkeleton />;

  if (error || !profile) {
    return (
      <div className="profile-page">
        <div className="card prof-error">
          <div className="prof-error__icon">⚠</div>
          <h3>Profile Unavailable</h3>
          <p>We couldn't load this profile. Please try again later.</p>
          <Link to="/member/dashboard" className="btn-primary" style={{ marginTop: '1rem' }}>Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* ══ Hero card ══════════════════════════════════════════════════════════ */}
      <section className="prof-hero card">
        <div className="prof-hero__left">
          {/* Avatar */}
          <div className="prof-avatar">
            {profile.profileImage
              ? (() => {
                  const src = resolveProfileImage(profile.profileImage);
                  const responsive = buildCloudinarySrcSet(src);
                  return (
                    <img
                      src={src}
                      srcSet={responsive?.srcSet}
                      sizes={responsive?.sizes}
                      alt={profile.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                    />
                  );
                })()
              : null}
            <span className="prof-avatar__fallback" style={profile.profileImage ? { display: 'none' } : undefined}>
              {initials}
            </span>
          </div>

          {/* Identity */}
          <div className="prof-identity">
            <span className="section-label">Member Profile</span>
            <h2 className="prof-identity__name">{profile.name}</h2>
            <p className="prof-identity__email">
              <Icon d={ICONS.mail} size={14} /> {profile.email || 'No email added'}
            </p>
            <span className={`prof-role-badge prof-role-badge--${profile.role}`}>
              {profile.role === 'admin' ? '⚙ Admin' : '✝ Member'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="prof-hero__actions">
          <Link to="/member/dashboard" className="btn-secondary">
            <Icon d={ICONS.back} size={16} /> Dashboard
          </Link>
          {isOwn && (
            <button
              onClick={() => setEditOpen(true)}
              className="btn-primary"
            >
              <Icon d={ICONS.edit} size={16} /> Edit Profile
            </button>
          )}
        </div>
      </section>

      {/* ══ Two-column body ════════════════════════════════════════════════════ */}
      <div className="prof-body-grid">

        {/* ── Account info ── */}
        <section className="card prof-info">
          <div className="prof-section-head">
            <h3>Account Information</h3>
          </div>
          <div className="profile-details__grid">
            <div className="profile-item">
              <span><Icon d={ICONS.user} size={13} /> Full Name</span>
              <strong>{profile.name}</strong>
            </div>
            <div className="profile-item">
              <span><Icon d={ICONS.mail} size={13} /> Email Address</span>
              <strong>{profile.email || 'Not added yet'}</strong>
            </div>
            <div className="profile-item">
              <span><Icon d={ICONS.phone} size={13} /> Phone Number</span>
              <strong>{profile.phone || 'Not set'}</strong>
            </div>
            <div className="profile-item">
              <span><Icon d={ICONS.shield} size={13} /> Role</span>
              <strong style={{ textTransform: 'capitalize' }}>{profile.role}</strong>
            </div>
            <div className="profile-item profile-item--full">
              <span><Icon d={ICONS.cal} size={13} /> Member Since</span>
              <strong>{memberSince}</strong>
            </div>
            <div className="profile-item profile-item--full">
              <span><Icon d={ICONS.info} size={13} /> Bio</span>
              <strong>{profile.bio || 'No bio added yet.'}</strong>
            </div>
          </div>
        </section>

        {/* ── Activity (own only) ── */}
        {isOwn && (
          <section className="card prof-activity">
            <div className="prof-section-head">
              <h3>Your Activity</h3>
            </div>

            {/* Stats */}
            <div className="prof-stats-row">
              <div className="prof-stat-card prof-stat-card--green">
                <div className="prof-stat-card__icon">
                  <Icon d={ICONS.donate} size={20} />
                </div>
                <div>
                  <p className="prof-stat-card__val">${totalDonated.toFixed(2)}</p>
                  <p className="prof-stat-card__lbl">Total Donated</p>
                </div>
              </div>
              <div className="prof-stat-card prof-stat-card--blue">
                <div className="prof-stat-card__icon">
                  <Icon d={ICONS.donate} size={20} />
                </div>
                <div>
                  <p className="prof-stat-card__val">{donations.length}</p>
                  <p className="prof-stat-card__lbl">Total Gifts</p>
                </div>
              </div>
            </div>

            {/* Recent donations */}
            <div className="prof-recent-head">
              <p className="prof-recent-label">Recent Gifts</p>
              <Link to="/donations" className="prof-view-all">View all →</Link>
            </div>

            {donations.length === 0 ? (
              <div className="prof-empty">
                <p>No donations recorded yet.</p>
                <Link to="/donations" className="btn-primary" style={{ marginTop: '0.75rem' }}>
                  Make a Gift
                </Link>
              </div>
            ) : (
              <div className="prof-donation-list">
                {donations.slice(0, 5).map((d, i) => (
                  <div key={d._id || i} className="prof-donation-row">
                    <div className="prof-donation-row__info">
                      <p className="prof-donation-row__amount">${(d.amount || 0).toFixed(2)}</p>
                      <p className="prof-donation-row__meta">
                        {d.method ? `${d.method} · ` : ''}
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                      </p>
                    </div>
                    <span className="prof-donation-row__badge">
                      {d.status || 'completed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {/* ══ Edit Profile Modal ══════════════════════════════════════════════════ */}
      {editOpen && (
        <div
          className="prof-modal-backdrop"
          onClick={e => e.target === e.currentTarget && setEditOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="prof-modal-title"
        >
          <div className="prof-modal">
            {/* Modal header */}
            <div className="prof-modal__header">
              <h3 id="prof-modal-title">Edit Profile</h3>
              <button
                className="prof-modal__close"
                onClick={() => setEditOpen(false)}
                aria-label="Close"
              >
                <Icon d={ICONS.close} size={18} />
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSave} className="prof-modal__body">
              <div className="form-group">
                <label htmlFor="prof-name">Full Name</label>
                <input
                  id="prof-name"
                  type="text"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="prof-email">Email Address</label>
                <input
                  id="prof-email"
                  type="email"
                  placeholder="Add your email address"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="prof-phone">Phone Number</label>
                <input
                  id="prof-phone"
                  type="tel"
                  placeholder="e.g. +1 555 000 1234"
                  value={formData.phone}
                  onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="prof-bio">Bio</label>
                <textarea
                  id="prof-bio"
                  rows={4}
                  placeholder="Tell the community a little about yourself…"
                  value={formData.bio}
                  onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label htmlFor="prof-photo">Profile Photo</label>
                <input
                  id="prof-photo"
                  type="file"
                  accept="image/*"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile && (
                  <small style={{ color: '#5f6b7a' }}>Selected: {selectedFile.name}</small>
                )}
              </div>

              <div className="prof-modal__footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setFormData({ name: profile.name, email: profile.email || '', phone: profile.phone || '', bio: profile.bio || '' });
                    setSelectedFile(null);
                    setEditOpen(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;