'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { clsx } from 'clsx';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();

  // Don't wrap the login page
  if (pathname === '/admin/login') return <>{children}</>;

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const nav = [
    { href: '/admin',           label: 'Dashboard',  icon: <LayoutDashboard size={18} /> },
    { href: '/admin/merchants', label: 'Merchants',   icon: <Users           size={18} /> },
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

        <div className="px-3 py-4 border-t border-border-light">
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
