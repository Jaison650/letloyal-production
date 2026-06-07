'use client';

import { useState, useEffect, FormEvent } from 'react';
import MilestoneCard from '@/components/customer/MilestoneCard';
import FeedbackForm from '@/components/customer/FeedbackForm';
import { Phone, User, Gift, RefreshCw, Copy, Check } from 'lucide-react';

interface ScanResult {
  ok:                 boolean;
  business_name:      string;
  progress:           number;
  threshold:          number;
  reward_unlocked:    boolean;
  reward_description: string;
  points_added:       number;
  is_first_visit:     boolean;
  campaign_type:      'visit_based' | 'spend_based';
}

interface RedeemCode {
  code:        string;
  rewardDesc:  string;
  expiresMinutes: number;
}

interface ScanClientProps {
  token:        string;
  merchantId:   string;
  businessName: string;
  campaignType: 'visit_based' | 'spend_based';
  slug:         string;
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

// ── Redeem Code display ───────────────────────────────────────────────────────
function RedeemCodeCard({
  code, rewardDesc, expiresMinutes, onRefresh,
}: {
  code: string; rewardDesc: string; expiresMinutes: number; onRefresh: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { expired, display, secs } = useCountdown(expiresMinutes);
  const urgency = secs < 120;

  function copyCode() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

      {/* Big 6-digit code */}
      <div className="flex items-center justify-center gap-1.5">
        {code.split('').map((d, i) => (
          <span
            key={i}
            className="w-11 h-14 flex items-center justify-center text-3xl font-bold text-primary bg-white rounded-xl border-2 border-primary shadow-sm"
          >
            {d}
          </span>
        ))}
      </div>

      {/* Copy button */}
      <button
        onClick={copyCode}
        className="flex items-center gap-1.5 mx-auto text-sm font-medium text-primary hover:text-primary/70 transition-colors"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy code'}
      </button>

      {/* Timer */}
      {expired ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-status-error">Code expired</p>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 mx-auto text-sm font-medium text-primary hover:underline"
          >
            <RefreshCw size={14} /> Generate new code
          </button>
        </div>
      ) : (
        <p className={`text-sm font-semibold tabular-nums ${urgency ? 'text-status-error' : 'text-text-medium'}`}>
          Expires in {display}
        </p>
      )}

      <p className="text-xs text-text-light">Show this code to the merchant to claim your reward</p>
    </div>
  );
}

// ── Main ScanClient ───────────────────────────────────────────────────────────
export default function ScanClient({ token, merchantId, businessName, campaignType, slug }: ScanClientProps) {
  const [phone,        setPhone]        = useState('');
  const [name,         setName]         = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [result,       setResult]       = useState<ScanResult | null>(null);
  const [showName,     setShowName]     = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [redeemCode,   setRedeemCode]   = useState<RedeemCode | null>(null);
  const [codeLoading,  setCodeLoading]  = useState(false);
  const [codeError,    setCodeError]    = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    setLoading(true);
    try {
      const body: Record<string, string> = { token, phone_number: digits };
      if (name.trim()) body.name = name.trim();
      const res  = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        if (data.is_first_visit) setShowName(true);
        return;
      }
      setResult(data);
      if (data.is_first_visit) setShowName(true);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <FeedbackForm merchantId={merchantId} phoneNumber={phone} onDismiss={() => setShowFeedback(false)} />
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

        {/* Redeem Now button — shown when reward unlocked */}
        {result.reward_unlocked && (
          <div className="space-y-2">
            <button
              onClick={generateRedeemCode}
              disabled={codeLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
            >
              {codeLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <Gift size={20} />
                  Redeem Now
                </>
              )}
            </button>
            {codeError && <p className="text-sm text-status-error text-center">{codeError}</p>}
          </div>
        )}

        {!result.reward_unlocked && (
          <p className="text-center text-xs text-text-light pt-2">
            Come back again to keep earning {campaignType === 'visit_based' ? 'stamps' : 'points'}!
          </p>
        )}

        {showFeedback && (
          <FeedbackForm merchantId={merchantId} phoneNumber={phone} onDismiss={() => setShowFeedback(false)} />
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
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
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
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="form-input pl-9"
                autoComplete="name"
                maxLength={120}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || phone.replace(/\D/g, '').length !== 10}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
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
    </div>
  );
}
