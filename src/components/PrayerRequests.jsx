import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_URL } from '../config/api';

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const PrayerRequests = () => {
  const { token, user } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentingId, setCommentingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [confirm, setConfirm] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isAnonymous: false,
  });

  const currentUserId = user?.id || user?._id;

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(Array.isArray(data) ? data : []);
      } else {
        toast.error(data.message || 'Unable to load prayer requests');
      }
    } catch (error) {
      console.error('Failed to fetch prayer requests:', error);
      toast.error('Unable to load prayer requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRequests();
    }
  }, [token]);

  const filteredRequests = useMemo(() => {
    if (activeTab === 'mine') {
      return requests.filter((request) => {
        const ownerId = typeof request.user === 'object' ? request.user?._id || request.user?.id : request.user;
        return ownerId === currentUserId;
      });
    }
    return requests;
  }, [activeTab, currentUserId, requests]);

  const stats = useMemo(() => {
    const mine = requests.filter((request) => {
      const ownerId = typeof request.user === 'object' ? request.user?._id || request.user?.id : request.user;
      return ownerId === currentUserId;
    }).length;
    const commentCount = requests.reduce((sum, request) => sum + (request.comments?.length || 0), 0);
    return {
      total: requests.length,
      mine,
      comments: commentCount,
    };
  }, [currentUserId, requests]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Prayer request submitted');
        setFormData({ title: '', description: '', isAnonymous: false });
        await fetchRequests();
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        toast.error(data.errors[0].msg || 'Unable to submit prayer request');
      } else {
        toast.error(data.message || 'Unable to submit prayer request');
      }
    } catch (error) {
      console.error('Failed to create prayer request:', error);
      toast.error('Unable to submit prayer request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (requestId) => {
    const text = commentDrafts[requestId]?.trim();
    if (!text) return;

    setCommentingId(requestId);
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests/${requestId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Comment posted');
        setCommentDrafts((current) => ({ ...current, [requestId]: '' }));
        await fetchRequests();
      } else {
        toast.error(data.message || 'Unable to post comment');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Unable to post comment');
    } finally {
      setCommentingId(null);
    }
  };

  const handleDelete = async (requestId) => {
    try {
      const res = await fetch(`${API_URL}/api/prayer-requests/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Prayer request deleted');
        setRequests((current) => current.filter((request) => request._id !== requestId));
      } else {
        toast.error(data.message || 'Unable to delete prayer request');
      }
    } catch (error) {
      console.error('Failed to delete prayer request:', error);
      toast.error('Unable to delete prayer request');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faff]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-[radial-gradient(circle_at_top_left,_rgba(108,140,255,0.18),_transparent_34%),linear-gradient(135deg,_#ffffff_0%,_#eef4ff_44%,_#e7f0ff_100%)] p-6 shadow-[0_24px_80px_rgba(47,93,255,0.10)] sm:p-8 lg:p-10">
          <div className="absolute -right-8 top-3 text-[120px] leading-none text-[#2F5DFF]/10 select-none">✝</div>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#2F5DFF]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#2F5DFF]" />
                Community Care
              </div>
              <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold tracking-tight text-[#1F2A44] sm:text-5xl">
                Share a need, stand with others, and keep prayer visible in community.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Submit private or named requests, follow prayer updates, and encourage other members with thoughtful comments and support.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/70 bg-white/85 p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Requests</p>
                  <p className="mt-2 text-3xl font-bold text-[#1F2A44]">{stats.total}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/85 p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your Requests</p>
                  <p className="mt-2 text-3xl font-bold text-[#1F2A44]">{stats.mine}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/85 p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Comments Shared</p>
                  <p className="mt-2 text-3xl font-bold text-[#1F2A44]">{stats.comments}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/member/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-[#2F5DFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(47,93,255,0.24)] transition hover:bg-[#1A45D9]">
                  <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" size={16} />
                  Back to Dashboard
                </Link>
                <a href="#submit-prayer" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#2F5DFF] transition hover:border-blue-300 hover:bg-[#f4f8ff]">
                  <Icon d="M12 5v14M5 12h14" size={16} />
                  Submit Request
                </a>
              </div>
            </div>

            <div className="relative z-10 rounded-[28px] border border-blue-100 bg-white/92 p-6 shadow-[0_18px_40px_rgba(47,93,255,0.10)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prayer Rhythm</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#1F2A44]">Pray with intention</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2F5DFF]">
                  <Icon d="M12 22s8-4.438 8-11V5l-8-3-8 3v6c0 6.562 8 11 8 11z" size={22} />
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm leading-6 text-slate-600">
                <div className="rounded-2xl bg-[#f8fbff] p-4">
                  Requests can be submitted anonymously when privacy matters most.
                </div>
                <div className="rounded-2xl bg-[#f8fbff] p-4">
                  Comments let members add encouragement without exposing unnecessary detail.
                </div>
                <div className="rounded-2xl bg-[#f8fbff] p-4">
                  You can remove your own requests at any time from the feed below.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div id="submit-prayer" className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5DFF]">New Request</p>
            <h2 className="mt-2 text-2xl font-bold text-[#1F2A44]">Share a prayer need</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Your request will be visible to signed-in members who are praying with the church community.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="prayer-title" className="mb-2 block text-sm font-semibold text-[#1F2A44]">Title</label>
                <input
                  id="prayer-title"
                  type="text"
                  value={formData.title}
                  onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
                  placeholder="How can the church pray with you?"
                  className="w-full rounded-2xl border border-blue-100 bg-[#fbfdff] px-4 py-3 text-sm text-[#1F2A44] outline-none transition focus:border-blue-300 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label htmlFor="prayer-description" className="mb-2 block text-sm font-semibold text-[#1F2A44]">Description</label>
                <textarea
                  id="prayer-description"
                  rows="6"
                  value={formData.description}
                  onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Share as much or as little context as you want the church to know."
                  className="w-full rounded-2xl border border-blue-100 bg-[#fbfdff] px-4 py-3 text-sm text-[#1F2A44] outline-none transition focus:border-blue-300 focus:bg-white"
                  required
                />
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={(event) => setFormData((current) => ({ ...current, isAnonymous: event.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-blue-200 text-[#2F5DFF]"
                />
                <span>
                  <span className="block font-semibold text-[#1F2A44]">Post anonymously</span>
                  Hide your name from the request card while still keeping the request attached to your account.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2F5DFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(47,93,255,0.20)] transition hover:bg-[#1A45D9] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Icon d="M12 5v14M5 12h14" size={18} />
                {submitting ? 'Submitting...' : 'Submit Prayer Request'}
              </button>
            </form>
          </div>

          <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5DFF]">Prayer Feed</p>
                <h2 className="mt-2 text-2xl font-bold text-[#1F2A44]">Requests from the church</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Read, pray, and add encouragement to requests shared by the congregation.</p>
              </div>
              <div className="inline-flex rounded-2xl bg-[#f4f8ff] p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'all' ? 'bg-white text-[#2F5DFF] shadow-sm' : 'text-slate-500 hover:text-[#2F5DFF]'}`}
                >
                  All Requests
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('mine')}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab === 'mine' ? 'bg-white text-[#2F5DFF] shadow-sm' : 'text-slate-500 hover:text-[#2F5DFF]'}`}
                >
                  My Requests
                </button>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-44 animate-pulse rounded-[24px] bg-slate-100" />
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-blue-200 bg-[#f8fbff] px-6 py-10 text-center">
                <p className="text-lg font-semibold text-[#1F2A44]">No prayer requests found.</p>
                <p className="mt-2 text-sm text-slate-500">{activeTab === 'mine' ? 'Your requests will appear here after you submit one.' : 'Be the first to share a request with the church community.'}</p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {filteredRequests.map((request) => {
                  const ownerId = typeof request.user === 'object' ? request.user?._id || request.user?.id : request.user;
                  const isOwn = ownerId === currentUserId;
                  return (
                    <article key={request._id} className="overflow-hidden rounded-[26px] border border-blue-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] shadow-sm">
                      <div className="border-b border-blue-50 px-5 py-4 sm:px-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF1FF] px-3 py-1 text-xs font-semibold text-[#2F5DFF]">
                                <Icon d="M12 2v20M2 12h20" size={12} />
                                Prayer Request
                              </span>
                              {request.isAnonymous && (
                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                  Anonymous
                                </span>
                              )}
                            </div>
                            <h3 className="mt-3 text-xl font-bold text-[#1F2A44]">{request.title}</h3>
                            <p className="mt-1 text-sm text-slate-500">
                              Shared by {request.isAnonymous ? 'Anonymous' : request.user?.name || 'Church member'} on {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {isOwn && (
                            <button
                              type="button"
                              onClick={() => setConfirm({ id: request._id, title: request.title })}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                            >
                              <Icon d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 01-2 2H11a2 2 0 01-2-2V6" size={16} />
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="px-5 py-5 sm:px-6">
                        <p className="text-sm leading-7 text-slate-600">{request.description}</p>

                        <div className="mt-5 rounded-[22px] bg-[#f8fbff] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-[#1F2A44]">Comments</h4>
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {request.comments?.length || 0} shared
                            </span>
                          </div>

                          <div className="mt-4 space-y-3">
                            {(request.comments || []).length === 0 ? (
                              <p className="text-sm text-slate-400">No comments yet. Add a short encouragement below.</p>
                            ) : (
                              request.comments.map((comment) => (
                                <div key={comment._id || `${request._id}-${comment.createdAt}`} className="rounded-2xl border border-blue-100 bg-white px-4 py-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-[#1F2A44]">{comment.user?.name || 'Church member'}</p>
                                    <p className="text-xs text-slate-400">{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}</p>
                                  </div>
                                  <p className="mt-1 text-sm leading-6 text-slate-600">{comment.text}</p>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                            <input
                              type="text"
                              value={commentDrafts[request._id] || ''}
                              onChange={(event) => setCommentDrafts((current) => ({ ...current, [request._id]: event.target.value }))}
                              placeholder="Write a short prayer or word of encouragement"
                              className="min-w-0 flex-1 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm text-[#1F2A44] outline-none transition focus:border-blue-300"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(request._id)}
                              disabled={commentingId === request._id}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2F5DFF] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1A45D9] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <Icon d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" size={16} />
                              {commentingId === request._id ? 'Posting...' : 'Add Comment'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {confirm && (
          <div className="admin-modal-backdrop" onClick={() => setConfirm(null)}>
            <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
              <h3 className="admin-modal__title">Delete Prayer Request</h3>
              <p className="admin-modal__body">Delete <strong>{confirm.title}</strong>? This cannot be undone.</p>
              <div className="admin-modal__footer">
                <button className="admin-btn" onClick={() => setConfirm(null)}>Cancel</button>
                <button
                  className="admin-btn admin-btn--danger"
                  onClick={async () => {
                    const requestId = confirm.id;
                    setConfirm(null);
                    await handleDelete(requestId);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrayerRequests;