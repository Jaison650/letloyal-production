'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Phone, Mail, User, Lock, Eye, EyeOff, Gift, LogOut, RefreshCw,
  CreditCard, ScanLine, ArrowRight, Copy, Check, MapPin,
  ChevronDown, ChevronUp, Calendar, Users,
} from 'lucide-react';
import {
  getCustomerSession, saveCustomerSession,
  clearCustomerSession, getCustomerToken,
} from '@/lib/customerSession';
import Logo, { LogoIcon } from '@/components/ui/Logo';
import type { ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface LoyaltyCard {
  merchant_slug: string; business_name: string; logo_url: string | null;
  campaign_name: string; campaign_type: string; progress: number;
  reward_threshold: number; reward_description: string;
  reward_status: 'in_progress' | 'unlocked'; cycle_number: number; last_scan_at: string | null;
}
interface DiscoverStore {
  slug: string; business_name: string; logo_url: string | null;
  campaign_name: string; campaign_type: string; reward_description: string; reward_threshold: number;
}
interface CustomerData {
  id: string; name: string | null; phone: string; email: string | null;
  birthday: string | null; gender: string | null;
}
type Tab = 'cards' | 'scan' | 'account';
type AuthMode = 'login' | 'register' | 'forgot';

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
    <div className="rounded-xl overflow-hidden bg-primary-light flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}>
      {logo_url
        ? <Image src={logo_url} alt={name} width={size} height={size} className="object-cover w-full h-full" unoptimized />
        : <span className="font-bold text-primary" style={{ fontSize: size * 0.4 }}>{name[0]}</span>}
    </div>
  );
}

// ── Inline redeem code ────────────────────────────────────────────────────────
function InlineRedeemCode({ phone, slug, onCancel }: { phone: string; slug: string; onCancel: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [secs, setSecs] = useState(600);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/public/redeem-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phone, slug }),
    })
      .then(r => r.json())
      .then(d => { if (d.code) { setCode(d.code); setSecs((d.expires_minutes ?? 10) * 60); } else setError(d.error || 'Could not generate code.'); })
      .catch(() => setError('Connection error.'))
      .finally(() => setLoading(false));
  }, [phone, slug]);

  useEffect(() => {
    if (!code || secs <= 0) return;
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [code, secs]);

  const m = Math.floor(secs / 60); const s = secs % 60;
  const expired = secs === 0; const urgent = secs < 120 && !expired;

  return (
    <div className="mt-3 rounded-xl bg-primary-light border border-primary/20 p-4 space-y-3">
      <p className="text-xs font-semibold text-primary text-center uppercase tracking-widest">Show this code to the merchant</p>
      {loading ? <div className="flex justify-center py-4"><Spinner /></div>
        : error ? <p className="text-center text-sm text-status-error py-2">{error}</p>
        : code ? (
          <>
            <div className="flex items-center justify-center gap-1.5">
              {code.split('').map((d, i) => (
                <span key={i} className="w-10 flex items-center justify-center text-2xl font-bold text-primary bg-white rounded-xl border-2 border-primary shadow-sm" style={{ height: 52 }}>{d}</span>
              ))}
            </div>
            <div className="flex items-center justify-center">
              <button onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied!' : 'Copy code'}
              </button>
            </div>
            {expired
              ? <p className="text-xs text-center font-semibold text-status-error">Code expired</p>
              : <p className={`text-xs text-center font-semibold tabular-nums ${urgent ? 'text-orange-500' : 'text-text-medium'}`}>Expires in {m}:{String(s).padStart(2, '0')}</p>}
          </>
        ) : null}
      <button onClick={onCancel} className="w-full text-xs text-text-light hover:text-text-medium transition-colors text-center">Cancel Redemption</button>
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
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <MerchantAvatar logo_url={card.logo_url} name={card.business_name} size={44} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text-dark truncate">{card.business_name}</p>
          <p className="text-xs text-text-light">{isSpend ? 'Spend-based' : 'Visit-based'} · {card.campaign_name}</p>
        </div>
        {isUnlocked && <span className="text-xs font-bold bg-primary text-white px-2 py-1 rounded-full flex-shrink-0">🎉 Ready!</span>}
      </div>
      <div className="px-4 pb-4">
        <p className="text-sm font-semibold text-text-dark flex items-center gap-1.5 mb-2">
          <Gift size={13} className="text-primary flex-shrink-0" />{card.reward_description}
        </p>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-text-medium tabular-nums">{card.progress} / {card.reward_threshold} {isSpend ? 'points' : 'visits'}</span>
          {isUnlocked
            ? <span className="text-xs font-semibold text-primary">🎉 Reward ready!</span>
            : <span className="text-xs text-text-light">{remaining} more to go</span>}
        </div>
        <div className="h-2 bg-bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isUnlocked ? 'bg-primary' : 'bg-primary/60'}`} style={{ width: `${pct}%` }} />
        </div>
        {isUnlocked && !showCode && (
          <button onClick={() => setShowCode(true)}
            className="mt-3 w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Gift size={16} /> Redeem Now
          </button>
        )}
        {isUnlocked && showCode && <InlineRedeemCode phone={phone} slug={card.merchant_slug} onCancel={() => setShowCode(false)} />}
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
      <span className="text-xs font-semibold text-primary flex items-center gap-0.5 flex-shrink-0">Scan to Join <ArrowRight size={12} /></span>
    </div>
  );
}

// ── Inline editable field ─────────────────────────────────────────────────────
function ProfileField({
  label, value, icon, onSave, type = 'text', options,
}: {
  label: string; value: string | null; icon: ReactNode;
  onSave: (val: string) => Promise<void>; type?: string;
  options?: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function handleSave() {
    setSaving(true); setErr('');
    try { await onSave(input); setEditing(false); }
    catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed to save.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="px-4 py-3 border-b border-border-light last:border-0">
      {!editing ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-text-light flex-shrink-0">{icon}</span>
            <div className="min-w-0">
              <p className="text-xs text-text-light">{label}</p>
              <p className={`text-sm font-medium truncate ${value ? 'text-text-dark' : 'text-text-light italic'}`}>{value || 'Not set'}</p>
            </div>
          </div>
          <button onClick={() => { setInput(value ?? ''); setEditing(true); }}
            className="text-xs text-primary font-semibold flex-shrink-0 ml-2">{value ? 'Edit' : 'Add'}</button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-dark">{label}</p>
          {options ? (
            <select value={input} onChange={e => setInput(e.target.value)} className="form-input text-sm">
              <option value="">Prefer not to say</option>
              {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input type={type} value={input} onChange={e => setInput(e.target.value)}
              className="form-input text-sm" />
          )}
          {err && <p className="text-xs text-status-error">{err}</p>}
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-primary text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditing(false); setErr(''); }}
              className="flex-1 border border-border-light text-xs font-semibold py-2 rounded-lg text-text-medium">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MyRewardsPage() {
  const [phase,     setPhase]     = useState<'loading' | 'login' | 'dashboard'>('loading');
  const [authMode,  setAuthMode]  = useState<AuthMode>('login');
  const [phone,     setPhone]     = useState('');
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent]   = useState(false);
  const [customer,  setCustomer]  = useState<CustomerData | null>(null);
  const [cards,     setCards]     = useState<LoyaltyCard[]>([]);
  const [stores,    setStores]    = useState<DiscoverStore[]>([]);
  const [fetching,  setFetching]  = useState(false);
  const [error,     setError]     = useState('');
  const [tab,       setTab]       = useState<Tab>('cards');
  const [pwSection, setPwSection] = useState(false);
  const [curPw,     setCurPw]     = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError,   setPwError]   = useState('');
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwDone,    setPwDone]    = useState(false);

  // ── Auth header for profile API calls ──────────────────────────────────
  function authHeaders(): Record<string, string> {
    const token = getCustomerToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  const loadCards = useCallback(async (phoneDigits: string, cName: string | null = null) => {
    setFetching(true);
    try {
      const token = getCustomerToken();
      const authHdr: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [lookupRes, discoverRes, profileRes] = await Promise.all([
        fetch('/api/customer/lookup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneDigits }),
        }),
        fetch('/api/customer/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ phone_number: phoneDigits }),
        }),
        token
          ? fetch('/api/customer/profile', { headers: { 'Content-Type': 'application/json', ...authHdr } })
          : Promise.resolve(null),
      ]);

      const lookupData   = await lookupRes.json();
      const discoverData = await discoverRes.json();
      const profileData  = profileRes ? await profileRes.json() : null;

      if (!lookupRes.ok) { setError(lookupData.error || 'Lookup failed.'); setPhase('login'); return; }

      // Use full profile if available (has email/birthday/gender), otherwise fallback
      if (profileData?.ok && profileData.customer) {
        setCustomer(profileData.customer);
      } else {
        setCustomer(lookupData.customer ?? { name: cName, phone: phoneDigits, email: null, birthday: null, gender: null });
      }

      setCards(lookupData.cards ?? []);
      setStores(discoverData.stores ?? []);
      setPhase('dashboard');
    } catch { setError('Connection error.'); setPhase('login'); }
    finally { setFetching(false); }
  }, []);

  useEffect(() => {
    const session = getCustomerSession();
    if (session) { setPhone(session.phone); loadCards(session.phone, session.name); }
    else setPhase('login');
  }, [loadCards]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault(); setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit number.'); return; }
    setFetching(true);
    try {
      const res  = await fetch('/api/customer/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: digits, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'PASSWORD_NOT_SET') {
          setError('This account was created by scanning a QR code. Please set a password first — use "Forgot password?" with your email.');
        } else {
          setError(data.error || 'Login failed.');
        }
        return;
      }
      saveCustomerSession(data.customer.phone, data.customer.name, data.token);
      setCustomer(data.customer);
      await loadCards(data.customer.phone, data.customer.name);
    } catch { setError('Connection error.'); }
    finally { setFetching(false); }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault(); setError('');
    const digits = phone.replace(/\D/g, '');
    if (!name.trim())       { setError('Name is required.');                          return; }
    if (!email.trim())      { setError('Email is required.');                         return; }
    if (digits.length !== 10) { setError('Enter a valid 10-digit number.');           return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters.'); return; }
    setFetching(true);
    try {
      const res  = await fetch('/api/customer/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone_number: digits, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed.'); return; }
      saveCustomerSession(data.customer.phone, data.customer.name, data.token);
      setCustomer(data.customer);
      await loadCards(data.customer.phone, data.customer.name);
    } catch { setError('Connection error.'); }
    finally { setFetching(false); }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault(); setError('');
    if (!forgotEmail.trim()) { setError('Enter your email address.'); return; }
    setFetching(true);
    try {
      await fetch('/api/customer/auth/forgot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      setForgotSent(true);
    } catch { setError('Connection error.'); }
    finally { setFetching(false); }
  }

  async function saveField(field: string, value: string) {
    const res = await fetch('/api/customer/profile', {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed.');
    setCustomer(prev => prev ? { ...prev, [field]: value || null } : prev);
    if (field === 'name') saveCustomerSession(customer?.phone ?? '', value, getCustomerToken() ?? undefined);
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault(); setPwError(''); setPwDone(false);
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      const res  = await fetch('/api/customer/profile/password', {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({ current_password: curPw, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || 'Failed.'); return; }
      setPwDone(true); setCurPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setPwSection(false); setPwDone(false); }, 2000);
    } catch { setPwError('Connection error.'); }
    finally { setPwSaving(false); }
  }

  function handleLogout() {
    clearCustomerSession(); setPhone(''); setCustomer(null); setCards([]); setStores([]); setPhase('login');
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-bg-muted"><Spinner /></div>;
  }

  // ── Login / Register / Forgot ──────────────────────────────────────────────
  if (phase === 'login') {
    return (
      <main className="min-h-screen bg-bg-muted flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-5">
          {/* Back to home */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-xs text-text-medium hover:text-primary transition-colors">
              <span>←</span> Back to home
            </Link>
          </div>
          {/* Branded top section on login */}
          <div className="text-center space-y-3">
            <div className="mx-auto">
              <LogoIcon size={72} />
            </div>
            <div>
              <Logo size={28} className="justify-center" />
              <p className="sr-only">LetLoyal</p>
              <p className="text-text-medium text-sm">
                {authMode === 'login' ? 'Sign in to your rewards' : authMode === 'register' ? 'Create your rewards account' : 'Reset your password'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border-light p-5 shadow-sm">
            {/* ── Forgot password ── */}
            {authMode === 'forgot' && (
              forgotSent ? (
                <div className="text-center space-y-3 py-4">
                  <div className="text-4xl">📧</div>
                  <p className="font-semibold text-text-dark">Check your email</p>
                  <p className="text-sm text-text-medium">If an account exists with that email, we sent a reset link. Check your inbox (and spam folder).</p>
                  <button onClick={() => { setAuthMode('login'); setForgotSent(false); setForgotEmail(''); }}
                    className="text-sm text-primary font-semibold hover:underline">Back to Sign In</button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div>
                    <label className="form-label">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        placeholder="you@example.com" className="form-input pl-9" autoFocus />
                    </div>
                  </div>
                  {error && <p className="text-sm text-status-error">{error}</p>}
                  <button type="submit" disabled={fetching}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
                    {fetching ? <span className="flex items-center justify-center gap-2"><Spinner sm />Sending…</span> : 'Send Reset Link'}
                  </button>
                  <button type="button" onClick={() => { setAuthMode('login'); setError(''); }}
                    className="w-full text-sm text-text-medium hover:text-text-dark text-center">← Back to Sign In</button>
                </form>
              )
            )}

            {/* ── Login ── */}
            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="form-label">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-3 rounded-xl border border-border-light bg-bg-muted text-text-medium font-medium text-sm flex-shrink-0">🇮🇳 +91</div>
                    <div className="relative flex-1">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210" className="form-input pl-9" inputMode="numeric" autoFocus />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" className="form-input pl-9 pr-10" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => { setAuthMode('forgot'); setError(''); }}
                    className="text-sm text-primary font-medium hover:underline">Forgot password?</button>
                </div>
                {error && <p className="text-sm text-status-error">{error}</p>}
                <button type="submit" disabled={fetching || phone.replace(/\D/g, '').length !== 10}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
                  {fetching ? <span className="flex items-center justify-center gap-2"><Spinner sm />Signing in…</span> : 'Sign In'}
                </button>
                <p className="text-center text-sm text-text-medium">
                  New here?{' '}
                  <button type="button" onClick={() => { setAuthMode('register'); setError(''); }}
                    className="text-primary font-semibold hover:underline">Create account →</button>
                </p>
              </form>
            )}

            {/* ── Register ── */}
            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="form-label">Full Name <span className="text-status-error">*</span></label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your name" className="form-input pl-9" autoFocus />
                  </div>
                </div>
                <div>
                  <label className="form-label">Email Address <span className="text-status-error">*</span></label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" className="form-input pl-9" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Mobile Number <span className="text-status-error">*</span></label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-3 rounded-xl border border-border-light bg-bg-muted text-text-medium font-medium text-sm flex-shrink-0">🇮🇳 +91</div>
                    <div className="relative flex-1">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="98765 43210" className="form-input pl-9" inputMode="numeric" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="form-label">Password <span className="text-status-error">*</span></label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min 8 characters" className="form-input pl-9 pr-10" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light">
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-status-error">{error}</p>}
                {/* Consent checkbox — required for DPDP 2023 compliance */}
                <label className="flex items-start gap-2 text-xs text-text-medium cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 h-4 w-4 rounded border-brand-border text-primary focus:ring-primary shrink-0"
                  />
                  <span>
                    I agree to LetLoyal collecting my name, phone number, and optional date of birth and gender
                    to operate my loyalty account, as described in the{' '}
                    <a href="/privacy-policy" target="_blank" className="text-primary underline">Privacy Policy</a>.
                  </span>
                </label>
                <button type="submit" disabled={fetching}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-1">
                  {fetching ? <span className="flex items-center justify-center gap-2"><Spinner sm />Creating…</span> : 'Create Account'}
                </button>
                <p className="text-center text-sm text-text-medium">
                  Have an account?{' '}
                  <button type="button" onClick={() => { setAuthMode('login'); setError(''); }}
                    className="text-primary font-semibold hover:underline">Sign in →</button>
                </p>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-text-light">Powered by LetLoyal</p>
          <p className="text-center text-xs text-text-light mt-2">
            Are you a merchant?{' '}
            <a href="/merchant/login" className="text-primary font-semibold hover:underline">
              Merchant login →
            </a>
          </p>
        </div>
      </main>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const displayName = customer?.name?.split(' ')[0] ?? null;
  const unlocked    = cards.filter(c => c.reward_status === 'unlocked');

  return (
    <main className="min-h-screen bg-bg-muted flex flex-col">
      {/* Header */}
      <header className="bg-primary sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo variant="dark" size={22} />
          </div>
          {tab === 'cards' && cards.length > 0 && (
            <button onClick={() => loadCards(phone, customer?.name ?? null)} disabled={fetching}
              className="flex items-center gap-1 text-xs text-white/80 font-medium">
              <RefreshCw size={13} className={fetching ? 'animate-spin' : ''} /> Refresh
            </button>
          )}
        </div>
        {/* Sub-header with tab context */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          {tab === 'cards' && (
            <div>
              <p className="text-white font-bold text-lg">{displayName ? `Hi, ${displayName}! 👋` : 'My Rewards 👋'}</p>
              <p className="text-white/70 text-xs mt-0.5">{cards.length === 0 ? 'No loyalty cards yet' : `${cards.length} loyalty card${cards.length > 1 ? 's' : ''}`}</p>
            </div>
          )}
          {tab === 'scan' && <p className="text-white font-bold text-lg">Scan a QR Code</p>}
          {tab === 'account' && <p className="text-white font-bold text-lg">My Account</p>}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

          {/* ── Cards tab ── */}
          {tab === 'cards' && (
            <>
              {cards.length === 0 ? (
                <div className="bg-white rounded-2xl border border-border-light p-10 text-center space-y-3">
                  <CreditCard size={40} className="text-text-light mx-auto opacity-30" />
                  <p className="font-semibold text-text-medium">No loyalty cards yet</p>
                  <p className="text-sm text-text-light">Scan a QR code at any LetLoyal store to start earning rewards.</p>
                </div>
              ) : (
                <>
                  {unlocked.length > 0 && (
                    <section className="space-y-3">
                      <p className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1"><Gift size={12} /> Rewards Ready to Claim ({unlocked.length})</p>
                      {unlocked.map((card, i) => <LoyaltyCardItem key={i} card={card} phone={phone} />)}
                    </section>
                  )}
                  {cards.filter(c => c.reward_status !== 'unlocked').length > 0 && (
                    <section className="space-y-3">
                      {unlocked.length > 0 && <p className="text-xs font-bold text-text-medium uppercase tracking-wide">In Progress ({cards.filter(c => c.reward_status !== 'unlocked').length})</p>}
                      {cards.filter(c => c.reward_status !== 'unlocked').map((card, i) => <LoyaltyCardItem key={i} card={card} phone={phone} />)}
                    </section>
                  )}
                </>
              )}
              {stores.length > 0 && (
                <section className="space-y-3 pt-2">
                  <h2 className="text-xs font-semibold text-text-medium uppercase tracking-wide flex items-center gap-1.5"><MapPin size={13} /> Discover Stores</h2>
                  <p className="text-xs text-text-light -mt-1">Earn rewards at any LetLoyal store</p>
                  {stores.map((store, i) => <DiscoverCard key={i} store={store} />)}
                </section>
              )}
            </>
          )}

          {/* ── Scan tab ── */}
          {tab === 'scan' && (
            <div className="bg-white rounded-2xl border border-border-light p-8 text-center space-y-4">
              <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center mx-auto">
                <ScanLine size={40} className="text-primary" />
              </div>
              <div>
                <p className="font-bold text-text-dark text-lg">Scan a Store QR Code</p>
                <p className="text-sm text-text-light mt-1">Ask the merchant to show their QR code, then scan it with your camera to earn rewards.</p>
              </div>
              <div className="bg-bg-muted rounded-xl p-4 text-sm text-text-medium text-left space-y-1.5">
                <p className="font-semibold text-text-dark text-xs uppercase tracking-wide mb-2">How it works</p>
                <p>1. Ask the merchant to open their QR</p>
                <p>2. Scan with your phone camera</p>
                <p>3. Your stamp is added automatically!</p>
              </div>
            </div>
          )}

          {/* ── Account tab ── */}
          {tab === 'account' && customer && (
            <div className="space-y-4">
              {/* Profile card */}
              <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
                {/* Avatar + name header */}
                <div className="flex items-center gap-3 p-4 border-b border-border-light">
                  <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-primary">{(customer.name ?? 'C')[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-bold text-text-dark">{customer.name ?? 'Customer'}</p>
                    <p className="text-sm text-text-light">+91 {customer.phone}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 divide-x divide-border-light border-b border-border-light">
                  <div className="p-3 text-center">
                    <p className="text-xl font-bold text-text-dark">{cards.length}</p>
                    <p className="text-xs text-text-light">Loyalty Cards</p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-xl font-bold text-primary">{unlocked.length}</p>
                    <p className="text-xs text-text-light">Rewards Ready</p>
                  </div>
                </div>

                {/* Editable fields */}
                <ProfileField label="Full Name" value={customer.name} icon={<User size={15} />}
                  onSave={v => saveField('name', v)} />
                <ProfileField label="Email Address" value={customer.email} icon={<Mail size={15} />}
                  type="email" onSave={v => saveField('email', v)} />
                <ProfileField label="Birthday (optional)" value={customer.birthday ? new Date(customer.birthday).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : null} icon={<Calendar size={15} />}
                  type="date" onSave={v => saveField('birthday', v)} />
                <ProfileField label="Gender (optional)" value={customer.gender} icon={<Users size={15} />}
                  options={[
                    { value: 'male',              label: 'Male' },
                    { value: 'female',            label: 'Female' },
                    { value: 'other',             label: 'Other' },
                    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
                  ]}
                  onSave={v => saveField('gender', v)} />
              </div>

              {/* Change password */}
              <div className="bg-white rounded-2xl border border-border-light overflow-hidden">
                <button onClick={() => setPwSection(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Lock size={15} className="text-text-light" />
                    <span className="text-sm font-semibold text-text-dark">Change Password</span>
                  </div>
                  {pwSection ? <ChevronUp size={16} className="text-text-light" /> : <ChevronDown size={16} className="text-text-light" />}
                </button>
                {pwSection && (
                  <div className="px-4 pb-4 pt-0 border-t border-border-light">
                    {pwDone ? (
                      <p className="text-center text-sm font-semibold text-primary py-4">✓ Password updated!</p>
                    ) : (
                      <form onSubmit={handleChangePassword} className="space-y-3 pt-3">
                        <div>
                          <label className="form-label">Current Password</label>
                          <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)}
                            placeholder="••••••••" className="form-input" />
                        </div>
                        <div>
                          <label className="form-label">New Password</label>
                          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                            placeholder="Min 8 characters" className="form-input" />
                        </div>
                        <div>
                          <label className="form-label">Confirm New Password</label>
                          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                            placeholder="Repeat new password" className="form-input" />
                        </div>
                        {pwError && <p className="text-sm text-status-error">{pwError}</p>}
                        <button type="submit" disabled={pwSaving}
                          className="w-full bg-primary text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-colors">
                          {pwSaving ? 'Updating…' : 'Update Password'}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

              <button onClick={() => setTab('cards')}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border border-border-light text-text-medium font-medium text-sm hover:bg-bg-muted transition-colors">
                ← Back to My Cards
              </button>

              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-red-200 text-status-error font-semibold hover:bg-red-50 transition-colors">
                <LogOut size={18} /> Sign Out
              </button>

              {/* Data & Privacy section */}
              <div className="mt-4 pt-4 border-t border-brand-border">
                <p className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-3">Data & Privacy</p>
                <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
                  <a href="/privacy-policy" target="_blank"
                    className="flex items-center justify-between px-4 py-3 border-b border-brand-border hover:bg-brand-bg transition-colors">
                    <span className="text-sm text-text-dark">Privacy Policy</span>
                    <span className="text-xs text-text-light">→</span>
                  </a>
                  <button
                    onClick={async () => {
                      if (!confirm('Are you sure you want to permanently delete your account and all your loyalty data? This cannot be undone.')) return;
                      const token = getCustomerToken();
                      const res = await fetch('/api/customer/account', {
                        method: 'DELETE',
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                      });
                      if (res.ok) {
                        clearCustomerSession();
                        setPhase('login');
                        setCustomer(null);
                        setCards([]);
                        alert('Your account has been deleted.');
                      } else {
                        alert('Failed to delete account. Please contact hello@letloyal.com');
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 transition-colors text-left"
                  >
                    <span className="text-sm text-red-600 font-medium">Delete My Account & Data</span>
                    <span className="text-xs text-red-400">→</span>
                  </button>
                </div>
                <p className="text-xs text-text-light mt-2 px-1">
                  To request data correction or export, email{' '}
                  <a href="mailto:hello@letloyal.com" className="text-primary">hello@letloyal.com</a>
                </p>
              </div>

              <p className="text-center text-xs text-text-light pb-2">Powered by LetLoyal</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-border-light z-20">
        <div className="max-w-lg mx-auto flex">
          {([
            { id: 'cards' as Tab,   label: 'Cards',   icon: <CreditCard size={22} /> },
            { id: 'scan'  as Tab,   label: 'Scan',    icon: <ScanLine   size={22} /> },
            { id: 'account' as Tab, label: 'Account', icon: <User       size={22} /> },
          ] as { id: Tab; label: string; icon: ReactNode }[]).map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${tab === id ? 'text-primary' : 'text-text-light hover:text-text-medium'}`}>
              {icon}{label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}
