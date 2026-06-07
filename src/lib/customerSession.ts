// Client-side only — customer phone persistence via localStorage
// 30-day inactivity → auto logout

const KEY = 'll_customer';
const INACTIVITY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface CustomerSession {
  phone: string;       // 10 digits, no country code
  name:  string | null;
  lastActive: number;  // epoch ms
}

export function getCustomerSession(): CustomerSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s: CustomerSession = JSON.parse(raw);
    // Expired?
    if (Date.now() - s.lastActive > INACTIVITY_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function saveCustomerSession(phone: string, name: string | null) {
  if (typeof window === 'undefined') return;
  const s: CustomerSession = { phone, name, lastActive: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function touchCustomerSession() {
  if (typeof window === 'undefined') return;
  const s = getCustomerSession();
  if (s) saveCustomerSession(s.phone, s.name);
}

export function clearCustomerSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
