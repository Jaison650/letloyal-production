export const APP_NAME = 'LetLoyal';
export const POWERED_BY = 'Powered by LetLoyal';

// Merchant session: 7 days. Admin session: 7 days.
export const MERCHANT_SESSION_MAX_AGE = 60 * 60 * 24 * 7;
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Speed-dial preset shown on the merchant's QR screen. `label`/`icon` are
// optional — a plain ₹ amount is shown when either is unset.
export interface SpeedDial {
  amount: number;
  label?: string | null;
  icon?:  string | null;
}

// Default editable speed-dial presets (₹), used when a merchant has none set.
export const DEFAULT_SPEED_DIALS: SpeedDial[] = [
  { amount: 100,  label: null, icon: null },
  { amount: 200,  label: null, icon: null },
  { amount: 500,  label: null, icon: null },
  { amount: 1000, label: null, icon: null },
];

// Valid icon keys for speed dials — must match keys in src/lib/speedDialIcons.tsx
export const SPEED_DIAL_ICON_KEYS = [
  'coffee', 'utensils', 'pizza', 'ice-cream', 'shopping-bag',
  'scissors', 'dumbbell', 'sparkles', 'shirt', 'gift',
] as const;
export type SpeedDialIconKey = typeof SPEED_DIAL_ICON_KEYS[number];

/** Normalize a stored speed_dials JSON value (legacy number[] or new SpeedDial[]) into SpeedDial[]. */
export function normalizeSpeedDials(raw: unknown): SpeedDial[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SPEED_DIALS;
  const normalized = raw
    .map((item): SpeedDial | null => {
      if (typeof item === 'number' && Number.isFinite(item)) {
        return { amount: item, label: null, icon: null };
      }
      if (item && typeof item === 'object' && typeof (item as { amount?: unknown }).amount === 'number') {
        const obj = item as { amount: number; label?: unknown; icon?: unknown };
        return {
          amount: obj.amount,
          label:  typeof obj.label === 'string' && obj.label.trim() ? obj.label.trim().slice(0, 24) : null,
          icon:   typeof obj.icon === 'string' && (SPEED_DIAL_ICON_KEYS as readonly string[]).includes(obj.icon) ? obj.icon : null,
        };
      }
      return null;
    })
    .filter((v): v is SpeedDial => v !== null);
  return normalized.length > 0 ? normalized : DEFAULT_SPEED_DIALS;
}

// Currency for the India pilot.
export const CURRENCY_SYMBOL = '₹';

// Reject duplicate scans for the same customer + campaign within this window.
export const SCAN_IDEMPOTENCY_WINDOW_SECONDS = 60;

// Image upload limits
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_LOGO_SIZE_MB    = 2;
export const MAX_BANNER_SIZE_MB  = 4;

// URL validation
export const MAX_URL_LENGTH = 500;
