'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ds';
import AuthShell, { AuthField } from '@/components/merchant/AuthShell';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/merchant/auth/forgot', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Forgot password?" subtitle="Enter your email and we'll send you a reset link.">
      {submitted ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-teal-subtle flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-teal" />
          </div>
          <h2 className="font-display font-bold text-h4 text-ink mb-2">Check your email</h2>
          <p className="text-ink-sub text-body-sm mb-6">
            If <strong>{email}</strong> is registered, we&apos;ve sent a reset link. Check your inbox.
          </p>
          <Link href="/merchant/login" className="text-body-sm text-teal font-semibold hover:underline">
            ← Back to login
          </Link>
        </div>
      ) : (
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
            />

            {error && (
              <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-body-sm text-bad font-semibold">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading}>
              Send Reset Link
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/merchant/login" className="text-body-sm text-teal font-semibold hover:underline">
              ← Back to login
            </Link>
          </div>
        </>
      )}
    </AuthShell>
  );
}
