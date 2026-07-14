'use client';

import { useState, FormEvent } from 'react';
import { Button, Card, Input } from '@/components/ds';
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
          <div className="w-14 h-14 rounded-2xl bg-teal-subtle flex items-center justify-center mx-auto mb-3">
            <Gift size={28} className="text-teal" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-1">Redeem a Reward</h2>
          <p className="text-sm text-ink-sub">
            Enter the customer&apos;s mobile number to check their unlocked reward.
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label className="block text-body-sm font-semibold text-ink mb-1.5">Customer&apos;s Mobile Number</label>
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
                  required
                  autoFocus
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-sm text-bad">
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
          className="text-sm text-teal hover:underline font-medium flex items-center gap-1"
        >
          ← Back
        </button>

        <h2 className="text-xl font-bold text-ink">Confirm Redemption</h2>

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
                  ? 'border-teal bg-teal-subtle/30'
                  : 'border-stroke hover:border-teal/40',
              )}
            >
              {/* Customer info */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-ink text-base">
                    {r.customer_name ?? `+91 ${r.phone_number}`}
                  </p>
                  {r.customer_name && (
                    <p className="text-xs text-ink-faint mt-0.5">+91 {r.phone_number}</p>
                  )}
                </div>
                <span className="text-xs font-semibold text-ink-faint bg-surface-2 px-2 py-1 rounded-full">
                  Cycle {r.cycle_number}
                </span>
              </div>

              {/* Reward badge */}
              <div className="flex items-center gap-2 bg-reward-subtle border border-reward/40 rounded-xl px-3 py-2.5">
                <Gift size={16} className="text-reward-deep flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-reward-deep">{r.campaign_name}</p>
                  <p className="text-sm font-bold text-reward-deep">{r.reward_description}</p>
                </div>
              </div>

              {/* Progress note */}
              <p className="text-xs text-ink-faint mt-2 text-right">
                {r.progress}/{r.reward_threshold} stamps earned
              </p>
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-sm text-bad">
            {error}
          </div>
        )}

        <Button onClick={handleConfirm} fullWidth loading={loading} disabled={!selected}>
          Confirm Redemption
        </Button>

        <p className="text-xs text-ink-faint text-center">
          This will mark the reward as redeemed and reset the customer&apos;s progress.
        </p>
      </div>
    );
  }

  // ── Step 3 UI: Success ────────────────────────────────────────────────
  return (
    <div className="max-w-sm space-y-5">
      {/* Success state */}
      <Card padding="md" className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-good-subtle flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-good" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-ink mb-1">Reward Redeemed!</h2>
          {confirm?.customer_name && (
            <p className="text-ink-sub text-sm">{confirm.customer_name}</p>
          )}
        </div>

        <p className="font-bold text-ink text-lg">
          {confirm?.reward_description}
        </p>

        <div className="rounded-[11px] bg-good-subtle px-4 py-3 text-sm text-good text-center font-medium">
          {confirm?.message}
        </div>

        {/* Carry-over info */}
        {(confirm?.carry_over ?? 0) > 0 && (
          <p className="text-xs text-ink-faint">
            Customer carries over {confirm!.carry_over} stamp{confirm!.carry_over !== 1 ? 's' : ''} to the new cycle.
          </p>
        )}
      </Card>

      {/* Next redemption */}
      <Button onClick={reset} fullWidth intent="secondary">
        <RotateCcw size={16} /> Redeem Another
      </Button>
    </div>
  );
}
