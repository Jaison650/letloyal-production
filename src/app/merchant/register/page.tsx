'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ds';
import AuthShell, { AuthField } from '@/components/merchant/AuthShell';
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
    <AuthShell
      title="Create your account"
      subtitle="Set up your LetLoyal merchant profile"
      footer={
        <p>
          Already have an account?{' '}
          <Link href="/merchant/login" className="text-teal font-semibold hover:underline">
            Sign in →
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Business Name"
          type="text"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Chai Corner"
          icon={<Building2 size={16} />}
          required
          autoComplete="organization"
        />

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
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          icon={<Phone size={16} />}
          required
          autoComplete="tel"
        />

        <AuthField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          icon={<Lock size={16} />}
          required
          autoComplete="new-password"
        />

        <AuthField
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
          <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-body-sm text-bad font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" intent="reward" fullWidth loading={loading} className="mt-2">
          Create Account
        </Button>
      </form>
    </AuthShell>
  );
}
