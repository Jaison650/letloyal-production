'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { Building2, Mail, Lock, Phone } from 'lucide-react';

export default function MerchantRegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [email,        setEmail]        = useState('');
  const [phone,        setPhone]        = useState('');
  const [password,     setPassword]     = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [error,        setError]        = useState('');
  const [loading,      setLoading]      = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/merchant/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ business_name: businessName, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        return;
      }

      router.push(`/merchant/verify-email?email=${encodeURIComponent(email)}`);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <Link href="/merchant/login" className="inline-flex items-center gap-1 text-xs text-text-medium hover:text-primary transition-colors">
            <span>←</span> Back to login
          </Link>
        </div>

        <div className="flex justify-center mb-8">
          <Logo size={28} />
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold text-text-dark mb-1">Create your account</h1>
          <p className="text-text-light text-sm mb-6">Set up your LetLoyal merchant profile</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Business Name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Chai Corner"
              icon={<Building2 size={16} />}
              required
              autoComplete="organization"
            />

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
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              icon={<Phone size={16} />}
              required
              autoComplete="tel"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              icon={<Lock size={16} />}
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your password"
              icon={<Lock size={16} />}
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error font-medium">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} className="mt-2">
              Create Account
            </Button>
          </form>
        </div>

        <div className="mt-5 text-center">
          <p className="text-sm text-text-medium">
            Already have an account?{' '}
            <Link href="/merchant/login" className="text-primary font-semibold hover:underline">
              Sign in →
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
