'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  QrCode,
  Users,
  ShieldCheck,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart2,
} from 'lucide-react';
import { clsx } from 'clsx';
import Logo from '@/components/ui/Logo';

interface NavItem {
  label: string;
  href:  string;
  icon:  React.ReactNode;
}

interface DashboardShellProps {
  slug:          string;
  businessName:  string;
  children:      React.ReactNode;
}

export default function DashboardShell({ slug, businessName, children }: DashboardShellProps) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [open, setOpen] = useState(false);

  const nav: NavItem[] = [
    { label: 'Dashboard',  href: `/m/${slug}`,          icon: <LayoutDashboard size={18} /> },
    { label: 'Campaign',   href: `/m/${slug}/campaign`,  icon: <Megaphone       size={18} /> },
    { label: 'QR Code',    href: `/m/${slug}/qr`,        icon: <QrCode          size={18} /> },
    { label: 'Customers',  href: `/m/${slug}/customers`, icon: <Users           size={18} /> },
    { label: 'Analytics',  href: `/m/${slug}/analytics`, icon: <BarChart2       size={18} /> },
    { label: 'Validate',   href: `/m/${slug}/validate`,  icon: <ShieldCheck     size={18} /> },
    { label: 'Feedback',   href: `/m/${slug}/feedback`,  icon: <MessageSquare   size={18} /> },
    { label: 'Settings',   href: `/m/${slug}/settings`,  icon: <Settings        size={18} /> },
  ];

  async function handleLogout() {
    await fetch('/api/merchant/auth/logout', { method: 'POST' });
    router.push('/merchant/login');
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + business name */}
      <div className="px-5 py-6 border-b border-border-light">
        <Logo size={22} />
        <p className="mt-2 text-xs font-semibold text-text-light truncate">{businessName}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-medium hover:bg-primary-light hover:text-primary',
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-border-light">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-text-medium hover:bg-red-50 hover:text-status-error transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-bg-muted overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 bg-surface border-r border-border-light flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col transition-transform duration-200 md:hidden shadow-2xl',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-light">
          <Logo size={22} />
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-bg-muted">
            <X size={20} className="text-text-medium" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface border-b border-border-light">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-bg-muted"
          >
            <Menu size={22} className="text-text-medium" />
          </button>
          <Logo size={22} />
          <span className="text-sm font-semibold text-text-dark truncate ml-auto">{businessName}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
