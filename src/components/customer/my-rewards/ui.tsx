'use client';

import Image from 'next/image';

// ── Helpers ───────────────────────────────────────────────────────────────────
export function Spinner({ sm }: { sm?: boolean }) {
  return (
    <svg className={`animate-spin text-teal ${sm ? 'h-4 w-4' : 'h-8 w-8'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/**
 * Merchant logo, or a monogram tile tinted with the merchant's identity colour.
 * `accent` accepts any CSS colour — callers pass `var(--m)` from merchantAccentVars.
 */
export function MerchantAvatar({
  logo_url,
  name,
  size = 44,
  accent = 'var(--accent-default)',
}: { logo_url: string | null; name: string; size?: number; accent?: string }) {
  return (
    <div
      className="rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: logo_url ? undefined : `color-mix(in srgb, ${accent} 20%, transparent)`,
        border: logo_url ? undefined : `1px solid color-mix(in srgb, ${accent} 32%, transparent)`,
      }}
    >
      {logo_url
        ? <Image src={logo_url} alt={name} width={size} height={size} className="object-cover w-full h-full" />
        : <span className="font-display font-extrabold" style={{ fontSize: size * 0.4, color: accent }}>{name[0]?.toUpperCase()}</span>}
    </div>
  );
}
