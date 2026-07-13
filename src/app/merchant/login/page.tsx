'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ds';
import AuthShell, { AuthField } from '@/components/merchant/AuthShell';
import { Mail, Lock } from 'lucide-react';

function getSafeRedirect(redirect: string | null, defaultPath: string): string {
  if (!redirect) return defaultPath;
  try {
    if (redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect;
    }
    return defaultPath;
  } catch {
    return defaultPath;
  }
}

function MerchantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo   = searchParams.get('redirect');
  const justVerified   = searchParams.get('verified') === '1';
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (justVerified) setSuccess('Email verified! You can now sign in.');
  }, [justVerified]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/merchant/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsVerification && data.email) {
          router.push(`/merchant/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        setError(data.error || 'Login failed.');
        return;
      }

      router.push(getSafeRedirect(redirectTo, `/m/${data.slug}`));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbusiness.com"
          icon={<Mail size={16} />}
          required
          autoComplete="email"
        />

        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          icon={<Lock size={16} />}
          required
          autoComplete="current-password"
        />

        {success && (
          <div className="rounded-[11px] bg-good-subtle px-4 py-3 text-body-sm text-good font-semibold">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-body-sm text-bad font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} className="mt-2">
          Sign In
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-between text-body-sm">
        <Link href="/merchant/forgot" className="text-teal font-semibold hover:underline">
          Forgot your password?
        </Link>
        <Link href="/merchant/register" className="text-teal font-semibold hover:underline">
          Create account →
        </Link>
      </div>
    </>
  );
}

export default function MerchantLoginPage() {
  return (
    <AuthShell
      title="Merchant Login"
      subtitle="Sign in to your LetLoyal dashboard"
      footer={
        <p>
          Are you a customer?{' '}
          <Link href="/my-rewards" className="text-teal font-semibold hover:underline">
            View your rewards →
          </Link>
        </p>
      }
    >
      <Suspense fallback={<p className="text-body-sm text-ink-sub">Loading…</p>}>
        <MerchantLoginForm />
      </Suspense>
    </AuthShell>
  );
}
