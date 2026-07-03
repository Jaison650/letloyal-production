'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
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
  const justRegistered = searchParams.get('registered') === '1';
  const justVerified   = searchParams.get('verified') === '1';
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (justVerified)   setSuccess('Email verified! You can now sign in.');
    else if (justRegistered) setSuccess('Account created! Sign in to continue.');
  }, [justRegistered, justVerified]);

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
    <div className="card">
      <h1 className="text-2xl font-bold text-text-dark mb-1">Merchant Login</h1>
      <p className="text-text-light text-sm mb-6">Sign in to your LetLoyal dashboard</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbusiness.com"
          icon={<Mail size={16} />}
          required
          autoComplete="email"
        />

        <Input
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
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error font-medium">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} className="mt-2">
          Sign In
        </Button>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/merchant/forgot" className="text-primary hover:underline font-medium">
          Forgot your password?
        </Link>
        <Link href="/merchant/register" className="text-primary hover:underline font-medium">
          Create account →
        </Link>
      </div>
    </div>
  );
}

export default function MerchantLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-muted px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Back to home */}
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-text-medium hover:text-primary transition-colors">
            <span>←</span> Back to home
          </Link>
        </div>
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size={28} />
        </div>

        <Suspense fallback={<div className="card"><p className="text-sm text-text-medium">Loading…</p></div>}>
          <MerchantLoginForm />
        </Suspense>

        {/* Customer link */}
        <div className="mt-5 text-center">
          <p className="text-sm text-text-medium">
            Are you a customer?{' '}
            <Link href="/my-rewards" className="text-primary font-semibold hover:underline">
              View your rewards →
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-text-light">
          Powered by LetLoyal
        </p>
      </div>
    </main>
  );
}
