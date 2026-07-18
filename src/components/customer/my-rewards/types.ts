// ── Types ─────────────────────────────────────────────────────────────────────
export interface LoyaltyCard {
  merchant_slug: string; business_name: string; logo_url: string | null;
  campaign_name: string; campaign_type: string; progress: number;
  reward_threshold: number; reward_description: string;
  reward_status: 'in_progress' | 'unlocked'; cycle_number: number; last_scan_at: string | null;
}
export interface DiscoverStore {
  slug: string; business_name: string; logo_url: string | null;
  campaign_name: string; campaign_type: string; reward_description: string; reward_threshold: number;
}
export interface CustomerData {
  id: string; name: string | null; phone: string; email: string | null;
  birthday: string | null; gender: string | null;
}
export type Tab = 'cards' | 'scan' | 'nearby' | 'account';
export type AuthMode = 'login' | 'register' | 'forgot';
