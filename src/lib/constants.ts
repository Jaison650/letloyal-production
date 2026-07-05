export const APP_NAME = 'LetLoyal';
export const POWERED_BY = 'Powered by LetLoyal';

// Merchant session: 7 days. Admin session: 7 days.
export const MERCHANT_SESSION_MAX_AGE = 60 * 60 * 24 * 7;
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Named menu/service item shown as a tile on the merchant's QR screen.
export interface NamedDial {
  name:  string;   // item label, max 40 chars (may be empty — falls back to price display)
  price: number;   // ₹ amount (decimal allowed)
  emoji: string;   // single emoji character, or empty string
}

// Default editable speed-dial presets (₹), used when a merchant has none set.
export const DEFAULT_SPEED_DIALS: NamedDial[] = [
  { name: '', price: 100,  emoji: '' },
  { name: '', price: 200,  emoji: '' },
  { name: '', price: 500,  emoji: '' },
  { name: '', price: 1000, emoji: '' },
];

/** Normalize a stored speed_dials JSON value (legacy number[] or NamedDial[]) into NamedDial[]. */
export function normalizeSpeedDials(raw: unknown): NamedDial[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_SPEED_DIALS;
  const normalized = raw
    .map((item): NamedDial | null => {
      if (typeof item === 'number' && Number.isFinite(item) && item > 0) {
        return { name: '', price: item, emoji: '' };
      }
      if (item && typeof item === 'object') {
        const obj = item as { name?: unknown; price?: unknown; emoji?: unknown };
        if (typeof obj.price !== 'number' || obj.price <= 0) return null;
        return {
          name:  typeof obj.name === 'string' ? obj.name.trim().slice(0, 40) : '',
          price: obj.price,
          emoji: typeof obj.emoji === 'string' ? obj.emoji.slice(0, 8) : '',
        };
      }
      return null;
    })
    .filter((v): v is NamedDial => v !== null);
  return normalized.length > 0 ? normalized : DEFAULT_SPEED_DIALS;
}

// Emoji presets offered when picking a menu item's icon (food, drinks, services, misc).
export const MENU_EMOJI_PRESETS = [
  '🍔','🌯','🌮','🍕','🍣','🥗','🍜','🥩','🍗','🥪',
  '☕','🧋','🍺','🥤','🧃','🍰','🧁','🍩','🍦','🌿',
  '✂️','💆','💅','🧴','👗','🎁','🌸','🏋️','🛁','🖥️',
  '🔧','📦','🎵','🛒','🏠','🚗','🐾','📱','💊','🌺',
];

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
