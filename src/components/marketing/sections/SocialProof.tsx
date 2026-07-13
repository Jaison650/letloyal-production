import { Coffee, Scissors, Dumbbell, ShoppingBag, Pizza, Sparkles } from 'lucide-react';

const TYPES = [
  { icon: Coffee, label: 'Cafés' },
  { icon: Scissors, label: 'Salons' },
  { icon: Dumbbell, label: 'Gyms' },
  { icon: ShoppingBag, label: 'Retail' },
  { icon: ShoppingBag, label: 'Boutiques' },
  { icon: Pizza, label: 'Restaurants' },
  { icon: Sparkles, label: 'Spas' },
];

export default function SocialProof() {
  return (
    <div className="relative bg-surface-2/60 border-y border-stroke py-4 overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-surface-page to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-surface-page to-transparent z-10 pointer-events-none" />
      <div className="flex animate-marquee whitespace-nowrap gap-10">
        {[...Array(2)].map((_, k) => (
          <span key={k} className="flex items-center gap-10 text-body-sm font-semibold text-ink-sub">
            {TYPES.map((t, i) => (
              <span key={`${t.label}-${i}`} className="flex items-center gap-10">
                <span className="flex items-center gap-2"><t.icon size={14} className="text-teal" /> {t.label}</span>
                <span className="text-ink-faint">·</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
