'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Phone, Gift, Star, LogOut, RefreshCw, ChevronRight } from 'lucide-react';
import { PoweredBy } from '@/components/ui/Logo';
import {
  getCustomerSession,
  saveCustomerSession,
  clearCustomerSession,
} from '@/lib/customerSession';

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

interface CustomerData {
  name: string | null;
  phone: string;
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function ProgressStamps({ progress, threshold }: { progress: number; threshold: number }) {
  const total = Math.min(threshold, 12);
  const filled = Math.min(progress, total);
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs transition-all ${
            i < filled
              ? 'bg-primary border-primary text-white'
              : 'bg-transparent border-border-light text-transparent'
          }`}
        >
          ★
        </div>
      ))}
      {threshold > 12 && (
        <span className="text-xs text-text-light self-center ml-1">
          {progress}/{threshold}
        </span>
      )}
    </div>
  );
}

// ── Loyalty card ─────────────────────────────────────────────────────────────
function LoyaltyCard({ card, phone, onRedeem }: { card: LoyaltyCard; phone: string; onRedeem: (card: LoyaltyCard) => void }) {
  const pct = Math.min(100, Math.round((card.progress / card.reward_threshold) * 100));
  const isUnlocked = card.reward_status === 'unlocked';

  return (
    <div className={`rounded-2xl border-2 overflow-hidden ${isUnlocked ? 'border-primary shadow-md' : 'border-border-light'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-surface">
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-bg-muted flex-shrink-0 flex items-center justify-center">
          {card.logo_url ? (
            <Image src={card.logo_url} alt={card.business_name} width={40} height={40} className="object-cover w-full h-full" unoptimized />
          ) : (
            <span className="text-lg font-bold text-primary">{card.business_name[0]}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-text-dark truncate">{card.business_name}</p>
          <p className="text-xs text-text-light truncate">{card.campaign_name}</p>
        </div>
        {isUnlocked && (
          <span className="text-xs font-bold bg-primary text-white px-2 py-0.5 rounded-full flex-shrink-0">
            REWARD!
          </span>
        )}
      </div>

      {/* Progress */}
      <div className="px-4 pb-4 pt-2 bg-surface">
        {card.reward_threshold <= 12 ? (
          <ProgressStamps progress={card.progress} threshold={card.reward_threshold} />
        ) : (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-text-light mb-1">
              <span>{card.progress} / {card.reward_threshold} {card.campaign_type === 'spend_based' ? 'pts' : 'visits'}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-text-medium flex items-center gap-1">
            <Gift size={12} className="text-primary" />
            {card.reward_description}
          </p>
          {!isUnlocked && (
            <p className="text-xs text-text-light">
              {Math.max(0, card.reward_threshold - card.progress)} more to go
            </p>
          )}
        </div>

        {isUnlocked && (
          <button
            onClick={() => onRedeem(card)}
            className="mt-3 w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            <Gift size={16} /> Redeem Now <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Redeem Code Modal ─────────────────────────────────────────────────────────
function RedeemModal({ card, phone, onClose }: { card: LoyaltyCard; phone: string; onClose: () => void }) {
  const [code,    setCode]    = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [secs,    setSecs]    = useState(600); // 10 min
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    fetch('/api/public/redeem-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phone, slug: card.merchant_slug }),
    })
      .then(r => r.json())
      .then(d => { if (d.ok) { setCode(d.code); setSecs(d.expires_minutes * 60); } })
      .finally(() => setLoading(false));
  }, [phone, card.merchant_slug]);

  useEffect(() => {
    if (!code) return;
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [code]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const expired = secs === 0;

  function copy() {
    if (code) { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-text-dark text-center">Your Reward Code</h2>
        <p className="text-sm text-text-medium text-center">{card.reward_description} at {card.business_name}</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : code ? (
          <>
            <div className="flex items-center justify-center gap-1.5">
              {code.split('').map((d, i) => (
                <span key={i} className="w-11 h-14 flex items-center justify-center text-3xl font-bold text-primary bg-primary-light rounded-xl border-2 border-primary">
                  {d}
                </span>
              ))}
            </div>
            <button onClick={copy} className="w-full text-sm text-primary font-medium hover:underline">
              {copied ? '✓ Copied!' : 'Copy code'}
            </button>
            <p className={`text-center text-sm font-semibold tabular-nums ${expired ? 'text-status-error' : secs < 120 ? 'text-orange-500' : 'text-text-medium'}`}>
              {expired ? 'Code expired — close and try again' : `Expires in ${m}:${String(s).padStart(2, '0')}`}
            </p>
            <p className="text-xs text-text-light text-center">Show this code to the merchant at {card.business_name}</p>
          </>
        ) : (
          <p className="text-center text-status-error py-4">Could not generate code. Try again.</p>
        )}

        <button onClick={onClose} className="w-full py-3 rounded-xl border-2 border-border-light text-text-medium font-medium hover:bg-bg-muted transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyRewardsPage() {
  const [phase,     setPhase]     = useState<'loading' | 'login' | 'dashboard'>('loading');
  const [phone,     setPhone]     = useState('');
  const [customer,  setCustomer]  = useState<CustomerData | null>(null);
  const [cards,     setCards]     = useState<LoyaltyCard[]>([]);
  const [fetching,  setFetching]  = useState(false);
  const [error,     setError]     = useState('');
  const [redeemCard, setRedeemCard] = useState<LoyaltyCard | null>(null);

  // On mount: check stored session
  useEffect(() => {
    const session = getCustomerSession();
    if (session) {
      setPhone(session.phone);
      loadCards(session.phone, session.name);
    } else {
      setPhase('login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCards(phoneDigits: string, name: string | null = null) {
    setFetching(true);
    try {
      const res  = await fetch('/api/customer/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneDigits }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Lookup failed.'); setPhase('login'); return; }
      setCustomer(data.customer ?? { name, phone: phoneDigits });
      setCards(data.cards ?? []);
      saveCustomerSession(phoneDigits, data.customer?.name ?? name);
      setPhase('dashboard');
    } catch {
      setError('Connection error.');
      setPhase('login');
    } finally {
      setFetching(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit number.'); return; }
    await loadCards(digits);
  }

  function handleLogout() {
    clearCustomerSession();
    setPhone('');
    setCustomer(null);
    setCards([]);
    setPhase('login');
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-muted">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // ── Login ────────────────────────────────────────────────────────────────
  if (phase === 'login') {
    return (
      <main className="min-h-screen bg-bg-muted flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
              <Star size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-dark">My Rewards</h1>
            <p className="text-text-medium text-sm">Enter your mobile number to see your loyalty cards</p>
          </div>

          <div className="card space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="form-label">Mobile Number</label>
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
                className="btn-primary w-full disabled:opacity-50"
              >
                {fetching ? 'Loading…' : 'View My Rewards →'}
              </button>
            </form>
          </div>

          <PoweredBy />
        </div>
      </main>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  const unlocked = cards.filter(c => c.reward_status === 'unlocked');
  const inProgress = cards.filter(c => c.reward_status !== 'unlocked');

  return (
    <main className="min-h-screen bg-bg-muted pb-12">
      {/* Header */}
      <div className="bg-surface border-b border-border-light px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="font-bold text-text-dark">
              {customer?.name ? `Hi, ${customer.name}!` : 'My Rewards'}
            </p>
            <p className="text-xs text-text-light">+91 {phone}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadCards(phone, customer?.name ?? null)}
              disabled={fetching}
              className="p-2 rounded-xl hover:bg-bg-muted transition-colors text-text-light"
            >
              <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-text-medium hover:text-status-error transition-colors px-2 py-1.5 rounded-xl hover:bg-red-50"
            >
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {cards.length === 0 ? (
          <div className="card text-center py-12 space-y-3">
            <Star size={40} className="text-text-light mx-auto opacity-30" />
            <p className="font-semibold text-text-medium">No loyalty cards yet</p>
            <p className="text-sm text-text-light">Scan a QR code at any LetLoyal merchant to start earning rewards.</p>
          </div>
        ) : (
          <>
            {/* Unlocked rewards */}
            {unlocked.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                  <Gift size={14} /> Rewards Ready to Claim ({unlocked.length})
                </h2>
                {unlocked.map((card, i) => (
                  <LoyaltyCard key={i} card={card} phone={phone} onRedeem={setRedeemCard} />
                ))}
              </section>
            )}

            {/* In-progress */}
            {inProgress.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-bold text-text-medium uppercase tracking-wide">
                  In Progress ({inProgress.length})
                </h2>
                {inProgress.map((card, i) => (
                  <LoyaltyCard key={i} card={card} phone={phone} onRedeem={setRedeemCard} />
                ))}
              </section>
            )}
          </>
        )}

        <PoweredBy />
      </div>

      {/* Redeem modal */}
      {redeemCard && (
        <RedeemModal
          card={redeemCard}
          phone={phone}
          onClose={() => { setRedeemCard(null); loadCards(phone, customer?.name ?? null); }}
        />
      )}
    </main>
  );
}
