'use client';

import { useState, useEffect, useCallback, useRef, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { hasAnalyticsConsent, setAnalyticsConsent } from '@/lib/analyticsConsent';
import type { LoyaltyCard, DiscoverStore, CustomerData, Tab, AuthMode } from '@/components/customer/my-rewards/types';
import { Spinner } from '@/components/customer/my-rewards/ui';
import AuthPanel from '@/components/customer/my-rewards/AuthPanel';
import TabBar from '@/components/customer/my-rewards/TabBar';
import CardsTab from '@/components/customer/my-rewards/CardsTab';
import ScanTab from '@/components/customer/my-rewards/ScanTab';
import NearbyTab from '@/components/customer/my-rewards/NearbyTab';
import AccountTab from '@/components/customer/my-rewards/AccountTab';

// ── Main Page ─────────────────────────────────────────────────────────────────
function MyRewardsContent() {
  const [phase,     setPhase]     = useState<'loading' | 'login' | 'dashboard'>('loading');
  const [authMode,  setAuthMode]  = useState<AuthMode>('login');
  const [phone,     setPhone]     = useState('');
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [analyticsOptIn, setAnalyticsOptIn] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
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

  // ── QR scan ────────────────────────────────────────────────────────────
  const [scanResult,  setScanResult]  = useState<{ points_added: number; progress: number; threshold: number; reward_unlocked: boolean; reward_description: string; business_name: string } | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError,   setScanError]   = useState('');

  // ── Nearby stores ──────────────────────────────────────────────────────
  const [nearbyStores,  setNearbyStores]  = useState<Array<{ id: string; business_name: string; slug: string; logo_url: string | null; distance_km: number }> | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError,   setNearbyError]   = useState('');

  // ── Deep-link from push notification: ?merchant=slug ───────────────────
  const searchParams    = useSearchParams();
  const router          = useRouter();
  const highlightSlug   = searchParams.get('merchant');
  const cardRefs        = useRef<Record<string, HTMLDivElement | null>>({});

  const loadCards = useCallback(async (phoneDigits: string, cName: string | null = null) => {
    setFetching(true);
    try {
      const [lookupRes, discoverRes, profileRes] = await Promise.all([
        fetch('/api/customer/lookup', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone_number: phoneDigits }),
        }),
        fetch('/api/customer/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ phone_number: phoneDigits }),
        }),
        fetch('/api/customer/profile', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }),
      ]);

      const lookupData   = await lookupRes.json();
      const discoverData = await discoverRes.json();
      const profileData  = profileRes.ok ? await profileRes.json() : null;

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
    fetch('/api/customer/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.customer) {
          const phoneDigits = data.customer.phone ?? '';
          setPhone(phoneDigits);
          setCustomer(data.customer);
          loadCards(phoneDigits, data.customer.name);
        } else {
          setPhase('login');
        }
      })
      .catch(() => setPhase('login'));
  }, [loadCards]);

  // Scroll to highlighted card once dashboard + cards are ready
  useEffect(() => {
    if (phase !== 'dashboard' || !highlightSlug) return;
    const el = cardRefs.current[highlightSlug];
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [phase, cards, highlightSlug]);

  // Reflect persisted analytics consent in the settings toggle
  useEffect(() => { setAnalyticsEnabled(hasAnalyticsConsent()); }, [customer]);

  // Handle OAuth error redirects (e.g. Google login cancelled or failed)
  useEffect(() => {
    const authError = searchParams.get('auth_error');
    if (authError === 'google_cancelled') {
      setError('Google sign-in was cancelled.');
      router.replace('/my-rewards', { scroll: false });
    } else if (authError === 'google_failed') {
      setError('Google sign-in failed. Please try again.');
      router.replace('/my-rewards', { scroll: false });
    }
  }, [searchParams, router]);

  function toggleAnalytics() {
    const next = !analyticsEnabled;
    setAnalyticsConsent(next);
    setAnalyticsEnabled(next);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault(); setError('');
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setError('Enter a valid 10-digit number.'); return; }
    setFetching(true);
    try {
      const res  = await fetch('/api/customer/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
        credentials: 'include',
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone_number: digits, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed.'); return; }
      setAnalyticsConsent(analyticsOptIn);
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
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ [field]: value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed.');
    setCustomer(prev => prev ? { ...prev, [field]: value || null } : prev);
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault(); setPwError(''); setPwDone(false);
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      const res  = await fetch('/api/customer/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ current_password: curPw, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || 'Failed.'); return; }
      setPwDone(true); setCurPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => { setPwSection(false); setPwDone(false); }, 2000);
    } catch { setPwError('Connection error.'); }
    finally { setPwSaving(false); }
  }

  async function handleLogout() {
    try {
      await fetch('/api/customer/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Even if network fails, clear local state
    }
    setPhone(''); setName(''); setEmail('');
    setCustomer(null);
    setCards([]);
    setStores([]);
    setPhase('login');
  }

  function extractTokenFromQR(data: string): string | null {
    try {
      const url = new URL(data);
      const t = url.searchParams.get('t');
      if (t) return t;
      return null;
    } catch {
      // Not a URL — treat as raw token if it looks like a UUID
      return /^[0-9a-f-]{36}$/i.test(data) ? data : null;
    }
  }

  async function handleQRScan(data: string) {
    setScanResult(null);
    setScanError('');

    const token = extractTokenFromQR(data);
    if (!token) {
      setScanError('Invalid QR code. Please scan a LetLoyal store QR code.');
      return;
    }

    if (!phone) {
      setScanError('Could not identify your account. Please sign out and back in.');
      return;
    }

    setScanLoading(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, phone_number: phone }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setScanResult(d);
        // Refresh cards in background to reflect new progress
        loadCards(phone, customer?.name ?? null);
      } else {
        setScanError(d.error || 'Scan failed. Please try again.');
      }
    } catch {
      setScanError('Network error. Please try again.');
    } finally {
      setScanLoading(false);
    }
  }

  function handleFindNearby() {
    if (!navigator.geolocation) {
      setNearbyError('Geolocation is not supported by your browser.');
      return;
    }
    setNearbyLoading(true);
    setNearbyError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/customer/nearby?lat=${latitude}&lng=${longitude}`);
          const d   = await res.json();
          if (d.ok) setNearbyStores(d.stores);
          else      setNearbyError(d.error || 'Failed to load stores.');
        } catch {
          setNearbyError('Network error. Please try again.');
        } finally {
          setNearbyLoading(false);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setNearbyError('Location access denied. Please allow location access in your browser and try again.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setNearbyError('Your location could not be determined. Please try again.');
        } else {
          setNearbyError('Location request timed out. Please try again.');
        }
        setNearbyLoading(false);
      },
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-bg-muted"><Spinner /></div>;
  }

  // ── Login / Register / Forgot ──────────────────────────────────────────────
  if (phase === 'login') {
    return (
      <AuthPanel
        authMode={authMode} setAuthMode={setAuthMode}
        phone={phone} setPhone={setPhone}
        name={name} setName={setName}
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        showPw={showPw} setShowPw={setShowPw}
        analyticsOptIn={analyticsOptIn} setAnalyticsOptIn={setAnalyticsOptIn}
        forgotEmail={forgotEmail} setForgotEmail={setForgotEmail}
        forgotSent={forgotSent} setForgotSent={setForgotSent}
        error={error} setError={setError}
        fetching={fetching}
        handleLogin={handleLogin}
        handleRegister={handleRegister}
        handleForgot={handleForgot}
      />
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
          {tab === 'nearby' && <p className="text-white font-bold text-lg">Nearby Stores</p>}
          {tab === 'account' && <p className="text-white font-bold text-lg">My Account</p>}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">

          {/* ── Cards tab ── */}
          {tab === 'cards' && (
            <CardsTab cards={cards} unlocked={unlocked} stores={stores} highlightSlug={highlightSlug} cardRefs={cardRefs} phone={phone} />
          )}

          {/* ── Scan tab ── */}
          {tab === 'scan' && (
            <ScanTab tab={tab} scanResult={scanResult} setScanResult={setScanResult} scanLoading={scanLoading} scanError={scanError} setScanError={setScanError} handleQRScan={handleQRScan} />
          )}

          {/* ── Nearby tab ── */}
          {tab === 'nearby' && (
            <NearbyTab nearbyStores={nearbyStores} setNearbyStores={setNearbyStores} nearbyLoading={nearbyLoading} nearbyError={nearbyError} setNearbyError={setNearbyError} handleFindNearby={handleFindNearby} />
          )}

          {/* ── Account tab ── */}
          {tab === 'account' && customer && (
            <AccountTab
              customer={customer} cards={cards} unlocked={unlocked} saveField={saveField}
              pwSection={pwSection} setPwSection={setPwSection} pwDone={pwDone}
              curPw={curPw} setCurPw={setCurPw} newPw={newPw} setNewPw={setNewPw}
              confirmPw={confirmPw} setConfirmPw={setConfirmPw}
              pwError={pwError} pwSaving={pwSaving} handleChangePassword={handleChangePassword}
              setTab={setTab} handleLogout={handleLogout}
              analyticsEnabled={analyticsEnabled} toggleAnalytics={toggleAnalytics}
            />
          )}
        </div>
      </div>

      {/* Bottom Tab Bar */}
      <TabBar tab={tab} setTab={setTab} />
    </main>
  );
}

export default function MyRewardsPage() {
  return (
    <Suspense fallback={null}>
      <MyRewardsContent />
    </Suspense>
  );
}
