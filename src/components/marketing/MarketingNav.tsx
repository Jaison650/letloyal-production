'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

const NAV_LINKS = [
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'FAQ', href: '/#faq' },
];

export default function MarketingNav({ tone = 'onDark' }: { tone?: 'onDark' | 'light' }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handle, { passive: true });
    handle();
    return () => window.removeEventListener('scroll', handle);
  }, []);

  const light = tone === 'light' || scrolled || mobileOpen;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300 border-b',
        light
          ? 'bg-surface-1/85 backdrop-blur-md border-stroke shadow-ds'
          : 'bg-transparent border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="LetLoyal home">
          <Logo variant={light ? 'light' : 'dark'} size={26} />
        </Link>
        <nav className={cn('hidden md:flex items-center gap-6 text-body-sm font-semibold', light ? 'text-ink-sub' : 'text-[#AEBDB5]')}>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className={cn('transition-colors', light ? 'hover:text-teal' : 'hover:text-white')}>
              {l.label}
            </a>
          ))}
          <Link href="/my-rewards" className={cn('transition-colors', light ? 'hover:text-teal' : 'hover:text-white')}>
            For Customers
          </Link>
        </nav>
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/merchant/login"
            className={cn(
              'rounded-full px-5 py-2 text-body-sm font-bold border transition-colors',
              light
                ? 'border-stroke-strong text-ink hover:bg-surface-2'
                : 'border-white/20 bg-white/[0.08] text-white hover:bg-white/[0.14]'
            )}
          >
            Merchant Login
          </Link>
          <Link
            href="/merchant/register"
            className="rounded-full px-5 py-2 text-body-sm font-bold bg-reward text-reward-fg hover:brightness-95 transition-[filter]"
          >
            Get Started Free
          </Link>
        </div>
        <button
          className={cn('md:hidden p-2', light ? 'text-ink-sub' : 'text-white')}
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-surface-1/95 backdrop-blur-md border-t border-stroke"
          >
            <nav className="px-5 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="py-2.5 text-body font-semibold text-ink-sub hover:text-teal">
                  {l.label}
                </a>
              ))}
              <Link href="/my-rewards" onClick={() => setMobileOpen(false)} className="py-2.5 text-body font-semibold text-ink-sub hover:text-teal">
                For Customers
              </Link>
              <div className="flex gap-2 pt-3 pb-1">
                <Link href="/merchant/login" className="flex-1 text-center rounded-full px-4 py-2.5 text-body-sm font-bold border border-stroke-strong text-ink">
                  Merchant Login
                </Link>
                <Link href="/merchant/register" className="flex-1 text-center rounded-full px-4 py-2.5 text-body-sm font-bold bg-reward text-reward-fg">
                  Get Started Free
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
