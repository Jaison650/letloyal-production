// src/lib/utils.ts
// Shared pure helpers — no DB, no network, safe in any runtime

/**
 * Mask a phone number for merchant-facing display.
 * "+919876543210" or "9876543210" → "98••••210"
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^91/, '');
  if (digits.length < 7) return '••••••';
  return `${digits.slice(0, 2)}••••${digits.slice(-3)}`;
}

/**
 * Normalize phone to E.164 +91XXXXXXXXXX format.
 * Accepts "9876543210", "09876543210", "919876543210", "+919876543210"
 * Returns null if invalid.
 */
export function normalizePhone(raw: string): string | null {
  const digits = String(raw).replace(/\D/g, '').replace(/^(91|0)/, '');
  if (digits.length !== 10) return null;
  return `+91${digits}`;
}

/**
 * Strip +91 prefix and return 10-digit string for display.
 */
export function displayPhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^91/, '');
}
