import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary to-teal-700 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8 text-center">

        {/* Logo */}
        <div className="space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto shadow-xl border border-white/30">
            <span className="text-4xl">⭐</span>
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">LetLoyal</h1>
            <p className="text-white/80 text-sm mt-1">Loyalty rewards, simplified</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Link
            href="/my-rewards"
            className="block w-full bg-white hover:bg-white/95 text-primary font-bold py-4 rounded-2xl text-base transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
          >
            🎁 View My Rewards
          </Link>

          <Link
            href="/merchant/login"
            className="block w-full bg-white/15 hover:bg-white/25 border border-white/30 text-white font-semibold py-4 rounded-2xl text-base transition-all backdrop-blur"
          >
            🏪 Merchant Login
          </Link>
        </div>

        <p className="text-white/50 text-xs">India Pilot · {new Date().getFullYear()}</p>
      </div>
    </main>
  );
}
