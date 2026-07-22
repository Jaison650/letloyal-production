import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="mb-6 flex justify-center">
          <Link href="/"><Logo size={32} /></Link>
        </div>
        <div className="text-8xl font-display font-black text-teal mb-4">404</div>
        <h1 className="font-display font-bold text-2xl text-ink mb-3">Page not found</h1>
        <p className="text-ink-sub mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="inline-flex items-center justify-center rounded-full bg-teal text-teal-fg font-bold px-6 py-3 hover:bg-teal-hover transition-colors">Go Home</Link>
          <Link href="/my-rewards" className="inline-flex items-center justify-center rounded-full border border-stroke-strong bg-surface-1 text-ink font-bold px-6 py-3 hover:bg-surface-2 transition-colors">My Rewards</Link>
          <Link href="/merchant/login" className="inline-flex items-center justify-center rounded-full text-teal font-bold px-6 py-3 hover:bg-teal-subtle transition-colors">Merchant Login</Link>
        </div>
      </div>
    </div>
  );
}
