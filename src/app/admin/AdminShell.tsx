'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { LayoutDashboard, Users, LogOut, CreditCard, Activity, KeyRound, ChevronDown } from 'lucide-react';
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
    <div className="flex h-screen bg-bg-muted overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-surface border-r border-border-light flex flex-col flex-shrink-0">
        <div className="px-5 py-6 border-b border-border-light">
          <Logo size={22} />
          <p className="mt-1 text-xs font-semibold text-text-light">Admin</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-white'
                    : 'text-text-medium hover:bg-primary-light hover:text-primary',
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border-light space-y-1">
          {/* Change password */}
          <button
            onClick={() => { setShowPwForm(!showPwForm); setPwMsg(''); setPwErr(''); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-text-medium hover:bg-primary-light hover:text-primary transition-colors"
          >
            <KeyRound size={18} />
            Change Password
            <ChevronDown size={14} className={clsx('ml-auto transition-transform', showPwForm && 'rotate-180')} />
          </button>

          {showPwForm && (
            <form onSubmit={handleChangePassword} className="px-2 pb-2 space-y-2">
              <input
                type="password"
                placeholder="Current password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-border-light bg-bg-muted outline-none focus:border-primary transition-colors"
              />
              <input
                type="password"
                placeholder="New password (min 8)"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-border-light bg-bg-muted outline-none focus:border-primary transition-colors"
              />
              {pwErr && <p className="text-xs text-status-error">{pwErr}</p>}
              {pwMsg && <p className="text-xs text-green-600">{pwMsg}</p>}
              <button
                type="submit"
                disabled={pwSaving}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-white disabled:opacity-50 transition-opacity"
              >
                {pwSaving ? 'Saving…' : 'Update Password'}
              </button>
            </form>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-text-medium hover:bg-red-50 hover:text-status-error transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
