export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-brand-bg">
      <div className="text-6xl mb-4">📵</div>
      <h1 className="text-2xl font-bold text-text-dark mb-2">You&apos;re offline</h1>
      <p className="text-text-medium mb-6">
        Please check your internet connection and try again.
      </p>
      <a href="/my-rewards" className="btn-primary">
        Try again
      </a>
    </div>
  );
}
