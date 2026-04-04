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

const givingTiers = [
  { amount: 500, label: 'Community Care', sub: 'Helps supply meals and outreach support.' },
  { amount: 1000, label: 'Sunday Ministry', sub: 'Supports worship materials and children programs.' },
  { amount: 2500, label: 'Church Mission', sub: 'Strengthens local mission work and benevolence.' },
  { amount: 5000, label: 'Legacy Gift', sub: 'Supports larger campus and ministry needs.' },
];

const impactCards = [
  {
    title: 'Secure Giving',
    copy: 'Card donations are processed through Stripe checkout with your account attached to the gift record.',
    icon: 'M12 1l8 4v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-4z',
  },
  {
    title: 'Visible Stewardship',
    copy: 'Your recent gifts and totals stay available in one place so members can track their giving history.',
    icon: 'M3 3v18h18M7 14l3-3 3 2 4-5',
  },
  {
    title: 'Mission Focused',
    copy: 'Giving fuels worship gatherings, family support, pastoral care, and community outreach.',
    icon: 'M12 2v20M2 12h20',
  },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);

const Donations = () => {
  const { token, user } = useAuth();
  const toast = useToast();
  const [donations, setDonations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingAmount, setLoadingAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('1000');

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await fetch(`${API_URL}/api/donations/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setDonations(Array.isArray(data) ? data : []);
        } else {
          toast.error(data.message || 'Unable to load your donation history');
        }
      } catch (error) {
        console.error('Failed to load donations:', error);
        toast.error('Unable to load your donation history');
      } finally {
        setLoadingHistory(false);
      }
    };

    if (token) {
      fetchDonations();
    }
  }, [token, toast]);

  const stats = useMemo(() => {
    const completed = donations.filter((donation) => donation.status !== 'failed');
    const totalGiven = completed.reduce((sum, donation) => sum + (donation.amount || 0), 0);
    const lastGift = completed[0]?.amount || 0;
    return {
      totalGiven,
      giftCount: completed.length,
      lastGift,
    };
  }, [donations]);

  const startCheckout = async (amountInDollars) => {
    const cents = Math.round(Number(amountInDollars) * 100);
    if (!Number.isFinite(cents) || cents < 100) {
      toast.error('Enter at least ₹1 to continue');
      return;
    }

    setLoadingAmount(cents);
    try {
      const res = await fetch(`${API_URL}/api/donations/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: cents }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      toast.error(data.message || 'Unable to start checkout');
    } catch (error) {
      console.error('Donation checkout error:', error);
      toast.error('Unable to start checkout');
    } finally {
      setLoadingAmount(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faff]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-blue-100 bg-[radial-gradient(circle_at_top_left,_rgba(108,140,255,0.22),_transparent_38%),linear-gradient(135deg,_#ffffff_0%,_#eef4ff_42%,_#e6efff_100%)] p-6 shadow-[0_24px_80px_rgba(47,93,255,0.10)] sm:p-8 lg:p-10">
          <div className="absolute -right-8 top-4 text-[120px] leading-none text-[#2F5DFF]/10 select-none">✝</div>
          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.9fr]">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#2F5DFF]">
                <span className="inline-block h-2 w-2 rounded-full bg-[#2F5DFF]" />
                Secure Giving
              </div>
              <h1 className="mt-5 max-w-2xl font-serif text-4xl font-bold tracking-tight text-[#1F2A44] sm:text-5xl">
                Give with clarity, consistency, and a clear view of your impact.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Support worship, care ministries, and community outreach through a streamlined giving experience built for members of Sacred Heart Church.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lifetime Given</p>
                  <p className="mt-2 text-3xl font-bold text-[#1F2A44]">{formatCurrency(stats.totalGiven)}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Completed Gifts</p>
                  <p className="mt-2 text-3xl font-bold text-[#1F2A44]">{stats.giftCount}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Most Recent</p>
                  <p className="mt-2 text-3xl font-bold text-[#1F2A44]">{formatCurrency(stats.lastGift)}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/member/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-[#2F5DFF] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(47,93,255,0.24)] transition hover:bg-[#1A45D9]">
                  <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" size={16} />
                  Back to Dashboard
                </Link>
                <a href="#giving-options" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#2F5DFF] transition hover:border-blue-300 hover:bg-[#f4f8ff]">
                  <Icon d="M12 5v14M5 12h14" size={16} />
                  Choose an Amount
                </a>
              </div>
            </div>

            <div className="relative z-10 rounded-[28px] border border-blue-100 bg-white/92 p-5 shadow-[0_18px_40px_rgba(47,93,255,0.10)] backdrop-blur sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Member Profile</p>
                  <h2 className="mt-2 text-2xl font-bold text-[#1F2A44]">{user?.name || 'Church Member'}</h2>
                  <p className="mt-1 text-sm text-slate-500">Your giving summary updates after each successful gift.</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2F5DFF]">
                  <Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" size={24} />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {impactCards.map((item) => (
                  <div key={item.title} className="flex gap-3 rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                    <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-[#2F5DFF] shadow-sm">
                      <Icon d={item.icon} size={18} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#1F2A44]">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="giving-options" className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5DFF]">Give Today</p>
                <h2 className="mt-2 text-2xl font-bold text-[#1F2A44]">Choose a giving amount</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Select a common amount or enter your own. Checkout will open in Stripe for a secure one-time donation.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {givingTiers.map((tier) => {
                const cents = tier.amount * 100;
                const busy = loadingAmount === cents;
                return (
                  <button
                    key={tier.amount}
                    type="button"
                    onClick={() => startCheckout(tier.amount)}
                    disabled={loadingAmount !== null}
                    className="group rounded-[24px] border border-blue-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#f7faff_100%)] p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_40px_rgba(47,93,255,0.10)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#2F5DFF]">{tier.label}</p>
                        <h3 className="mt-2 text-3xl font-bold text-[#1F2A44]">{formatCurrency(tier.amount)}</h3>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF1FF] text-[#2F5DFF] transition group-hover:bg-[#2F5DFF] group-hover:text-white">
                        <Icon d="M5 12h14M12 5l7 7-7 7" size={18} />
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-500">{busy ? 'Redirecting to secure checkout...' : tier.sub}</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-dashed border-blue-200 bg-[#f8fbff] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <label htmlFor="custom-donation" className="text-sm font-semibold text-[#1F2A44]">Custom amount</label>
                  <div className="mt-2 flex items-center rounded-2xl border border-blue-100 bg-white px-4 shadow-sm">
                    <span className="text-lg font-semibold text-slate-400">₹</span>
                    <input
                      id="custom-donation"
                      type="number"
                      min="1"
                      step="1"
                      value={customAmount}
                      onChange={(event) => setCustomAmount(event.target.value)}
                      className="w-full border-0 bg-transparent px-2 py-3 text-lg font-semibold text-[#1F2A44] outline-none"
                      placeholder="75"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startCheckout(customAmount)}
                  disabled={loadingAmount !== null}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2F5DFF] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_32px_rgba(47,93,255,0.20)] transition hover:bg-[#1A45D9] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Icon d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" size={18} />
                  {loadingAmount === Math.round(Number(customAmount || 0) * 100) ? 'Redirecting...' : 'Donate Custom Amount'}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5DFF]">Giving Notes</p>
            <h2 className="mt-2 text-2xl font-bold text-[#1F2A44]">What your gift supports</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#f8fbff] p-4">
                <p className="text-sm font-semibold text-[#1F2A44]">Worship & formation</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Weekend services, discipleship gatherings, and music ministry resourcing.</p>
              </div>
              <div className="rounded-2xl bg-[#f8fbff] p-4">
                <p className="text-sm font-semibold text-[#1F2A44]">Family care</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Pastoral care, benevolence support, and practical help for members in need.</p>
              </div>
              <div className="rounded-2xl bg-[#f8fbff] p-4">
                <p className="text-sm font-semibold text-[#1F2A44]">Mission & outreach</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Local service projects, evangelism initiatives, and community partnerships.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2F5DFF]">History</p>
              <h2 className="mt-2 text-2xl font-bold text-[#1F2A44]">Your recent gifts</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">A running record of your donations, including pending Stripe checkouts and completed gifts.</p>
            </div>
            <div className="rounded-2xl bg-[#EAF1FF] px-4 py-3 text-sm font-semibold text-[#2F5DFF]">
              {loadingHistory ? 'Loading history...' : `${donations.length} donation${donations.length === 1 ? '' : 's'} recorded`}
            </div>
          </div>

          {loadingHistory ? (
            <div className="mt-6 grid gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : donations.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-blue-200 bg-[#f8fbff] px-6 py-10 text-center">
              <p className="text-lg font-semibold text-[#1F2A44]">No donations recorded yet.</p>
              <p className="mt-2 text-sm text-slate-500">Your first successful gift will appear here automatically.</p>
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-[24px] border border-blue-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-[#f8fbff]">
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Amount</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Method</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
                      <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50 bg-white">
                    {donations.map((donation) => (
                      <tr key={donation._id} className="hover:bg-[#fbfdff]">
                        <td className="px-5 py-4 text-sm font-medium text-[#1F2A44]">{new Date(donation.createdAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-[#1F2A44]">{formatCurrency(donation.amount)}</td>
                        <td className="px-5 py-4 text-sm capitalize text-slate-500">{donation.method || 'stripe'}</td>
                        <td className="px-5 py-4 text-sm">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${donation.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : donation.status === 'failed' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                            {donation.status || 'pending'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">{donation.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Donations;