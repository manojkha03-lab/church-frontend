import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { API_URL } from '../config/api';

// Build Cloudinary responsive srcSet for a profile image URL
const resolveProfileImage = (imagePath) => {
  if (!imagePath) return '';
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  if (imagePath.startsWith('/')) return API_URL ? `${API_URL}${imagePath}` : imagePath;
  return API_URL ? `${API_URL}/${imagePath}` : `/${imagePath}`;
};

const buildCloudinarySrcSet = (url) => {
  if (!url || !url.includes('res.cloudinary.com')) return null;
  const widths = [80, 160, 240];
  const srcSet = widths
    .map((w) => {
      const optimized = url.replace('/upload/', `/upload/w_${w},h_${w},c_fill,g_face,q_auto,f_auto/`);
      return `${optimized} ${w}w`;
    })
    .join(', ');
  return { srcSet, sizes: '80px' };
};

const MemberDirectory = () => {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/profile/directory`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load members:', err);
        setLoading(false);
      });
  }, [token]);

  const filteredMembers = useMemo(() => members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
  ), [members, searchTerm]);

  const statCards = [
    { label: 'Members Listed', value: members.length },
    { label: 'Visible Results', value: filteredMembers.length },
    { label: 'Profiles With Bio', value: members.filter((member) => member.bio).length },
  ];

  return (
    <div className="member-directory-page">
      <section className="member-directory-hero">
        <div className="member-directory-hero__copy">
          <span className="section-label">Member Community</span>
          <h2>Connect with the people who make up your church family.</h2>
          <p>
            Browse member profiles, find contact details, and quickly open each profile page from a cleaner,
            more usable directory.
          </p>

          <div className="member-directory-stats">
            {statCards.map((stat) => (
              <div key={stat.label} className="card member-directory-stat">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          <div className="member-directory-actions">
            <Link to="/member/dashboard" className="btn-primary">Back to Dashboard</Link>
            <a href="#directory-search" className="btn-secondary">Search Members</a>
          </div>
        </div>

        <div className="member-directory-note card">
          <span className="section-label">Directory Access</span>
          <h3>Keep connection simple</h3>
          <p>Search by name, email, or phone to find members faster.</p>
          <p>Open any member profile to view their full public information.</p>
          <p>The page stays restricted to signed-in members through the protected members route.</p>
        </div>
      </section>

      <section className="member-directory-panel card">
        <div className="member-directory-panel__header">
          <div>
            <span className="section-label">Directory</span>
            <h2>Church Member Directory</h2>
            <p>Browse all available member records and open individual profiles.</p>
          </div>

          <div id="directory-search" className="member-directory-search">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="member-directory-grid">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="card member-directory-card member-directory-card--placeholder">
                <div className="member-directory-skeleton member-directory-skeleton--avatar" />
                <div className="member-directory-skeleton member-directory-skeleton--title" />
                <div className="member-directory-skeleton member-directory-skeleton--line" />
                <div className="member-directory-skeleton member-directory-skeleton--line" />
                <div className="member-directory-skeleton member-directory-skeleton--button" />
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="member-directory-empty card">
            <h3>No members found.</h3>
            <p>Try another search term to refine the directory.</p>
          </div>
        ) : (
          <div className="member-directory-grid">
            {filteredMembers.map((member) => (
              <article key={member._id} className="card member-directory-card">
                <div className="member-directory-card__top">
                  <div className="member-directory-avatar">
                    {member.profileImage ? (() => {
                      const src = resolveProfileImage(member.profileImage);
                      const responsive = buildCloudinarySrcSet(src);
                      return (
                        <img
                          src={src}
                          srcSet={responsive?.srcSet}
                          sizes={responsive?.sizes}
                          alt={member.name}
                          loading="lazy"
                          decoding="async"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                        />
                      );
                    })() : null}
                    <span style={member.profileImage ? { display: 'none' } : { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      {member.name?.[0]?.toUpperCase() || 'M'}
                    </span>
                  </div>
                  <div className="member-directory-card__identity">
                    <div className="member-directory-card__title">
                      <h3>{member.name}</h3>
                      <span className="member-directory-role">{member.role}</span>
                    </div>
                    <p>{member.email}</p>
                  </div>
                </div>

                <div className="member-directory-card__meta">
                  <p><strong>Phone:</strong> {member.phone || 'Not provided'}</p>
                  <p><strong>Bio:</strong> {member.bio || 'No bio added yet.'}</p>
                  <p><strong>Member Since:</strong> {new Date(member.createdAt).toLocaleDateString()}</p>
                </div>

                <Link to={`/profile/${member._id}`} className="btn-primary member-directory-card__button">
                  View Profile
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MemberDirectory;