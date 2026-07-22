'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { LayoutDashboard, Users, LogOut, CreditCard, Activity, KeyRound, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ds';
import { clsx } from 'clsx';
import { useState, FormEvent } from 'react';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [showPwForm, setShowPwForm]   = useState(false);
  const [curPw,      setCurPw]        = useState('');
  const [newPw,      setNewPw]        = useState('');
  const [pwMsg,      setPwMsg]        = useState('');
  const [pwErr,      setPwErr]        = useState('');
  const [pwSaving,   setPwSaving]     = useState(false);
  const [showCurPw,  setShowCurPw]    = useState(false);
  const [showNewPw,  setShowNewPw]    = useState(false);

  // Don't wrap the login page
  if (pathname === '/admin/login') return <>{children}</>;

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(''); setPwErr('');
    setPwSaving(true);
    try {
      const res  = await fetch('/api/admin/auth/change-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ current_password: curPw, new_password: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { setPwErr(data.error || 'Failed.'); return; }
      setPwMsg('Password changed.');
      setCurPw(''); setNewPw('');
      setShowPwForm(false);
    } catch {
      setPwErr('Something went wrong.');
    } finally {
      setPwSaving(false);
    }
  }

  const nav = [
    { href: '/admin',           label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { href: '/admin/merchants', label: 'Merchants',  icon: <Users           size={18} /> },
    { href: '/admin/billing',   label: 'Billing',    icon: <CreditCard      size={18} /> },
    { href: '/admin/services',  label: 'Services',   icon: <Activity        size={18} /> },
  ];

  return (
    <div className="flex h-screen bg-surface-page overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-1 border-r border-stroke flex flex-col flex-shrink-0">
        <div className="px-5 py-6 border-b border-stroke">
          <Logo size={22} />
          <p className="mt-1 text-xs font-semibold text-ink-faint">Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-full text-body-sm font-semibold transition-colors',
                  active
                    ? 'bg-reward text-reward-fg font-bold'
                    : 'text-ink-sub hover:bg-surface-2 hover:text-ink',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-stroke space-y-1">
          {/* Change password */}
          <button
            onClick={() => { setShowPwForm(!showPwForm); setPwMsg(''); setPwErr(''); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-full text-body-sm font-semibold text-ink-sub hover:bg-surface-2 hover:text-ink transition-colors"
          >
            <KeyRound size={18} />
            Change Password
            <ChevronDown size={14} className={clsx('ml-auto transition-transform', showPwForm && 'rotate-180')} />
          </button>

          {showPwForm && (
            <form onSubmit={handleChangePassword} className="px-2 pb-2 space-y-2">
              <div className="relative">
                <input
                  type={showCurPw ? 'text' : 'password'}
                  placeholder="Current password"
                  value={curPw}
                  onChange={(e) => setCurPw(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 pr-9 rounded-lg border border-stroke-strong bg-surface-1 text-ink placeholder:text-ink-faint outline-none focus:border-teal focus:shadow-ring transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowCurPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-sub"
                  aria-label={showCurPw ? 'Hide password' : 'Show password'}
                >
                  {showCurPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  placeholder="New password (min 8)"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  className="w-full text-xs px-3 py-2 pr-9 rounded-lg border border-stroke-strong bg-surface-1 text-ink placeholder:text-ink-faint outline-none focus:border-teal focus:shadow-ring transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowNewPw(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-sub"
                  aria-label={showNewPw ? 'Hide password' : 'Show password'}
                >
                  {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {pwErr && <p className="text-xs text-bad">{pwErr}</p>}
              {pwMsg && <p className="text-xs text-good">{pwMsg}</p>}
              <button
                type="submit"
                disabled={pwSaving}
                className="w-full text-xs font-bold px-3 py-2 rounded-full bg-teal text-teal-fg hover:bg-teal-hover disabled:opacity-50 transition-colors"
              >
                {pwSaving ? 'Saving…' : 'Update Password'}
              </button>
            </form>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 flex-1 px-4 py-2.5 rounded-full text-body-sm font-semibold text-ink-sub hover:bg-bad-subtle hover:text-bad transition-colors"
            >
              <LogOut size={18} /> Sign Out
            </button>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
