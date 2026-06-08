import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="mb-6">
          <Link href="/"><Logo variant="light" size={32} /></Link>
        </div>
        <div className="text-8xl font-black text-primary mb-4">404</div>
        <h1 className="font-jakarta font-bold text-2xl text-text-dark mb-3">Page not found</h1>
        <p className="text-text-medium mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary px-6 py-3">Go Home</Link>
          <Link href="/my-rewards" className="btn-secondary px-6 py-3">My Rewards</Link>
          <Link href="/merchant/login" className="btn-ghost px-6 py-3">Merchant Login</Link>
        </div>
      </div>
    </div>
  );
}
