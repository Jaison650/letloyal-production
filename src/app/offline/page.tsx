export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-surface-page">
      <div className="text-6xl mb-4">📵</div>
      <h1 className="text-2xl font-display font-bold text-ink mb-2">You&apos;re offline</h1>
      <p className="text-ink-sub mb-6">
        Please check your internet connection and try again.
      </p>
      <a
        href="/my-rewards"
        className="inline-flex items-center justify-center rounded-full bg-teal text-teal-fg font-bold px-6 py-3 hover:bg-teal-hover transition-colors min-h-[44px]"
      >
        Try again
      </a>
    </div>
  );
}
