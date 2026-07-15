'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  QrCode,
  ShieldCheck,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart2,
  Tag,
  Bell,
} from 'lucide-react';
import { clsx } from 'clsx';
import Image from 'next/image';
import { PoweredBy } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ds';

interface NavItem {
  label: string;
  href:  string;
  icon:  React.ReactNode;
}

interface DashboardShellProps {
  slug:          string;
  businessName:  string;
  logoUrl:       string | null;
  children:      React.ReactNode;
}

// ── Merchant brand mark — their logo, or a letter avatar if none set ──────
function MerchantMark({ businessName, logoUrl, size }: { businessName: string; logoUrl: string | null; size: number }) {
  if (logoUrl) {
    return (
      <div
        className="rounded-lg overflow-hidden border border-stroke flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <Image src={logoUrl} alt={businessName} width={size} height={size} className="object-cover w-full h-full" unoptimized />
      </div>
    );
  }
  return (
    <div
      className="rounded-lg bg-teal-subtle flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="font-extrabold text-teal" style={{ fontSize: size * 0.45 }}>
        {businessName[0]?.toUpperCase() ?? '?'}
      </span>
    </div>
  );
}

export default function DashboardShell({ slug, businessName, logoUrl, children }: DashboardShellProps) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [open, setOpen] = useState(false);

  const nav: NavItem[] = [
    { label: 'Dashboard',  href: `/m/${slug}`,          icon: <LayoutDashboard size={18} /> },
    { label: 'Campaign',   href: `/m/${slug}/campaign`,  icon: <Megaphone       size={18} /> },
    { label: 'Offers',     href: `/m/${slug}/offers`,    icon: <Tag             size={18} /> },
    { label: 'QR Code',    href: `/m/${slug}/qr`,        icon: <QrCode          size={18} /> },
    { label: 'Insights',   href: `/m/${slug}/analytics`, icon: <BarChart2       size={18} /> },
    { label: 'Validate',   href: `/m/${slug}/validate`,  icon: <ShieldCheck     size={18} /> },
    { label: 'Feedback',   href: `/m/${slug}/feedback`,  icon: <MessageSquare   size={18} /> },
    { label: 'Notify',     href: `/m/${slug}/push`,      icon: <Bell            size={18} /> },
    { label: 'Settings',   href: `/m/${slug}/settings`,  icon: <Settings        size={18} /> },
  ];

  async function handleLogout() {
    await fetch('/api/merchant/auth/logout', { method: 'POST' });
    router.push('/merchant/login');
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Merchant logo + business name */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-stroke">
        <MerchantMark businessName={businessName} logoUrl={logoUrl} size={36} />
        <p className="text-sm font-bold text-ink truncate">{businessName}</p>
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

      {/* Logout + theme */}
      <div className="px-3 py-4 border-t border-stroke space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 flex-1 px-4 py-2.5 rounded-full text-body-sm font-semibold text-ink-sub hover:bg-bad-subtle hover:text-bad transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
          <ThemeToggle />
        </div>
        <div className="flex justify-center">
          <PoweredBy />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-surface-page overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 bg-surface-1 border-r border-stroke flex-shrink-0">
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
          'fixed inset-y-0 left-0 w-64 bg-surface-1 z-50 flex flex-col transition-transform duration-200 md:hidden shadow-2xl',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-stroke">
          <div className="flex items-center gap-2.5 min-w-0">
            <MerchantMark businessName={businessName} logoUrl={logoUrl} size={28} />
            <p className="text-sm font-bold text-ink truncate">{businessName}</p>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-surface-2 flex-shrink-0">
            <X size={20} className="text-ink-sub" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-1 border-b border-stroke">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-surface-2"
          >
            <Menu size={22} className="text-ink-sub" />
          </button>
          <MerchantMark businessName={businessName} logoUrl={logoUrl} size={26} />
          <span className="text-sm font-semibold text-ink truncate ml-auto">{businessName}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
