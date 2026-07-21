'use client';

import { useState, useEffect, FormEvent } from 'react';
import MilestoneCard from '@/components/customer/MilestoneCard';
import FeedbackForm from '@/components/customer/FeedbackForm';
import { Phone, User, Mail, Lock, Eye, EyeOff, Gift, RefreshCw, Copy, Check, LayoutDashboard } from 'lucide-react';
import { setAnalyticsConsent } from '@/lib/analyticsConsent';
import { Input } from '@/components/ds';
import Link from 'next/link';

interface ScanResult {
  ok:                     boolean;
  business_name:          string;
  progress:               number;
  threshold:              number;
  reward_unlocked:        boolean;       // just crossed threshold THIS scan
  reward_already_waiting: boolean;      // had an unclaimed reward BEFORE this scan
  reward_description:     string;
  points_added:           number;
  is_first_visit:         boolean;
  campaign_type:          'visit_based' | 'spend_based';
  streak_enabled:     boolean;
  streak_count:       number;
  streak_bonus:       boolean;
  streak_days_target: number;
  streak_multiplier:  number;
  streak_period:      'day' | 'week' | 'month';
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
function RedeemCodeCard({ code, rewardDesc, expiresMinutes, onRefresh, onCancel }: {
  code: string; rewardDesc: string; expiresMinutes: number;
  onRefresh: () => void; onCancel: () => void;
}) {
  const [copied,    setCopied]    = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [rejected,  setRejected]  = useState(false);
  const { expired, display, secs } = useCountdown(expiresMinutes);
  const urgency = secs < 120;

  // ── Poll every 3s to detect merchant confirmation or rejection ─────
  useEffect(() => {
    if (confirmed || rejected || expired) return;
    const id = setInterval(async () => {
      try {
        const res  = await fetch(`/api/public/redeem-code?code=${code}`);
        const data = await res.json();
        if (data.status === 'used')    setConfirmed(true);
        if (data.status === 'expired') setRejected(true);
      } catch { /* ignore network errors — keep polling */ }
    }, 3000);
    return () => clearInterval(id);
  }, [code, confirmed, rejected, expired]);

  function copyCode() {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Success state ─────────────────────────────────────────────────
  if (confirmed) {
    return (
      <div className="rounded-[16px] border border-good/40 bg-good-subtle p-6 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-good flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-lg font-bold text-good">Reward Claimed! 🎉</p>
        <p className="text-sm text-good font-medium">{rewardDesc}</p>
        <p className="text-xs text-good/80">Enjoy your reward. Keep visiting to earn more!</p>
      </div>
    );
  }

  // ── Rejected / invalidated by merchant ───────────────────────────
  if (rejected) {
    return (
      <div className="rounded-[16px] border border-warn/40 bg-warn-subtle p-6 text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-warn flex items-center justify-center mx-auto">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <p className="text-base font-bold text-warn">Code Not Accepted</p>
        <p className="text-sm text-warn/90">This code was marked invalid by the merchant. Please speak to the staff or generate a new code.</p>
        <div className="flex flex-col gap-2 pt-1">
          <button onClick={onRefresh} className="bg-teal hover:bg-teal-hover text-teal-fg font-bold rounded-full text-sm py-2.5 flex items-center justify-center gap-1.5 transition-colors">
            <RefreshCw size={14} /> Generate New Code
          </button>
          <button onClick={onCancel} className="text-xs text-ink-faint hover:text-ink-sub transition-colors">
            ← Back to my rewards
          </button>
        </div>
      </div>
    );
  }

  // ── Expired countdown state ───────────────────────────────────────
  if (expired) {
    return (
      <div className="rounded-[16px] border border-stroke bg-surface-1 p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mx-auto">
          <Gift size={26} className="text-ink-faint" />
        </div>
        <p className="font-bold text-ink">Code Expired</p>
        <p className="text-sm text-ink-sub">Your 10-minute window has passed. Generate a fresh code and show it to the merchant.</p>
        <div className="flex flex-col gap-2 pt-1">
          <button onClick={onRefresh} className="bg-teal hover:bg-teal-hover text-teal-fg font-bold rounded-full text-sm py-2.5 flex items-center justify-center gap-1.5 transition-colors">
            <RefreshCw size={14} /> Get New Code
          </button>
          <button onClick={onCancel} className="text-xs text-ink-faint hover:text-ink-sub transition-colors">
            ← Back to my rewards
          </button>
        </div>
      </div>
    );
  }

  // ── Active code ───────────────────────────────────────────────────
  return (
    <div className="rounded-[16px] border border-reward/40 bg-reward-subtle p-6 text-center space-y-4">
      <div className="w-14 h-14 rounded-full bg-reward flex items-center justify-center mx-auto">
        <Gift size={26} className="text-reward-fg" />
      </div>
      <div>
        <p className="text-xs font-semibold text-reward-deep uppercase tracking-widest mb-1">Your Reward Code</p>
        <p className="text-sm text-ink-sub">{rewardDesc}</p>
      </div>
      <div data-clarity-mask="true" className="flex items-center justify-center gap-1.5">
        {code.split('').map((d, i) => (
          <span key={i} className="w-11 h-14 flex items-center justify-center font-display font-extrabold tracking-widest text-3xl text-reward-deep bg-surface-1 rounded-xl border-2 border-reward shadow-ds">
            {d}
          </span>
        ))}
      </div>
      <button onClick={copyCode} className="flex items-center gap-1.5 mx-auto text-sm font-medium text-reward-deep hover:opacity-70 transition-colors">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? 'Copied!' : 'Copy code'}
      </button>
      <p className={`text-sm font-semibold tabular-nums ${urgency ? 'text-bad' : 'text-ink-sub'}`}>
        Expires in {display}
      </p>
      <p className="text-xs text-ink-faint">Show this code to the merchant to claim your reward</p>
      <p className="text-xs text-ink-faint/60 flex items-center justify-center gap-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-good animate-pulse" />
        Waiting for merchant confirmation…
      </p>
      <button onClick={onCancel} className="text-xs text-ink-faint hover:text-ink-sub transition-colors pt-1">
        ← Back to my rewards
      </button>
    </div>
  );
}

// ── Main ScanClient ───────────────────────────────────────────────────────────
type Step = 'phone' | 'register' | 'login' | 'scanning' | 'result';

export default function ScanClient({ token, merchantId, businessName, campaignType, slug, googleReviewUrl }: ScanClientProps) {
  const [step,         setStep]         = useState<Step>('phone');
  const [phone,        setPhone]        = useState('');
  const [name,         setName]         = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirmPw,    setConfirmPw]    = useState('');
  const [consent,      setConsent]      = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [showPw,       setShowPw]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [result,       setResult]       = useState<ScanResult | null>(null);
  const [showFeedback, setShowFeedback] = useState(true);
  const [redeemCode,   setRedeemCode]   = useState<RedeemCode | null>(null);
  const [codeLoading,  setCodeLoading]  = useState(false);
  const [codeError,    setCodeError]    = useState('');
  const [sessionPhone, setSessionPhone] = useState<string | null>(null);
  const [pushOffered,  setPushOffered]  = useState(false);
  const [pushDone,     setPushDone]     = useState(false);

  // ── On mount: check cookie session → auto-scan ──────────────────────────
  useEffect(() => {
    fetch('/api/customer/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.ok && data.customer) {
          const phoneDigits = data.customer.phone ?? '';
          const nameVal     = data.customer.name  ?? '';
          setPhone(phoneDigits);
          setName(nameVal);
          setSessionPhone(phoneDigits);
          setStep('scanning');
          doScan(phoneDigits, nameVal);
        }
        // If no session, stay on phone-entry step (default)
      })
      .catch(() => { /* no session — stay on phone entry */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doScan(phoneDigits: string, nameVal: string) {
    setError('');
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const body: Record<string, string> = { token, phone_number: phoneDigits };
      if (nameVal.trim()) body.name = nameVal.trim();
      const res  = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
      clearTimeout(timer);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setStep('phone');
        return;
      }
      setResult(data);
      setStep('result');
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Connection timed out. Please try again.');
      } else if (!navigator.onLine) {
        setError('No internet connection. Please check your network and try again.');
      } else {
        setError('Connection error. Please try again.');
      }
      setStep('phone');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 1: Phone submitted → check account ──────────────────────────────
  async function handlePhoneSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await fetch('/api/customer/lookup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: digits }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); return; }
      if (!data.customer || !data.has_password) {
        setStep('register');
      } else {
        setStep('login');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2a: Register new account → scan ────────────────────────────────
  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a valid email address.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPw) { setError('Passwords do not match.'); return; }
    if (!consent) { setError('Please agree to the data processing terms to continue.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/customer/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name.trim() || 'Customer', email: email.trim().toLowerCase(), phone_number: phone, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed.'); return; }
      setAnalyticsConsent(analyticsOptIn);
      setSessionPhone(data.customer.phone);
      setStep('scanning');
      doScan(data.customer.phone, data.customer.name ?? '');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2b: Login existing account → scan ───────────────────────────────
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!password) { setError('Password is required.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/customer/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone_number: phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'PASSWORD_NOT_SET') {
          setStep('register');
          setError('Please create a password to secure your account.');
        } else {
          setError(data.error || 'Incorrect password.');
        }
        return;
      }
      setSessionPhone(data.customer.phone);
      setStep('scanning');
      doScan(data.customer.phone, data.customer.name ?? '');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function generateRedeemCode() {
    setCodeLoading(true);
    setCodeError('');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res  = await fetch('/api/public/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, slug }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const data = await res.json();
      if (!res.ok) { setCodeError(data.error || 'Could not generate code. Try again.'); return; }
      setRedeemCode({ code: data.code, rewardDesc: data.reward_description, expiresMinutes: data.expires_minutes });
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        setCodeError('Connection timed out. Please try again.');
      } else if (!navigator.onLine) {
        setCodeError('No internet connection. Please try again when back online.');
      } else {
        setCodeError('Connection error. Try again.');
      }
    } finally {
      setCodeLoading(false);
    }
  }

  // ── Customer push opt-in ────────────────────────────────────────────────
  async function subscribePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setPushDone(true); return; }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setPushDone(true); return; }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';
      if (!vapid) { setPushDone(true); return; }
      const padding = '='.repeat((4 - vapid.length % 4) % 4);
      const base64  = (vapid + padding).replace(/-/g, '+').replace(/_/g, '/');
      const raw     = window.atob(base64);
      const key     = new Uint8Array([...raw].map(c => c.charCodeAt(0)));
      const sub     = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
      const p256dh  = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!)));
      const auth    = btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!)));
      await fetch('/api/push/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'customer', ownerId: phone.replace(/\D/g, ''),
          merchantId,
          subscription: { endpoint: sub.endpoint, keys: { p256dh, auth } },
        }),
      });
    } catch { /* silent */ }
    setPushDone(true);
  }

  // ── Scanning spinner ─────────────────────────────────────────────────────
  if (step === 'scanning') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <svg className="animate-spin h-10 w-10 text-teal" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-ink-sub text-sm">Claiming your stamp…</p>
      </div>
    );
  }

  // ── Show redeem code ──────────────────────────────────────────────────────
  if (redeemCode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs text-ink-faint hover:text-teal transition-colors">← Home</Link>
          <Link href="/my-rewards" className="text-xs text-teal font-medium hover:underline">My rewards →</Link>
        </div>
        <RedeemCodeCard
          code={redeemCode.code}
          rewardDesc={redeemCode.rewardDesc}
          expiresMinutes={redeemCode.expiresMinutes}
          onRefresh={() => { setRedeemCode(null); generateRedeemCode(); }}
          onCancel={() => setRedeemCode(null)}
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
              className="bg-teal hover:bg-teal-hover text-teal-fg font-bold rounded-full w-full flex items-center justify-center gap-2 text-base py-4 transition-colors disabled:opacity-50"
            >
              {codeLoading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating…</>
              ) : (
                <><Gift size={20} />Redeem Now</>
              )}
            </button>
            {codeError && <p className="text-sm text-bad text-center">{codeError}</p>}
          </div>
        )}

        {/* Reward was already waiting — stamp still added, gentle reminder */}
        {result.reward_already_waiting && !result.reward_unlocked && (
          <div className="rounded-[11px] bg-reward-subtle border border-reward/40 px-4 py-3 space-y-2">
            <p className="text-sm font-semibold text-reward-deep flex items-center gap-1.5">
              <Gift size={15} /> You have a reward ready to claim!
            </p>
            <p className="text-xs text-reward-deep/80">
              Your stamp was added. Claim your reward whenever you&apos;re ready — show it to the staff.
            </p>
            <button
              onClick={generateRedeemCode}
              disabled={codeLoading}
              className="w-full mt-1 bg-reward hover:brightness-95 text-reward-fg font-semibold py-2 rounded-full flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-50"
            >
              {codeLoading ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating…</>
              ) : (
                <><Gift size={15} />Claim Reward</>
              )}
            </button>
            {codeError && <p className="text-xs text-bad text-center">{codeError}</p>}
          </div>
        )}

        {/* No reward — keep earning */}
        {!result.reward_unlocked && !result.reward_already_waiting && (
          <p className="text-center text-xs text-ink-faint pt-2">
            Come back again to keep earning {campaignType === 'visit_based' ? 'stamps' : 'points'}!
          </p>
        )}

        {/* Streak bonus banner */}
        {result.streak_enabled && result.streak_count > 0 && (() => {
          const p = result.streak_period ?? 'day';
          const periodLabel = p === 'day' ? 'Day' : p === 'week' ? 'Week' : 'Month';
          const nextLabel   = p === 'day' ? 'tomorrow' : p === 'week' ? 'next week' : 'next month';
          const remaining   = result.streak_days_target - result.streak_count;
          return (
            <div className={`rounded-[11px] border px-4 py-3 flex items-center gap-3 ${
              result.streak_bonus
                ? 'bg-reward-subtle border-reward/40'
                : 'bg-warn-subtle border-warn/30'
            }`}>
              <span className="text-2xl">🔥</span>
              <div className="flex-1 min-w-0">
                {result.streak_bonus ? (
                  <>
                    <p className="text-sm font-bold text-reward-deep">
                      {result.streak_count}-{periodLabel} Streak Bonus! {result.streak_multiplier}× Points
                    </p>
                    <p className="text-xs text-reward-deep/80">
                      Keep it up — come back {nextLabel} to continue your streak!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-warn">
                      {result.streak_count}-{periodLabel} Streak
                    </p>
                    <p className="text-xs text-warn/90">
                      {remaining > 0
                        ? `${remaining} more ${p}${remaining > 1 ? 's' : ''} to earn ${result.streak_multiplier}× points!`
                        : `Come back ${nextLabel} to keep your streak going!`
                      }
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* Link to customer dashboard — always visible */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <Link
            href="/my-rewards"
            className="flex items-center justify-center gap-2 text-sm text-teal font-medium hover:underline"
          >
            <LayoutDashboard size={14} />
            {sessionPhone ? 'View all my rewards' : 'Create account / View rewards'}
          </Link>
          <Link href="/" className="text-xs text-ink-faint hover:text-ink-sub transition-colors">
            ← Back to home
          </Link>
        </div>

        {/* Push notification opt-in */}
        {!pushOffered && !pushDone && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
          <div className="rounded-[11px] border border-stroke bg-surface-1 px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-lg flex-shrink-0">🔔</span>
              <p className="text-xs text-ink-sub">Get notified about offers from this store</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => { setPushOffered(true); setPushDone(true); }}
                className="text-xs text-ink-faint hover:text-ink px-2 py-1">No</button>
              <button onClick={() => { setPushOffered(true); subscribePush(); }}
                className="text-xs bg-teal text-teal-fg px-3 py-1.5 rounded-full font-medium">Yes</button>
            </div>
          </div>
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

  // ── Shared nav bar for auth steps ────────────────────────────────────────
  const navBar = (
    <div className="flex items-center justify-between mb-2">
      <button onClick={() => { setStep('phone'); setError(''); setPassword(''); setConfirmPw(''); }}
        className="text-xs text-ink-faint hover:text-teal transition-colors">← Back</button>
      <Link href="/" className="text-xs text-ink-faint hover:text-teal transition-colors">Home</Link>
    </div>
  );

  // ── Step 1: Phone entry ───────────────────────────────────────────────────
  if (step === 'phone') {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-ink-faint hover:text-teal transition-colors">
            <span>←</span> Back to home
          </Link>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-ink mb-1">Enter your mobile number</h2>
          <p className="text-sm text-ink-sub">We&apos;ll use this to track your loyalty points.</p>
        </div>
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-body-sm font-semibold text-ink mb-1.5">Mobile Number</span>
            <div className="flex gap-2">
              <div className="flex items-center justify-center px-3 rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-2 text-ink-sub font-medium text-sm flex-shrink-0">
                🇮🇳 +91
              </div>
              <span className="relative block flex-1">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                <Input type="tel" value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  placeholder="98765 43210" className="pl-9"
                  inputMode="numeric" autoComplete="tel-national" autoFocus required />
              </span>
            </div>
          </label>
          {error && <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-sm text-bad font-medium">{error}</div>}
          <button type="submit" disabled={loading || phone.replace(/\D/g, '').length !== 10}
            className="bg-teal hover:bg-teal-hover text-teal-fg font-bold rounded-full w-full py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Checking…</span> : 'Continue'}
          </button>
        </form>
        <Link href="/my-rewards" className="flex items-center justify-center gap-1.5 text-sm text-teal font-medium hover:underline">
          <LayoutDashboard size={14} /> View my rewards dashboard
        </Link>
      </div>
    );
  }

  // ── Step 2a: Register ─────────────────────────────────────────────────────
  if (step === 'register') {
    return (
      <div className="space-y-4">
        {navBar}
        <div className="text-center">
          <h2 className="text-xl font-bold text-ink mb-1">Create your account</h2>
          <p data-clarity-mask="true" className="text-sm text-ink-sub">+91 {phone} · Enter your details to get started</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-3">
          {/* Name — optional */}
          <label className="block">
            <span className="block text-body-sm font-semibold text-ink mb-1.5">Your Name <span className="text-ink-faint font-normal">(optional)</span></span>
            <span className="relative block">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <Input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Enter your name" className="pl-9" autoComplete="name" maxLength={120} />
            </span>
          </label>
          {/* Email — required */}
          <label className="block">
            <span className="block text-body-sm font-semibold text-ink mb-1.5">Email <span className="text-bad">*</span></span>
            <span className="relative block">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="pl-9" autoComplete="email" required />
            </span>
          </label>
          {/* Password — required */}
          <label className="block">
            <span className="block text-body-sm font-semibold text-ink mb-1.5">Password <span className="text-bad">*</span></span>
            <span className="relative block">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min 8 characters" className="pl-9 pr-10" autoComplete="new-password" required />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </span>
          </label>
          {/* Confirm password */}
          <label className="block">
            <span className="block text-body-sm font-semibold text-ink mb-1.5">Confirm Password <span className="text-bad">*</span></span>
            <span className="relative block">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <Input type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat password" className="pl-9" autoComplete="new-password" required />
            </span>
          </label>
          {error && <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-sm text-bad font-medium">{error}</div>}
          {/* DPDP 2023 — required notice + consent for account processing */}
          <label className="flex items-start gap-2 text-xs text-ink-sub cursor-pointer">
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required
              className="mt-0.5 h-4 w-4 rounded border-stroke-strong text-teal focus:ring-teal shrink-0" />
            <span>
              I agree to LetLoyal collecting my name, phone number, email address, and optional date of
              birth and gender to operate my loyalty account, as described in the{' '}
              <Link href="/privacy-policy" target="_blank" className="text-teal underline">Privacy Policy</Link>.
            </span>
          </label>
          {/* DPDP 2023 — separate, optional analytics consent (default off) */}
          <label className="flex items-start gap-2 text-xs text-ink-faint cursor-pointer">
            <input type="checkbox" checked={analyticsOptIn} onChange={e => setAnalyticsOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-stroke-strong text-teal focus:ring-teal shrink-0" />
            <span>Optional: allow anonymous usage analytics to help improve the app. You can turn this off anytime in My Rewards.</span>
          </label>
          <button type="submit" disabled={loading} className="bg-teal hover:bg-teal-hover text-teal-fg font-bold rounded-full w-full py-3 transition-colors disabled:opacity-50">
            {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Creating account…</span> : 'Create Account & Claim Stamp'}
          </button>
        </form>
      </div>
    );
  }

  // ── Step 2b: Login ────────────────────────────────────────────────────────
  if (step === 'login') {
    return (
      <div className="space-y-4">
        {navBar}
        <div className="text-center">
          <h2 className="text-xl font-bold text-ink mb-1">Welcome back!</h2>
          <p data-clarity-mask="true" className="text-sm text-ink-sub">+91 {phone} · Enter your password to continue</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-3">
          <label className="block">
            <span className="block text-body-sm font-semibold text-ink mb-1.5">Password</span>
            <span className="relative block">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" className="pl-9 pr-10" autoComplete="current-password" autoFocus required />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </span>
          </label>
          {error && <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-sm text-bad font-medium">{error}</div>}
          <button type="submit" disabled={loading} className="bg-teal hover:bg-teal-hover text-teal-fg font-bold rounded-full w-full py-3 transition-colors disabled:opacity-50">
            {loading ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Signing in…</span> : 'Sign In & Claim Stamp'}
          </button>
          <p className="text-center text-xs text-ink-faint pt-1">
            Forgot your password?{' '}
            <Link href="/my-rewards" className="text-teal font-medium hover:underline">Reset via My Rewards</Link>
          </p>
        </form>
      </div>
    );
  }

  return null;
}
