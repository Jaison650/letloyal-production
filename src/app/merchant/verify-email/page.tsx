'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ds';
import AuthShell from '@/components/merchant/AuthShell';

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
      if (!res.ok) { setError(data.error || 'Verification failed.'); return; }
      if (data.alreadyVerified) {
        router.push('/merchant/login?verified=1');
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
      if (res.ok) {
        const data = await res.json();
        if (data.alreadyVerified) {
          router.push('/merchant/login?verified=1');
          return;
        }
        setResent(true);
      } else {
        setError('Failed to resend. Try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    }
  }

  return (
    <>
      <p className="text-teal font-semibold text-body-sm mb-6 -mt-4">{email}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-body-sm font-semibold text-ink mb-1.5">Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            placeholder="000000"
            className="w-full border-[1.5px] border-stroke-strong bg-surface-1 text-ink rounded-[11px] px-4 py-3 text-lg tracking-widest text-center font-bold placeholder:text-ink-faint focus:outline-none focus:border-teal focus:shadow-ring"
          />
        </div>

        {error && (
          <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-body-sm text-bad font-semibold">
            {error}
          </div>
        )}

        {resent && (
          <div className="rounded-[11px] bg-good-subtle px-4 py-3 text-body-sm text-good font-semibold">
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

      <p className="text-center text-body-sm text-ink-sub mt-5">
        Didn&apos;t receive it?{' '}
        <button onClick={handleResend} className="text-teal hover:underline font-semibold">
          Resend code
        </button>
      </p>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify your email"
      subtitle="We sent a 6-digit code to"
      backHref="/merchant/register"
      backLabel="Back to register"
    >
      <Suspense fallback={<p className="text-body-sm text-ink-sub">Loading…</p>}>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
