'use client';

import { CreditCard, ScanLine, Navigation, User } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Tab } from './types';

// ── Bottom Tab Bar ────────────────────────────────────────────────────────────
export default function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-border-light z-20">
      <div className="max-w-lg mx-auto flex">
        {([
          { id: 'cards'   as Tab, label: 'Cards',   icon: <CreditCard size={22} /> },
          { id: 'scan'    as Tab, label: 'Scan',    icon: <ScanLine   size={22} /> },
          { id: 'nearby'  as Tab, label: 'Nearby',  icon: <Navigation size={22} /> },
          { id: 'account' as Tab, label: 'Account', icon: <User       size={22} /> },
        ] as { id: Tab; label: string; icon: ReactNode }[]).map(({ id, label, icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${tab === id ? 'text-primary' : 'text-text-light hover:text-text-medium'}`}>
            {icon}{label}
          </button>
        ))}
      </div>
    </nav>
  );
}
