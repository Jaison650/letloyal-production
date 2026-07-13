import MarketingNav from './MarketingNav';
import MarketingFooter from './MarketingFooter';

export default function LegalLayout({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-page">
      <MarketingNav tone="light" />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="font-display font-bold text-h1 text-ink mb-2">{title}</h1>
        {updated && <p className="text-ink-faint text-body-sm mb-10">{updated}</p>}
        <div className="space-y-8 text-ink-sub leading-relaxed [&_h2]:font-display [&_h2]:font-bold [&_h2]:text-h3 [&_h2]:text-ink [&_h2]:mb-3 [&_a]:text-teal [&_a]:font-semibold">
          {children}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
