'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { Spinner } from './ui';

// ── Inline redeem code ────────────────────────────────────────────────────────
export default function InlineRedeemCode({ phone, slug, onCancel }: { phone: string; slug: string; onCancel: () => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [secs, setSecs] = useState(600);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/public/redeem-code', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phone, slug }),
    })
      .then(r => r.json())
      .then(d => { if (d.code) { setCode(d.code); setSecs((d.expires_minutes ?? 10) * 60); } else setError(d.error || 'Could not generate code.'); })
      .catch(() => setError('Connection error.'))
      .finally(() => setLoading(false));
  }, [phone, slug]);

  useEffect(() => {
    if (!code || secs <= 0) return;
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [code, secs]);

  const m = Math.floor(secs / 60); const s = secs % 60;
  const expired = secs === 0; const urgent = secs < 120 && !expired;

  return (
    <div className="mt-3 rounded-xl bg-primary-light border border-primary/20 p-4 space-y-3">
      <p className="text-xs font-semibold text-primary text-center uppercase tracking-widest">Show this code to the merchant</p>
      {loading ? <div className="flex justify-center py-4"><Spinner /></div>
        : error ? <p className="text-center text-sm text-status-error py-2">{error}</p>
        : code ? (
          <>
            <div data-clarity-mask="true" className="flex items-center justify-center gap-1.5">
              {code.split('').map((d, i) => (
                <span key={i} className="w-10 flex items-center justify-center text-2xl font-bold text-primary bg-white rounded-xl border-2 border-primary shadow-sm" style={{ height: 52 }}>{d}</span>
              ))}
            </div>
            <div className="flex items-center justify-center">
              <button onClick={() => { navigator.clipboard.writeText(code).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied!' : 'Copy code'}
              </button>
            </div>
            {expired
              ? <p className="text-xs text-center font-semibold text-status-error">Code expired</p>
              : <p className={`text-xs text-center font-semibold tabular-nums ${urgent ? 'text-orange-500' : 'text-text-medium'}`}>Expires in {m}:{String(s).padStart(2, '0')}</p>}
          </>
        ) : null}
      <button onClick={onCancel} className="w-full text-xs text-text-light hover:text-text-medium transition-colors text-center">Cancel Redemption</button>
    </div>
  );
}
