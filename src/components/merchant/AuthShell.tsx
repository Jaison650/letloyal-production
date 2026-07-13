'use client';
import Link from 'next/link';
import Logo from '@/components/ui/Logo';
import { Card, Input, type InputProps } from '@/components/ds';

export function AuthField({ label, icon, ...props }: InputProps & { label: string; icon?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-body-sm font-semibold text-ink mb-1.5">{label}</span>
      <span className="relative block">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" aria-hidden>
            {icon}
          </span>
        )}
        <Input {...props} className={icon ? 'pl-10' : undefined} />
      </span>
    </label>
  );
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  backHref = '/',
  backLabel = 'Back to home',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="min-h-screen flex bg-surface-page">
      {/* Brand panel (desktop only) */}
      <aside className="hidden lg:flex lg:w-[45%] relative bg-section-dark flex-col justify-between p-10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className="absolute -top-24 right-[-20%] w-[560px] h-[380px]"
            style={{ background: 'radial-gradient(closest-side, rgba(13,148,136,.2), transparent)' }}
          />
        </div>
        <Link href="/" className="relative w-fit" aria-label="LetLoyal home">
          <Logo variant="dark" size={28} />
        </Link>
        <div className="relative">
          <h2 className="font-display font-extrabold text-4xl text-white tracking-[-0.025em] leading-[1.1]">
            Loyalty that brings them{' '}
            <em className="font-serif italic font-medium text-[#F2C230]">back.</em>
          </h2>
          <p className="text-[#AEBDB5] mt-4 max-w-sm leading-relaxed">
            One QR at your counter. Points land instantly, and your regulars become your growth engine.
          </p>
        </div>
        <p className="relative text-caption text-[#7C8C84]">© 2026 LetLoyal · India Pilot 🇮🇳</p>
      </aside>

      {/* Form column */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center lg:hidden">
            <Link href="/" className="inline-block" aria-label="LetLoyal home">
              <Logo variant="light" size={28} />
            </Link>
          </div>
          <div className="mb-4 text-center">
            <Link href={backHref} className="inline-flex items-center gap-1 text-caption text-ink-sub hover:text-teal transition-colors">
              <span>←</span> {backLabel}
            </Link>
          </div>
          <Card padding="lg">
            <h1 className="font-display font-bold text-h2 text-ink mb-1">{title}</h1>
            {subtitle && <p className="text-ink-faint text-body-sm mb-6">{subtitle}</p>}
            {children}
          </Card>
          {footer && <div className="mt-5 text-center text-body-sm text-ink-sub">{footer}</div>}
          <p className="mt-6 text-center text-caption text-ink-faint">Powered by LetLoyal</p>
        </div>
      </main>
    </div>
  );
}
