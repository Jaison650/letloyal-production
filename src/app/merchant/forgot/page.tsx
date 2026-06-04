'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
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
    <main className="min-h-screen flex items-center justify-center bg-bg-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size={28} />
        </div>

        <div className="card">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-primary" />
              </div>
              <h2 className="text-xl font-bold text-text-dark mb-2">Check your email</h2>
              <p className="text-text-medium text-sm mb-6">
                If <strong>{email}</strong> is registered, we&apos;ve sent a reset link. Check your inbox.
              </p>
              <Link href="/merchant/login" className="text-sm text-primary hover:underline font-medium">
                ← Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text-dark mb-1">Forgot password?</h1>
              <p className="text-text-light text-sm mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourbusiness.com"
                  icon={<Mail size={16} />}
                  required
                />

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error font-medium">
                    {error}
                  </div>
                )}

                <Button type="submit" fullWidth loading={loading}>
                  Send Reset Link
                </Button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/merchant/login" className="text-sm text-primary hover:underline font-medium">
                  ← Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
