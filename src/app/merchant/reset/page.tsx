'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ds';
import AuthShell, { AuthField } from '@/components/merchant/AuthShell';
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
        <p className="text-bad font-semibold mb-4">Invalid reset link.</p>
        <Link href="/merchant/forgot" className="text-body-sm text-teal font-semibold hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return done ? (
    <div className="text-center py-4">
      <div className="w-14 h-14 rounded-full bg-teal-subtle flex items-center justify-center mx-auto mb-4">
        <Lock size={28} className="text-teal" />
      </div>
      <h2 className="font-display font-bold text-h4 text-ink mb-2">Password updated!</h2>
      <p className="text-ink-sub text-body-sm">Redirecting to login…</p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AuthField
        label="New password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min. 8 characters"
        icon={<Lock size={16} />}
        required
      />
      <AuthField
        label="Confirm password"
        type="password"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        placeholder="Repeat password"
        icon={<Lock size={16} />}
        required
      />

      {error && (
        <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-body-sm text-bad font-semibold">
          {error}
        </div>
      )}

      <Button type="submit" fullWidth loading={loading}>
        Update Password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Set new password" subtitle="Choose a strong password for your account.">
      <Suspense fallback={<p className="text-center py-8 text-body-sm text-ink-sub">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
