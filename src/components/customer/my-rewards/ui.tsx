'use client';

import Image from 'next/image';

// ── Helpers ───────────────────────────────────────────────────────────────────
export function Spinner({ sm }: { sm?: boolean }) {
  return (
    <svg className={`animate-spin text-primary ${sm ? 'h-4 w-4' : 'h-8 w-8'}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function MerchantAvatar({ logo_url, name, size = 44 }: { logo_url: string | null; name: string; size?: number }) {
  return (
    <div className="rounded-xl overflow-hidden bg-primary-light flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}>
      {logo_url
        ? <Image src={logo_url} alt={name} width={size} height={size} className="object-cover w-full h-full" />
        : <span className="font-bold text-primary" style={{ fontSize: size * 0.4 }}>{name[0]}</span>}
    </div>
  );
}
