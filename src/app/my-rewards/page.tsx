'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Phone, Gift, Star, LogOut, RefreshCw, CreditCard, ScanLine, User, ArrowRight, Copy, Check, MapPin } from 'lucide-react';
import {
  getCustomerSession,
  saveCustomerSession,
  clearCustomerSession,
} from '@/lib/customerSession';

// ── Types ─────────────────────────────────────────────────────────────────────
interface LoyaltyCard {
  merchant_slug:      string;
  business_name:      string;
  logo_url:           string | null;
  campaign_name:      string;
  campaign_type:      string;
  progress:           number;
  reward_threshold:   number;
  reward_description: string;
  reward_status:      'in_progress' | 'unlocked';
  cycle_number:       number;
  last_scan_at:       string | null;
}

interface DiscoverStore {
  slug:               string;
  business_name:      string;
  logo_url:           string | null;
  campaign_name:      string;
  campaign_type:      string;
  reward_description: string;
  reward_threshold:   number;
}

interface CustomerData { name: string | null; phone: string; }

type Tab = 'cards' | 'scan' | 'account';

// ── Helpers ───────────────────────────────────────────────────────────────────
function Spinner({ sm }: { sm?: boolean }) {
  return (
    <svg className={`animate-spin text-primary ${sm ? 'h-4 w-4' : 'h-8 w-8'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function MerchantAvatar({ logo_url, name, size = 44 }: { logo_url: string | null; name: string; size?: number }) {
  return (
    <div
      className="rounded-xl overflow-hidden bg-primary-light flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {logo_url ? (
        <Image src={logo_url} alt={name} width={size} height={size} className="object-cover w-full h-full" unoptimized />
      ) : (
        <span className="font-bold text-primary" style={{ fontSize: size * 0.4 }}>{name[0]}</span>
      )}
    </div>
  );
}

// ── Inline redeem code ────────────────────────────────────────────────────────
function InlineRedeemCode({ phone, slug, onCancel }: { phone: string; slug: string; onCancel: () => void }) {
  const [code,    setCode]    = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [secs,    setSecs]    = useState(600);
  const [copied,  setCopied]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    fetch('/api/public/redeem-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phone, slug }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.code) { setCode(d.code); setSecs((d.expires_minutes ?? 10) * 60); }
        else setError(d.error || 'Could not generate code.');
      })
      .catch(() => setError('Connection error.'))
      .finally(() => setLoading(false));
  }, [phone, slug]);

  useEffect(() => {
    if (!code || secs <= 0) return;
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [code, secs]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const expired = secs === 0;
  const urgent  = secs < 120 && !expired;

  function copy() {
    if (code) { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  return (
    <div className="mt-3 rounded-xl bg-primary-light border border-primary/20 p-4 space-y-3">
      <p className="text-xs font-semibold text-primary text-center uppercase tracking-widest">Show this code to the merchant</p>

      {loading ? (
        <div className="flex justify-center py-4"><Spinner /></div>
      ) : error ? (
        <p className="text-center text-sm text-status-error py-2">{error}</p>
      ) : code ? (
        <>
          <div className="flex items-center justify-center gap-1.5">
            {code.split('').map((d, i) => (
              <span key={i} className="w-10 h-13 flex items-center justify-center text-2xl font-bold text-primary bg-white rounded-xl border-2 border-primary shadow-sm" style={{ height: 52 }}>
                {d}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3">
            <button onClick={copy} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>
          {expired ? (
            <p className="text-xs text-center font-semibold text-status-error">Code expired</p>
          ) : (
            <p className={`text-xs text-center font-semibold tabular-nums ${urgent ? 'text-orange-500' : 'text-text-medium'}`}>
              Expires in {m}:{String(s).padStart(2, '0')}
            </p>
          )}
        </>
      ) : null}

      <button onClick={onCancel} className="w-full text-xs text-text-light hover:text-text-medium transition-colors text-center">
        Cancel Redemption
      </button>
    </div>
  );
}

// ── Loyalty Card ──────────────────────────────────────────────────────────────
function LoyaltyCardItem({ card, phone }: { card: LoyaltyCard; phone: string }) {
  const [showCode, setShowCode] = useState(false);
  const isUnlocked = card.reward_status === 'unlocked';
  const pct = Math.min(100, Math.round((card.progress / card.reward_threshold) * 100));
  const remaining = Math.max(0, card.reward_threshold - card.progress);
  const isSpend = card.campaign_type === 'spend_based';

  return (
    <div className={`bg-white rounded-2xl overflow-hidden shadow-sm border ${isUnlocked ? 'border-primary' : 'border-border-light'}`}>
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <MerchantAvatar logo_url={card.logo_url} name={card.business_name} size={44} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-dark truncate">{card.business_name}</p>
          <p className="text-xs text-text-light truncate">
            {isSpend ? 'Spend-based' : 'Visit-based'} · {card.campaign_name}
          </p>
        </div>
        {isUnlocked && (
          <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded-full flex-shrink-0">
            🎉 Ready!
          </span>
        )}
      </div>

      {/* Reward */}
      <div className="px-4 pb-2">
        <p className="text-sm font-semibold text-text-dark flex items-center gap-1.5">
          <Gift size={14} className="text-primary flex-shrink-0" />
          {card.reward_description}
        </p>
      </div>

      {/* Progress */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-medium tabular-nums">
            {card.progress} / {card.reward_threshold} {isSpend ? 'points' : 'visits'}
          </span>
          {isUnlocked ? (
            <span className="text-xs font-semibold text-primary">🎉 Reward ready!</span>
          ) : (
            <span className="text-xs text-text-light">{remaining} more to go</span>
          )}
        </div>
        <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isUnlocked ? 'bg-primary' : 'bg-primary/60'}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* CTA */}
        {isUnlocked && !showCode && (
          <button
            onClick={() => setShowCode(true)}
            className="mt-3 w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Gift size={16} /> Redeem Now
          </button>
        )}

        {isUnlocked && showCode && (
          <InlineRedeemCode
            phone={phone}
            slug={card.merchant_slug}
            onCancel={() => setShowCode(false)}
          />
        )}
      </div>
    </div>
  );
}

// ── Discover Store Card ───────────────────────────────────────────────────────
function DiscoverCard({ store }: { store: DiscoverStore }) {
  return (
    <div className="bg-white rounded-2xl border border-border-light shadow-sm p-4 flex items-center gap-3">
      <MerchantAvatar logo_url={store.logo_url} name={store.business_name} size={44} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-text-dark truncate">{store.business_name}</p>
        <p className="text-xs text-text-light truncate">{store.reward_description}</p>
      </div>
      <span className="text-xs font-semibold text-primary flex items-center gap-0.5 flex-shrink-0 hover:underline">
        Scan to Join <ArrowRight size={12} />
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyRewardsPage() {
  const [phase,     setPhase]     = useState<'loading' | 'login' | 'dashboard'>('loading');
  const [phone,     setPhone]     = useState('');
  const [customer,  setCustomer]  = useState<CustomerData | null>(null);
  const [cards,     setCards]     = useState<LoyaltyCard[]>([]);
  const [stores,    setStores]    = useState<DiscoverStore[]>([]);
  const [fetching,  setFetching]  = useState(false);
  const [error,     setError]     = useState('');
  const [tab,       setTab]       = useState<Tab>('cards');

  const loadCards = useCallback(async (phoneDigits: string, name: string | null = null) => {
    setFetching(true);
    try {
      const [lookupRes, discoverRes] = await Promise.all([
        fetch('/api/customer/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneDigits }),
        }),
        fetch(`/api/customer/discover?phone=${phoneDigits}`),
      ]);

      const lookupData  = await lookupRes.json();
      const discoverData = await discoverRes.json();

      if (!lookupRes.ok) { setError(lookupData.error || 'Lookup failed.'); setPhase('login'); return; }
      setCustomer(lookupData.customer ?? { name, phone: phoneDigits });
      setCards(lookupData.cards ?? []);
      setStores(discoverData.stores ?? []);
      saveCustomerSession(phoneDigits, lookupData.customer?.name ?? name);
      setPhase('dashboard');
    } catch {
      setError('Connection error.');
      setPhase('login');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    const session = getCustomerSession();
    if (session) {
      setPhone(session.phone);
      loadCards(session.phone, session.name);
    } else {
      setPhase('login');
    }
  }, [loadCards]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit number.'); return; }
    await loadCards(digits);
  }

  function handleLogout() {
    clearCustomerSession();
    setPhone(''); setCustomer(null); setCards([]); setStores([]); setPhase('login');
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-muted">
        <Spinner />
      </div>
    );
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  if (phase === 'login') {
    return (
      <main className="min-h-screen bg-bg-muted flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto shadow-lg">
              <Star size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-dark">My Rewards</h1>
            <p className="text-text-medium text-sm">Enter your mobile number to view your loyalty cards</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-border-light p-5 space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-3 rounded-xl border border-border-light bg-bg-muted text-text-medium font-medium text-sm flex-shrink-0">
                    🇮🇳 +91
                  </div>
                  <div className="relative flex-1">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210"
                      className="form-input pl-9"
                      inputMode="numeric"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
              {error && <p className="text-sm text-status-error">{error}</p>}
              <button
                type="submit"
                disabled={fetching || phone.replace(/\D/g, '').length !== 10}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {fetching ? <><Spinner sm /> Loading…</> : 'View My Rewards →'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-text-light">Powered by LetLoyal</p>
        </div>
      </main>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const displayName = customer?.name?.split(' ')[0] ?? null;
  const unlocked    = cards.filter(c => c.reward_status === 'unlocked');
  const inProgress  = cards.filter(c => c.reward_status !== 'unlocked');

  return (
    <main className="min-h-screen bg-bg-muted flex flex-col">
      {/* ── Top header ── */}
      <header className="bg-white border-b border-border-light px-4 pt-5 pb-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          {tab === 'cards' && (
            <>
              <p className="text-xl font-bold text-text-dark">
                {displayName ? `Hi, ${displayName}! 👋` : 'My Rewards 👋'}
              </p>
              <p className="text-sm text-text-light mt-0.5">
                {cards.length === 0
                  ? 'No loyalty cards yet'
                  : `You have ${cards.length} loyalty card${cards.length > 1 ? 's' : ''}.`}
              </p>
            </>
          )}
          {tab === 'scan' && (
            <p className="text-xl font-bold text-text-dark">Scan a QR Code</p>
          )}
          {tab === 'account' && (
            <p className="text-xl font-bold text-text-dark">My Account</p>
          )}
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

          {/* ── Cards tab ── */}
          {tab === 'cards' && (
            <>
              {/* Refresh */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-medium uppercase tracking-wide">My Loyalty Cards</h2>
                <button
                  onClick={() => loadCards(phone, customer?.name ?? null)}
                  disabled={fetching}
                  className="flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                >
                  <RefreshCw size={12} className={fetching ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border-light p-10 text-center space-y-3">
                  <CreditCard size={40} className="text-text-light mx-auto opacity-30" />
                  <p className="font-semibold text-text-medium">No loyalty cards yet</p>
                  <p className="text-sm text-text-light">Scan a QR code at any LetLoyal store to start earning rewards.</p>
                </div>
              ) : (
                <>
                  {/* Unlocked first */}
                  {unlocked.length > 0 && (
                    <section className="space-y-3">
                      <p className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1">
                        <Gift size={12} /> Rewards Ready to Claim ({unlocked.length})
                      </p>
                      {unlocked.map((card, i) => (
                        <LoyaltyCardItem key={i} card={card} phone={phone} />
                      ))}
                    </section>
                  )}

                  {/* In progress */}
                  {inProgress.length > 0 && (
                    <section className="space-y-3">
                      {unlocked.length > 0 && (
                        <p className="text-xs font-bold text-text-medium uppercase tracking-wide">In Progress ({inProgress.length})</p>
                      )}
                      {inProgress.map((card, i) => (
                        <LoyaltyCardItem key={i} card={card} phone={phone} />
                      ))}
                    </section>
                  )}
                </>
              )}

              {/* Discover Stores */}
              {stores.length > 0 && (
                <section className="space-y-3 pt-2">
                  <h2 className="text-sm font-semibold text-text-medium uppercase tracking-wide flex items-center gap-1.5">
                    <MapPin size={13} /> Discover Stores
                  </h2>
                  <p className="text-xs text-text-light -mt-1">Earn rewards at any LetLoyal store</p>
                  {stores.map((store, i) => (
                    <DiscoverCard key={i} store={store} />
                  ))}
                </section>
              )}
            </>
          )}

          {/* ── Scan tab ── */}
          {tab === 'scan' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-border-light p-8 text-center space-y-4">
                <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center mx-auto">
                  <ScanLine size={40} className="text-primary" />
                </div>
                <div>
                  <p className="font-bold text-text-dark text-lg">Scan a Store QR Code</p>
                  <p className="text-sm text-text-light mt-1">Ask the merchant to show their QR code, then scan it with your phone camera to earn rewards.</p>
                </div>
                <div className="bg-bg-muted rounded-xl p-4 text-sm text-text-medium text-left space-y-2">
                  <p className="font-semibold text-text-dark">How it works:</p>
                  <p>1. Ask the merchant to open their QR code</p>
                  <p>2. Scan with your camera</p>
                  <p>3. Enter your number (first time only)</p>
                  <p>4. Earn stamps / points automatically!</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Account tab ── */}
          {tab === 'account' && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-border-light p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0">
                    <User size={28} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-text-dark">{customer?.name ?? 'Customer'}</p>
                    <p className="text-sm text-text-light">+91 {phone}</p>
                  </div>
                </div>

                <div className="border-t border-border-light pt-4 grid grid-cols-2 gap-3 text-center">
                  <div className="bg-bg-muted rounded-xl p-3">
                    <p className="text-xl font-bold text-text-dark">{cards.length}</p>
                    <p className="text-xs text-text-light mt-0.5">Loyalty Cards</p>
                  </div>
                  <div className="bg-bg-muted rounded-xl p-3">
                    <p className="text-xl font-bold text-primary">{unlocked.length}</p>
                    <p className="text-xs text-text-light mt-0.5">Rewards Ready</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-200 text-status-error font-semibold hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} /> Sign Out
              </button>

              <p className="text-center text-xs text-text-light pb-2">Powered by LetLoyal</p>
            </div>
          )}

        </div>
      </div>

      {/* ── Bottom Tab Bar ── */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-border-light z-20 safe-area-pb">
        <div className="max-w-lg mx-auto flex">
          {([
            { id: 'cards' as Tab,   label: 'Cards',   icon: <CreditCard size={22} /> },
            { id: 'scan'  as Tab,   label: 'Scan',    icon: <ScanLine   size={22} /> },
            { id: 'account' as Tab, label: 'Account', icon: <User       size={22} /> },
          ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                tab === id ? 'text-primary' : 'text-text-light hover:text-text-medium'
              }`}
            >
              {icon}
              {label}
              {id === 'cards' && unlocked.length > 0 && tab !== 'cards' && (
                <span className="absolute top-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
