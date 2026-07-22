'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import { Mail, Lock } from 'lucide-react';

function getSafeRedirect(redirect: string | null, defaultPath: string): string {
  if (!redirect) return defaultPath;
  // Only allow redirects within /admin to prevent open-redirect abuse
  if (redirect.startsWith('/admin') && !redirect.startsWith('//')) {
    return redirect;
  }
  return defaultPath;
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [email,   setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed.'); return; }
      router.push(getSafeRedirect(redirectTo, '/admin'));
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-6">
      <h1 className="text-xl font-display font-bold text-ink mb-1">Admin Login</h1>
      <p className="text-ink-faint text-sm mb-6">LetLoyal platform administration</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail size={16} />}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock size={16} />}
          required
          autoComplete="current-password"
        />

        {error && (
          <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-sm text-bad font-semibold">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth loading={loading}>Sign In</Button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-page px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size={28} />
        </div>
        <Suspense fallback={<div className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-6"><p className="text-sm text-ink-sub">Loading…</p></div>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
