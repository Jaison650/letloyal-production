'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/merchant/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Verification failed.');
        return;
      }
      router.push('/merchant/login?verified=1');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResent(false);
    setError('');
    try {
      const res = await fetch('/api/merchant/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setResent(true);
      else setError('Failed to resend. Try again.');
    } catch {
      setError('Connection error. Please try again.');
    }
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-text-dark mb-1">Verify your email</h1>
      <p className="text-text-light text-sm mb-2">We sent a 6-digit code to</p>
      <p className="text-primary font-semibold text-sm mb-6">{email}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            placeholder="000000"
            className="w-full border border-border-light rounded-xl px-4 py-3 text-lg tracking-widest text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error font-medium">
            {error}
          </div>
        )}

        {resent && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
            New code sent! Check your inbox.
          </div>
        )}

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={otp.length !== 6}
          className="mt-2"
        >
          Verify &amp; Continue
        </Button>
      </form>

      <p className="text-center text-sm text-text-medium mt-5">
        Didn&apos;t receive it?{' '}
        <button onClick={handleResend} className="text-primary hover:underline font-semibold">
          Resend code
        </button>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/merchant/register" className="inline-flex items-center gap-1 text-xs text-text-medium hover:text-primary transition-colors">
            <span>←</span> Back to register
          </Link>
        </div>

        <div className="flex justify-center mb-8">
          <Logo size={28} />
        </div>

        <Suspense fallback={<div className="card"><p className="text-sm text-text-medium">Loading…</p></div>}>
          <VerifyForm />
        </Suspense>

        <p className="mt-6 text-center text-xs text-text-light">
          Powered by LetLoyal
        </p>
      </div>
    </main>
  );
}
