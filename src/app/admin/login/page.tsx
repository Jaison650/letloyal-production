'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    <div className="card">
      <h1 className="text-xl font-bold text-text-dark mb-1">Admin Login</h1>
      <p className="text-text-light text-sm mb-6">LetLoyal platform administration</p>

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
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error">
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
    <main className="min-h-screen flex items-center justify-center bg-bg-muted px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size={28} />
        </div>
        <Suspense fallback={<div className="card"><p className="text-sm text-text-medium">Loading…</p></div>}>
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
