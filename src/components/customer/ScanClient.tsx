'use client';

import { useState, useEffect, FormEvent } from 'react';
import MilestoneCard from '@/components/customer/MilestoneCard';
import FeedbackForm from '@/components/customer/FeedbackForm';
import { Phone, User, Gift, RefreshCw, Copy, Check, LayoutDashboard } from 'lucide-react';
import {
  getCustomerSession,
  saveCustomerSession,
  touchCustomerSession,
} from '@/lib/customerSession';
import Link from 'next/link';

interface ScanResult {
  ok:                    boolean;
  business_name:         string;
  progress:              number;
  threshold:             number;
  reward_unlocked:       boolean;       // just crossed threshold THIS scan
  reward_already_waiting: boolean;      // had an unclaimed reward BEFORE this scan
  reward_description:    string;
  points_added:          number;
  is_first_visit:        boolean;
  campaign_type:         'visit_based' | 'spend_based';
}

interface RedeemCode {
  code:        string;
  rewardDesc:  string;
  expiresMinutes: number;
}

interface ScanClientProps {
  token:           string;
  merchantId:      string;
  businessName:    string;
  campaignType:    'visit_based' | 'spend_based';
  slug:            string;
  googleReviewUrl?: string;
}

// ── Countdown timer ───────────────────────────────────────────────────────────
function useCountdown(minutes: number) {
  const [secs, setSecs] = useState(minutes * 60);
  useEffect(() => {
    if (secs <= 0) return;
    const id = setInterval(() => setSecs(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [secs]);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return { expired: secs <= 0, display: `${m}:${String(s).padStart(2, '0')}`, secs };
}

// ── Redeem Code Card ──────────────────────────────────────────────────────────
function RedeemCodeCard({ code, rewardDesc, expiresMinutes, onRefresh }: {
  code: string; rewardDesc: string; expiresMinutes: number; onRefresh: () => void;
}) {
  const [copied,    setCopied]    = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { expired, display, secs } = useCountdown(expiresMinutes);
  const urgency = secs < 120;

  // ── Poll every 3s to detect merchant confirmation ──────────────────
  useEffect(() => {
    if (confirmed || expired) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/public/redeem-code?code=${code}`);
        const data = await res.json();
        if (data.status === 'used') setConfirmed(true);
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(id);
  }, [code, confirmed, expired]);

  function copyCode() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Success state: merchant confirmed ─────────────────────────────
  if (confirmed) {
    return (
      <div className="rounded-2xl border-2 border-green-400 bg-green-50 p-6 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-lg font-bold text-green-800">Reward Claimed! 🎉</p>
        <p className="text-sm text-green-700 font-medium">{rewardDesc}</p>
        <p className="text-xs text-green-600">Enjoy your reward. Keep visiting to earn more!</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-primary bg-primary-light p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mx-auto">
        <Gift size={26} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Your Reward Code</p>
        <p className="text-sm text-text-medium">{rewardDesc}</p>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        {code.split('').map((d, i) => (
          <span key={i} className="w-11 h-14 flex items-center justify-center text-3xl font-bold text-primary bg-white rounded-xl border-2 border-primary shadow-sm">
            {d}
          </span>
        ))}
      </div>
      <button onClick={copyCode} className="flex items-center gap-1.5 mx-auto text-sm font-medium text-primary hover:text-primary/70 transition-colors">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy code'}
      </button>
      {expired ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-status-error">Code expired</p>
          <button onClick={onRefresh} className="flex items-center gap-1.5 mx-auto text-sm font-medium text-primary hover:underline">
            <RefreshCw size={14} /> Generate new code
          </button>
        </div>
      ) : (
        <p className={`text-sm font-semibold tabular-nums ${urgency ? 'text-status-error' : 'text-text-medium'}`}>
          Expires in {display}
        </p>
      )}
      <p className="text-xs text-text-light">Show this code to the merchant to claim your reward</p>
      <p className="text-xs text-text-light/60 flex items-center justify-center gap-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Waiting for merchant confirmation…
      </p>
    </div>
  );
}

// ── Main ScanClient ───────────────────────────────────────────────────────────
export default function ScanClient({ token, merchantId, businessName, campaignType, slug, googleReviewUrl }: ScanClientProps) {
  const [phone,        setPhone]        = useState('');
  const [name,         setName]         = useState('');
  const [loading,      setLoading]      = useState(false);
  const [submitting,   setSubmitting]   = useState(false); // auto-submit in progress
  const [error,        setError]        = useState('');
  const [result,       setResult]       = useState<ScanResult | null>(null);
  const [showName,     setShowName]     = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [redeemCode,   setRedeemCode]   = useState<RedeemCode | null>(null);
  const [codeLoading,  setCodeLoading]  = useState(false);
  const [codeError,    setCodeError]    = useState('');
  const [sessionPhone, setSessionPhone] = useState<string | null>(null);

  // ── On mount: check stored session ───────────────────────────────────────
  useEffect(() => {
    const session = getCustomerSession();
    if (session) {
      setPhone(session.phone);
      setName(session.name ?? '');
      setSessionPhone(session.phone);
      // Auto-submit scan
      setSubmitting(true);
      doScan(session.phone, session.name ?? '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doScan(phoneDigits: string, nameVal: string) {
    setError('');
    setLoading(true);
    try {
      const body: Record<string, string> = { token, phone_number: phoneDigits };
      if (nameVal.trim()) body.name = nameVal.trim();
      const res  = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        if (data.is_first_visit) setShowName(true);
        return;
      }
      setResult(data);
      if (data.is_first_visit) setShowName(true);
      // Update session name if first visit
      saveCustomerSession(phoneDigits, nameVal || data.customer_name || null);
      touchCustomerSession();
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    saveCustomerSession(digits, name || null);
    await doScan(digits, name);
  }

  async function generateRedeemCode() {
    setCodeLoading(true);
    setCodeError('');
    try {
      const res  = await fetch('/api/public/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, slug }),
      });
      const data = await res.json();
      if (!res.ok) { setCodeError(data.error || 'Could not generate code. Try again.'); return; }
      setRedeemCode({ code: data.code, rewardDesc: data.reward_description, expiresMinutes: data.expires_minutes });
    } catch {
      setCodeError('Connection error. Try again.');
    } finally {
      setCodeLoading(false);
    }
  }

  // ── Auto-submitting spinner ───────────────────────────────────────────────
  if (submitting) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <svg className="animate-spin h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-text-medium text-sm">Claiming your stamp…</p>
      </div>
    );
  }

  // ── Show redeem code ──────────────────────────────────────────────────────
  if (redeemCode) {
    return (
      <div className="space-y-4">
        <RedeemCodeCard
          code={redeemCode.code}
          rewardDesc={redeemCode.rewardDesc}
          expiresMinutes={redeemCode.expiresMinutes}
          onRefresh={() => { setRedeemCode(null); generateRedeemCode(); }}
        />
        {showFeedback && (
          <FeedbackForm
            merchantId={merchantId}
            phoneNumber={phone}
            googleReviewUrl={googleReviewUrl}
            onDismiss={() => setShowFeedback(false)}
          />
        )}
      </div>
    );
  }

  // ── Scan success ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="space-y-4">
        <MilestoneCard
          businessName={result.business_name || businessName}
          progress={result.progress}
          threshold={result.threshold}
          rewardDescription={result.reward_description}
          rewardUnlocked={result.reward_unlocked}
          pointsAdded={result.points_added}
          campaignType={result.campaign_type}
        />

        {/* Reward just unlocked this scan */}
        {result.reward_unlocked && (
          <div className="space-y-2">
            <button
              onClick={generateRedeemCode}
              disabled={codeLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
            >
              {codeLoading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating…</>
              ) : (
                <><Gift size={20} />Redeem Now</>
              )}
            </button>
            {codeError && <p className="text-sm text-status-error text-center">{codeError}</p>}
          </div>
        )}

        {/* Reward was already waiting — stamp still added, gentle reminder */}
        {result.reward_already_waiting && !result.reward_unlocked && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-2">
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
              <Gift size={15} /> You have a reward ready to claim!
            </p>
            <p className="text-xs text-amber-700">
              Your stamp was added. Claim your reward whenever you&apos;re ready — show it to the staff.
            </p>
            <button
              onClick={generateRedeemCode}
              disabled={codeLoading}
              className="w-full mt-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
            >
              {codeLoading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating…</>
              ) : (
                <><Gift size={15} />Claim Reward</>
              )}
            </button>
            {codeError && <p className="text-xs text-status-error text-center">{codeError}</p>}
          </div>
        )}

        {/* No reward — keep earning */}
        {!result.reward_unlocked && !result.reward_already_waiting && (
          <p className="text-center text-xs text-text-light pt-2">
            Come back again to keep earning {campaignType === 'visit_based' ? 'stamps' : 'points'}!
          </p>
        )}

        {/* Link to customer dashboard */}
        {sessionPhone && (
          <Link
            href="/my-rewards"
            className="flex items-center justify-center gap-2 text-sm text-primary font-medium hover:underline pt-1"
          >
            <LayoutDashboard size={14} /> View all my rewards
          </Link>
        )}

        {showFeedback && (
          <FeedbackForm
            merchantId={merchantId}
            phoneNumber={phone}
            googleReviewUrl={googleReviewUrl}
            onDismiss={() => setShowFeedback(false)}
          />
        )}
      </div>
    );
  }

  // ── Phone entry form ──────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-dark mb-1">Enter your mobile number</h2>
        <p className="text-sm text-text-medium">We&apos;ll use this to track your loyalty points.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
                onChange={e => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                placeholder="98765 43210"
                className="form-input pl-9"
                inputMode="numeric"
                autoComplete="tel-national"
                autoFocus
                required
              />
            </div>
          </div>
        </div>

        {showName && (
          <div>
            <label className="form-label">Your Name <span className="text-text-light font-normal">(optional)</span></label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" className="form-input pl-9" autoComplete="name" maxLength={120} />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error font-medium">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading || phone.replace(/\D/g, '').length !== 10} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking…
            </span>
          ) : 'Claim My Stamp'}
        </button>
      </form>

      <Link href="/my-rewards" className="flex items-center justify-center gap-1.5 text-sm text-primary font-medium hover:underline">
        <LayoutDashboard size={14} /> View my rewards dashboard
      </Link>
    </div>
  );
}
