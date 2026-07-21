// src/app/customer/reset-password/page.tsx
'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff } from 'lucide-react';

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [done,       setDone]       = useState(false);

  useEffect(() => {
    if (!token) setError('Invalid reset link. Please request a new one.');
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res  = await fetch('/api/customer/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Reset failed.'); return; }
      // Auto-login: cookie is set by server, just redirect
      setDone(true);
      setTimeout(() => router.push('/my-rewards'), 2000);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-teal text-teal-fg flex items-center justify-center mx-auto">
          <span className="text-3xl">✓</span>
        </div>
        <p className="font-display font-bold text-ink text-xl">Password updated!</p>
        <p className="text-ink-sub text-sm">Taking you to your rewards…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-body-sm font-semibold text-ink mb-1.5">New Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="w-full rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-1 text-ink placeholder:text-ink-faint py-3 pl-9 pr-10 focus:outline-none focus:border-teal focus:shadow-ring"
            required
          />
          <button type="button" onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-body-sm font-semibold text-ink mb-1.5">Confirm Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type={showPw ? 'text' : 'password'}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Repeat password"
            className="w-full rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-1 text-ink placeholder:text-ink-faint py-3 pl-9 focus:outline-none focus:border-teal focus:shadow-ring"
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-bad">{error}</p>}
      <button type="submit" disabled={loading || !token}
        className="w-full bg-teal hover:bg-teal-hover disabled:opacity-50 text-teal-fg font-bold py-3 rounded-full transition-colors min-h-[44px]">
        {loading ? 'Updating…' : 'Set New Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-surface-page flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Back to home */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-ink-sub hover:text-teal transition-colors">
            <span>←</span> Back to home
          </Link>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-ink">Set new password</h1>
          <p className="text-ink-sub text-sm mt-1">Choose a strong password for your account</p>
        </div>
        <div className="bg-surface-1 rounded-[16px] border border-stroke shadow-ds p-5">
          <Suspense fallback={<div className="py-8 text-center text-ink-faint text-sm">Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>
        <p className="text-center text-xs text-ink-faint">Powered by LetLoyal</p>
      </div>
    </main>
  );
}
