'use client';

import { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';
import { Phone, Gift, CheckCircle, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

interface UnlockedReward {
  customer_merchant_id: string;
  customer_name:        string | null;
  phone_number:         string;
  campaign_name:        string;
  reward_description:   string;
  reward_threshold:     number;
  progress:             number;
  cycle_number:         number;
}

interface ConfirmResult {
  reward_description: string;
  customer_name:      string | null;
  carry_over:         number;
  new_cycle:          number;
  message:            string;
}

type Step = 'lookup' | 'confirm' | 'success';

interface RedemptionValidatorProps {
  slug: string;
}

export default function RedemptionValidator({ slug }: RedemptionValidatorProps) {
  const [step,    setStep]    = useState<Step>('lookup');
  const [phone,   setPhone]   = useState('');
  const [rewards, setRewards] = useState<UnlockedReward[]>([]);
  const [selected, setSelected] = useState<UnlockedReward | null>(null);
  const [confirm,  setConfirm]  = useState<ConfirmResult | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // ── Step 1: Lookup ────────────────────────────────────────────────────
  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`/api/merchant/${slug}/redeem/lookup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone_number: phone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Lookup failed.'); return; }

      setRewards(data.rewards);
      setSelected(data.rewards[0]);   // auto-select if only one
      setStep('confirm');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Confirm redemption ────────────────────────────────────────
  async function handleConfirm() {
    if (!selected) return;
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`/api/merchant/${slug}/redeem/confirm`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ customer_merchant_id: selected.customer_merchant_id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Redemption failed.'); return; }

      setConfirm(data);
      setStep('success');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Reset to lookup ───────────────────────────────────────────────────
  function reset() {
    setStep('lookup');
    setPhone('');
    setRewards([]);
    setSelected(null);
    setConfirm(null);
    setError('');
  }

  // ── Step 1 UI: Phone lookup ───────────────────────────────────────────
  if (step === 'lookup') {
    return (
      <div className="max-w-sm space-y-5">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center mx-auto mb-3">
            <Gift size={28} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-text-dark mb-1">Redeem a Reward</h2>
          <p className="text-sm text-text-medium">
            Enter the customer&apos;s mobile number to check their unlocked reward.
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="form-label">Customer&apos;s Mobile Number</label>
            <div className="flex gap-2">
              <div className="flex items-center justify-center px-3 rounded-xl border border-border-light bg-bg-muted text-text-medium font-medium text-sm flex-shrink-0">
                🇮🇳 +91
              </div>
              <div className="relative flex-1">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  className="form-input pl-9"
                  inputMode="numeric"
                  required
                  autoFocus
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error">
              {error}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={phone.length !== 10}
          >
            Check Reward
          </Button>
        </form>
      </div>
    );
  }

  // ── Step 2 UI: Confirm reward ─────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="max-w-sm space-y-5">
        <button
          onClick={() => setStep('lookup')}
          className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-xl font-bold text-text-dark">Confirm Redemption</h2>

        {/* Reward cards — one per unlocked reward (pilot: usually 1) */}
        <div className="space-y-3">
          {rewards.map((r) => (
            <button
              key={r.customer_merchant_id}
              type="button"
              onClick={() => setSelected(r)}
              className={clsx(
                'w-full text-left rounded-2xl border-2 p-4 transition-all',
                selected?.customer_merchant_id === r.customer_merchant_id
                  ? 'border-primary bg-primary-light/30'
                  : 'border-border-light hover:border-primary/40',
              )}
            >
              {/* Customer info */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-text-dark text-base">
                    {r.customer_name ?? `+91 ${r.phone_number}`}
                  </p>
                  {r.customer_name && (
                    <p className="text-xs text-text-light mt-0.5">+91 {r.phone_number}</p>
                  )}
                </div>
                <span className="text-xs font-semibold text-text-light bg-bg-muted px-2 py-1 rounded-full">
                  Cycle {r.cycle_number}
                </span>
              </div>

              {/* Reward badge */}
              <div className="flex items-center gap-2 bg-primary-light rounded-xl px-3 py-2.5">
                <Gift size={16} className="text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-primary">{r.campaign_name}</p>
                  <p className="text-sm font-bold text-text-dark">{r.reward_description}</p>
                </div>
              </div>

              {/* Progress note */}
              <p className="text-xs text-text-light mt-2 text-right">
                {r.progress}/{r.reward_threshold} stamps earned
              </p>
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        <Button onClick={handleConfirm} fullWidth loading={loading} disabled={!selected}>
          Confirm Redemption
        </Button>

        <p className="text-xs text-text-light text-center">
          This will mark the reward as redeemed and reset the customer&apos;s progress.
        </p>
      </div>
    );
  }

  // ── Step 3 UI: Success ────────────────────────────────────────────────
  return (
    <div className="max-w-sm space-y-5">
      {/* Success state */}
      <div className="rounded-2xl overflow-hidden border border-green-200 bg-white">
        <div className="bg-gradient-to-br from-green-500 to-teal-500 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold mb-1">Reward Redeemed!</h2>
          {confirm?.customer_name && (
            <p className="text-white/80 text-sm">{confirm.customer_name}</p>
          )}
        </div>

        <div className="px-6 py-5 space-y-3">
          <p className="font-bold text-text-dark text-center text-lg">
            {confirm?.reward_description}
          </p>

          <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 text-center font-medium">
            {confirm?.message}
          </div>

          {/* Carry-over info */}
          {(confirm?.carry_over ?? 0) > 0 && (
            <p className="text-xs text-text-light text-center">
              Customer carries over {confirm!.carry_over} stamp{confirm!.carry_over !== 1 ? 's' : ''} to the new cycle.
            </p>
          )}
        </div>
      </div>

      {/* Next redemption */}
      <Button onClick={reset} fullWidth variant="secondary">
        <RotateCcw size={16} /> Redeem Another
      </Button>
    </div>
  );
}
