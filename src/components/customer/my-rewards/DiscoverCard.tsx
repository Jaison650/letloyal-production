'use client';

import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ds';
import { MerchantAvatar } from './ui';
import type { DiscoverStore } from './types';

// ── Discover Store Card ───────────────────────────────────────────────────────
export default function DiscoverCard({ store }: { store: DiscoverStore }) {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <MerchantAvatar logo_url={store.logo_url} name={store.business_name} size={44} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-ink truncate">{store.business_name}</p>
        <p className="text-xs text-ink-faint truncate">{store.reward_description}</p>
      </div>
      <span className="text-xs font-semibold text-teal flex items-center gap-0.5 flex-shrink-0">Scan to Join <ArrowRight size={12} /></span>
    </Card>
  );
}
