'use client';

import Link from 'next/link';
import { Phone, Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import type { Dispatch, SetStateAction, FormEvent } from 'react';
import Logo, { LogoIcon } from '@/components/ui/Logo';
import { Button, Input } from '@/components/ds';
import { Spinner } from './ui';
import type { AuthMode } from './types';

// ── Login / Register / Forgot ──────────────────────────────────────────────
export default function AuthPanel({
  authMode, setAuthMode,
  phone, setPhone,
  name, setName,
  email, setEmail,
  password, setPassword,
  showPw, setShowPw,
  analyticsOptIn, setAnalyticsOptIn,
  forgotEmail, setForgotEmail,
  forgotSent, setForgotSent,
  error, setError,
  fetching,
  handleLogin, handleRegister, handleForgot,
}: {
  authMode: AuthMode; setAuthMode: Dispatch<SetStateAction<AuthMode>>;
  phone: string; setPhone: Dispatch<SetStateAction<string>>;
  name: string; setName: Dispatch<SetStateAction<string>>;
  email: string; setEmail: Dispatch<SetStateAction<string>>;
  password: string; setPassword: Dispatch<SetStateAction<string>>;
  showPw: boolean; setShowPw: Dispatch<SetStateAction<boolean>>;
  analyticsOptIn: boolean; setAnalyticsOptIn: Dispatch<SetStateAction<boolean>>;
  forgotEmail: string; setForgotEmail: Dispatch<SetStateAction<string>>;
  forgotSent: boolean; setForgotSent: Dispatch<SetStateAction<boolean>>;
  error: string; setError: Dispatch<SetStateAction<string>>;
  fetching: boolean;
  handleLogin: (e: FormEvent) => void;
  handleRegister: (e: FormEvent) => void;
  handleForgot: (e: FormEvent) => void;
}) {
  return (
    <main className="min-h-screen bg-surface-page flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-5">
        {/* Back to home */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-ink-sub hover:text-teal transition-colors">
            <span>←</span> Back to home
          </Link>
        </div>
        {/* Branded top section on login */}
        <div className="text-center space-y-3">
          <div className="mx-auto">
            <LogoIcon size={72} />
          </div>
          <div>
            <Logo size={28} className="justify-center" />
            <p className="sr-only">LetLoyal</p>
            <p className="text-ink-sub text-sm">
              {authMode === 'login' ? 'Sign in to your rewards' : authMode === 'register' ? 'Create your rewards account' : 'Reset your password'}
            </p>
          </div>
        </div>

        <div className="rounded-[16px] border border-stroke bg-surface-1 shadow-ds p-5">
          {/* ── Forgot password ── */}
          {authMode === 'forgot' && (
            forgotSent ? (
              <div className="text-center space-y-3 py-4">
                <div className="text-4xl">📧</div>
                <p className="font-semibold text-ink">Check your email</p>
                <p className="text-sm text-ink-sub">If an account exists with that email, we sent a reset link. Check your inbox (and spam folder).</p>
                <button onClick={() => { setAuthMode('login'); setForgotSent(false); setForgotEmail(''); }}
                  className="text-sm text-teal font-semibold hover:underline">Back to Sign In</button>
              </div>
            ) : (
              <form onSubmit={handleForgot} className="space-y-4">
                <label className="block">
                  <span className="block text-body-sm font-semibold text-ink mb-1.5">Email Address</span>
                  <span className="relative block">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                    <Input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="you@example.com" className="pl-9" autoFocus />
                  </span>
                </label>
                {error && <p className="text-sm text-bad">{error}</p>}
                <Button type="submit" fullWidth disabled={fetching}>
                  {fetching ? <span className="flex items-center justify-center gap-2"><Spinner sm />Sending…</span> : 'Send Reset Link'}
                </Button>
                <button type="button" onClick={() => { setAuthMode('login'); setError(''); }}
                  className="w-full text-sm text-ink-sub hover:text-ink text-center">← Back to Sign In</button>
              </form>
            )
          )}

          {/* ── Login ── */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block">
                <span className="block text-body-sm font-semibold text-ink mb-1.5">Mobile Number</span>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-3 rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-2 text-ink-sub font-medium text-sm flex-shrink-0">🇮🇳 +91</div>
                  <span className="relative block flex-1">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                    <Input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210" className="pl-9" inputMode="numeric" autoFocus />
                  </span>
                </div>
              </label>
              <label className="block">
                <span className="block text-body-sm font-semibold text-ink mb-1.5">Password</span>
                <span className="relative block">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                  <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" className="pl-9 pr-10" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
              <div className="text-right">
                <button type="button" onClick={() => { setAuthMode('forgot'); setError(''); }}
                  className="text-sm text-teal font-medium hover:underline">Forgot password?</button>
              </div>
              {error && <p className="text-sm text-bad">{error}</p>}
              <Button type="submit" fullWidth disabled={fetching || phone.replace(/\D/g, '').length !== 10}>
                {fetching ? <span className="flex items-center justify-center gap-2"><Spinner sm />Signing in…</span> : 'Sign In'}
              </Button>
              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stroke" />
                </div>
                <div className="relative flex justify-center text-xs text-ink-faint">
                  <span className="bg-surface-1 px-2">or</span>
                </div>
              </div>
              {/* Google OAuth button */}
              <a
                href="/api/customer/auth/google"
                className="flex items-center justify-center gap-2 w-full border border-stroke-strong rounded-full py-2.5 text-sm font-semibold text-ink hover:bg-surface-2 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.075 17.64 11.77 17.64 9.2z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </a>
              <p className="text-center text-sm text-ink-sub">
                New here?{' '}
                <button type="button" onClick={() => { setAuthMode('register'); setError(''); }}
                  className="text-teal font-semibold hover:underline">Create account →</button>
              </p>
            </form>
          )}

          {/* ── Register ── */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <label className="block">
                <span className="block text-body-sm font-semibold text-ink mb-1.5">Full Name <span className="text-bad">*</span></span>
                <span className="relative block">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                  <Input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name" className="pl-9" autoFocus />
                </span>
              </label>
              <label className="block">
                <span className="block text-body-sm font-semibold text-ink mb-1.5">Email Address <span className="text-bad">*</span></span>
                <span className="relative block">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" className="pl-9" />
                </span>
              </label>
              <label className="block">
                <span className="block text-body-sm font-semibold text-ink mb-1.5">Mobile Number <span className="text-bad">*</span></span>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-3 rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-2 text-ink-sub font-medium text-sm flex-shrink-0">🇮🇳 +91</div>
                  <span className="relative block flex-1">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                    <Input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="98765 43210" className="pl-9" inputMode="numeric" />
                  </span>
                </div>
              </label>
              <label className="block">
                <span className="block text-body-sm font-semibold text-ink mb-1.5">Password <span className="text-bad">*</span></span>
                <span className="relative block">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                  <Input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters" className="pl-9 pr-10" />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
              {error && <p className="text-sm text-bad">{error}</p>}
              {/* Consent checkbox — required for DPDP 2023 compliance */}
              <label className="flex items-start gap-2 text-xs text-ink-sub cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 rounded border-stroke-strong text-teal focus:ring-teal shrink-0"
                />
                <span>
                  I agree to LetLoyal collecting my name, phone number, email address, and optional date of
                  birth and gender to operate my loyalty account, as described in the{' '}
                  <a href="/privacy-policy" target="_blank" className="text-teal underline">Privacy Policy</a>.
                </span>
              </label>
              {/* DPDP 2023 — separate, optional analytics consent (default off) */}
              <label className="flex items-start gap-2 text-xs text-ink-faint cursor-pointer">
                <input
                  type="checkbox"
                  checked={analyticsOptIn}
                  onChange={e => setAnalyticsOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-stroke-strong text-teal focus:ring-teal shrink-0"
                />
                <span>Optional: allow anonymous usage analytics to help improve the app. You can turn this off anytime below.</span>
              </label>
              <Button type="submit" fullWidth disabled={fetching} className="mt-1">
                {fetching ? <span className="flex items-center justify-center gap-2"><Spinner sm />Creating…</span> : 'Create Account'}
              </Button>
              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stroke" />
                </div>
                <div className="relative flex justify-center text-xs text-ink-faint">
                  <span className="bg-surface-1 px-2">or</span>
                </div>
              </div>
              {/* Google OAuth button */}
              <a
                href="/api/customer/auth/google"
                className="flex items-center justify-center gap-2 w-full border border-stroke-strong rounded-full py-2.5 text-sm font-semibold text-ink hover:bg-surface-2 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908C16.658 14.075 17.64 11.77 17.64 9.2z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </a>
              <p className="text-center text-sm text-ink-sub">
                Have an account?{' '}
                <button type="button" onClick={() => { setAuthMode('login'); setError(''); }}
                  className="text-teal font-semibold hover:underline">Sign in →</button>
              </p>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-ink-faint">Powered by LetLoyal</p>
        <p className="text-center text-xs text-ink-faint mt-2">
          Are you a merchant?{' '}
          <a href="/merchant/login" className="text-teal font-semibold hover:underline">
            Merchant login →
          </a>
        </p>
      </div>
    </main>
  );
}
