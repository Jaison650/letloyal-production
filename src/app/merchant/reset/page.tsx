'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { Lock } from 'lucide-react';

function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get('token') ?? '';

  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== password2) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/merchant/auth/reset', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, new_password: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Reset failed.');
        return;
      }

      setDone(true);
      setTimeout(() => router.push('/merchant/login'), 2500);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center py-4">
        <p className="text-status-error font-medium mb-4">Invalid reset link.</p>
        <Link href="/merchant/forgot" className="text-sm text-primary hover:underline font-medium">
          Request a new link
        </Link>
      </div>
    );
  }

  return done ? (
    <div className="text-center py-4">
      <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
        <Lock size={28} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold text-text-dark mb-2">Password updated!</h2>
      <p className="text-text-medium text-sm">Redirecting to login…</p>
    </div>
  ) : (
    <>
      <h1 className="text-2xl font-bold text-text-dark mb-1">Set new password</h1>
      <p className="text-text-light text-sm mb-6">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          icon={<Lock size={16} />}
          required
        />
        <Input
          label="Confirm password"
          type="password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="Repeat password"
          icon={<Lock size={16} />}
          required
        />

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error font-medium">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading}>
          Update Password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size={28} />
        </div>
        <div className="card">
          <Suspense fallback={<div className="text-center py-8 text-text-light">Loading…</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
