export const APP_NAME = 'LetLoyal';
export const POWERED_BY = 'Powered by LetLoyal';

// Merchant session: 7 days. Admin session: 7 days.
export const MERCHANT_SESSION_MAX_AGE = 60 * 60 * 24 * 7;
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Default editable speed-dial presets (₹), used when a merchant has none set.
export const DEFAULT_SPEED_DIALS = [100, 200, 500, 1000];

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
