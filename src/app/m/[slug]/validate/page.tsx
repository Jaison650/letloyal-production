'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Phone, ShieldCheck, Gift, CheckCircle, RotateCcw, AlertCircle } from 'lucide-react';
import { Button, Card, Input } from '@/components/ds';

type Stage = 'phone' | 'code' | 'success' | 'error';

interface ValidateResult {
  customer_name:      string | null;
  reward_description: string;
  carry_over:         number;
  new_cycle:          number;
}

export default function ValidatePage() {
  const { slug } = useParams<{ slug: string }>();

  const [stage,   setStage]   = useState<Stage>('phone');
  const [phone,   setPhone]   = useState('');
  const [code,    setCode]    = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errMsg,  setErrMsg]  = useState('');
  const [result,  setResult]  = useState<ValidateResult | null>(null);

  // Code input refs for auto-focus
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (stage === 'code') codeRefs.current[0]?.focus();
  }, [stage]);

  function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) { setErrMsg('Enter a valid 10-digit number.'); return; }
    setErrMsg('');
    setStage('code');
  }

  function handleCodeInput(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[i] = digit;
    setCode(next);
    if (digit && i < 5) codeRefs.current[i + 1]?.focus();
  }

  function handleCodeKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus();
    }
  }

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) { setErrMsg('Enter the full 6-digit code.'); return; }
    setLoading(true);
    setErrMsg('');
    try {
      const res  = await fetch(`/api/merchant/${slug}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) { setErrMsg(data.error || 'Validation failed.'); setLoading(false); return; }
      setResult(data);
      setStage('success');
    } catch {
      setErrMsg('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStage('phone');
    setPhone('');
    setCode(['', '', '', '', '', '']);
    setErrMsg('');
    setResult(null);
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (stage === 'success' && result) {
    return (
      <div className="max-w-md mx-auto">
        <Card padding="md" className="text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-good-subtle flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-good" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink">Reward Redeemed!</h2>
            <p className="text-ink-sub mt-1">
              {result.customer_name ? `${result.customer_name} has` : 'Customer has'} successfully claimed their reward.
            </p>
          </div>
          <div className="rounded-[11px] bg-good-subtle px-4 py-3 text-left space-y-1">
            <p className="text-sm font-semibold text-good flex items-center gap-1.5">
              <Gift size={14} /> {result.reward_description}
            </p>
            {result.carry_over > 0 && (
              <p className="text-xs text-good">
                {result.carry_over} point{result.carry_over > 1 ? 's' : ''} carried to next cycle
              </p>
            )}
          </div>
          <Button onClick={reset} fullWidth className="flex items-center justify-center gap-2">
            <RotateCcw size={16} /> Validate Another
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-subtle flex items-center justify-center">
          <ShieldCheck size={20} className="text-teal" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink">Validate Redemption</h1>
          <p className="text-sm text-ink-sub">
            {stage === 'phone'
              ? 'Enter the customer\'s phone number to begin.'
              : 'Enter the 6-digit code shown on the customer\'s phone.'}
          </p>
        </div>
      </div>

      <Card padding="md" className="space-y-5">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${stage === 'phone' ? 'bg-teal text-teal-fg' : 'bg-teal-subtle text-teal'}`}>
            <span>1</span> Phone
          </div>
          <div className="flex-1 h-px bg-stroke" />
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${stage === 'code' || stage === 'success' ? 'bg-teal text-teal-fg' : 'bg-surface-2 text-ink-faint'}`}>
            <span>2</span> Code
          </div>
          <div className="flex-1 h-px bg-stroke" />
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${stage === 'success' ? 'bg-good-subtle text-good' : 'bg-surface-2 text-ink-faint'}`}>
            <span>3</span> Done
          </div>
        </div>

        {/* Stage: phone */}
        {stage === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Customer Phone Number</label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center px-3 rounded-xl border border-stroke bg-surface-2 text-ink-sub font-medium text-sm flex-shrink-0">
                  🇮🇳 +91
                </div>
                <div className="relative flex-1">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    className="pl-9"
                    inputMode="numeric"
                    autoFocus
                    required
                  />
                </div>
              </div>
            </div>
            {errMsg && (
              <div className="flex items-center gap-2 rounded-[11px] bg-bad-subtle px-3 py-2 text-sm text-bad">
                <AlertCircle size={14} /> {errMsg}
              </div>
            )}
            <Button
              type="submit"
              disabled={phone.replace(/\D/g, '').length !== 10}
              fullWidth
            >
              Next →
            </Button>
          </form>
        )}

        {/* Stage: code */}
        {stage === 'code' && (
          <form onSubmit={handleValidate} className="space-y-5">
            <div>
              <p className="text-sm text-ink-sub mb-1">
                Customer: <span className="font-semibold text-ink">+91 {phone}</span>
              </p>
              <button type="button" onClick={() => setStage('phone')} className="text-xs text-teal hover:underline">
                ← Change number
              </button>
            </div>

            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">6-Digit Reward Code</label>
              <div className="flex gap-2 justify-center mt-2">
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={el => { codeRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    className="w-11 h-14 text-center text-2xl font-bold border-2 rounded-xl border-stroke-strong focus:border-teal focus:outline-none bg-surface-1 text-ink transition-colors"
                  />
                ))}
              </div>
            </div>

            {errMsg && (
              <div className="flex items-center gap-2 rounded-[11px] bg-bad-subtle px-3 py-2 text-sm text-bad">
                <AlertCircle size={14} /> {errMsg}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || code.join('').length !== 6}
              fullWidth
              className="flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Validating…
                </>
              ) : (
                <><ShieldCheck size={16} /> Confirm Redemption</>
              )}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
