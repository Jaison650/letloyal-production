'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Badge, Input, Textarea } from '@/components/ds';
import { Stamp, IndianRupee, Pause, Play, X, Flame } from 'lucide-react';
import { clsx } from 'clsx';

export interface Campaign {
  id:                   string;
  name:                 string;
  campaign_type:        'visit_based' | 'spend_based';
  status:               'active' | 'paused' | 'ended';
  reward_threshold:     number;
  reward_description:   string;
  points_per_rupee:     number | null;
  streak_enabled:       number;   // 0 | 1
  streak_period:        'day' | 'week' | 'month';
  streak_days:          number;
  streak_multiplier:    number;
  created_at:           string;
}

interface CampaignFormProps {
  slug:     string;
  existing: Campaign | null;
}

export default function CampaignForm({ slug, existing }: CampaignFormProps) {
  const router = useRouter();
  const isEdit = !!existing;

  const [type,            setType]            = useState<'visit_based' | 'spend_based'>(
    existing?.campaign_type ?? 'visit_based',
  );
  const [name,            setName]            = useState(existing?.name ?? '');
  const [threshold,       setThreshold]       = useState(String(existing?.reward_threshold ?? 10));
  const [reward,          setReward]          = useState(existing?.reward_description ?? '');
  const [ppr,             setPpr]             = useState(String(existing?.points_per_rupee ?? ''));
  const [streakEnabled,   setStreakEnabled]   = useState(Boolean(existing?.streak_enabled));
  const [streakPeriod,    setStreakPeriod]    = useState<'day'|'week'|'month'>(existing?.streak_period ?? 'day');
  const [streakDays,      setStreakDays]      = useState(String(existing?.streak_days ?? 3));
  const [streakMultiplier,setStreakMultiplier]= useState(String(existing?.streak_multiplier ?? 2.0));
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');
  const [statusBusy,      setStatusBusy]      = useState(false);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const body = {
        name,
        campaign_type:        type,
        reward_threshold:     Number(threshold),
        reward_description:   reward,
        points_per_rupee:     type === 'spend_based' ? Number(ppr) : undefined,
        streak_enabled:    streakEnabled,
        streak_period:     streakPeriod,
        streak_days:       Number(streakDays),
        streak_multiplier: Number(streakMultiplier),
      };

      const res = await fetch(`/api/merchant/${slug}/campaign`, {
        method:  isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed.'); return; }

      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: 'active' | 'paused' | 'ended') {
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/campaign`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Status change failed.');
        return;
      }
      router.refresh();
    } catch {
      setError('Something went wrong.');
    } finally {
      setStatusBusy(false);
    }
  }

  // ── Status badge ──────────────────────────────────────────────────────
  const StatusBadge = () => {
    if (!existing) return null;
    const cfg = {
      active: { label: 'Active',  intent: 'success' as const },
      paused: { label: 'Paused',  intent: 'warning' as const },
      ended:  { label: 'Ended',   intent: 'neutral' as const },
    }[existing.status];
    return <Badge intent={cfg.intent}>{cfg.label}</Badge>;
  };

  return (
    <div className="max-w-xl space-y-6">

      {/* ── Existing campaign header ─────────────────────────────────── */}
      {isEdit && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Your Campaign</h2>
          <StatusBadge />
        </div>
      )}

      {/* ── Campaign type toggle (only for new campaigns) ────────────── */}
      {!isEdit && (
        <div>
          <p className="text-body-sm font-semibold text-ink mb-2">Campaign Type</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { id: 'visit_based', icon: <Stamp size={20} />, label: 'Visit-Based', desc: 'A stamp per visit' },
              { id: 'spend_based', icon: <IndianRupee size={20} />, label: 'Spend-Based', desc: 'Points per ₹ spent' },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setType(opt.id)}
                className={clsx(
                  'flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all',
                  type === opt.id
                    ? 'border-teal bg-teal-subtle text-teal'
                    : 'border-stroke hover:border-teal/40 text-ink-sub',
                )}
              >
                {opt.icon}
                <span className="font-semibold text-sm">{opt.label}</span>
                <span className="text-xs opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Edit: show type as read-only ─────────────────────────────── */}
      {isEdit && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-surface-2 border border-stroke">
          {type === 'visit_based'
            ? <Stamp size={20} className="text-teal" />
            : <IndianRupee size={20} className="text-teal" />}
          <div>
            <p className="text-sm font-semibold text-ink">
              {type === 'visit_based' ? 'Visit-Based' : 'Spend-Based'}
            </p>
            <p className="text-xs text-ink-faint">
              {type === 'visit_based' ? 'One stamp per visit' : 'Points earned per ₹ spent'}
            </p>
          </div>
        </div>
      )}

      {/* ── Campaign name ─────────────────────────────────────────────── */}
      <div>
        <label className="block text-body-sm font-semibold text-ink mb-1.5">Campaign Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === 'visit_based' ? 'e.g. Loyalty Stamps' : 'e.g. Points Rewards'}
          maxLength={120}
        />
      </div>

      {/* ── Reward threshold ─────────────────────────────────────────── */}
      <div>
        <label className="block text-body-sm font-semibold text-ink mb-1.5">
          {type === 'visit_based' ? 'Stamps to Earn Reward' : 'Points to Earn Reward'}
        </label>
        <Input
          type="number"
          value={threshold}
          onChange={(e) => setThreshold(e.target.value)}
          placeholder="10"
          min={1}
        />
        <p className="mt-1.5 text-xs text-ink-faint">
          {type === 'visit_based'
            ? 'Customer earns a reward after this many stamps'
            : 'Customer earns a reward after this many points'}
        </p>
      </div>

      {/* ── Points per ₹ (spend-based only) ──────────────────────────── */}
      {type === 'spend_based' && (
        <div>
          <label className="block text-body-sm font-semibold text-ink mb-1.5">Points per ₹</label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
              <IndianRupee size={16} />
            </div>
            <Input
              type="number"
              value={ppr}
              onChange={(e) => setPpr(e.target.value)}
              placeholder="0.1"
              step="0.01"
              min={0.01}
              className="pl-9"
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-faint">
            e.g. 0.1 = 1 point per ₹10 spent. Customer earns floor(₹ × rate) points.
          </p>
        </div>
      )}

      {/* ── Reward description ───────────────────────────────────────── */}
      <div>
        <label className="block text-body-sm font-semibold text-ink mb-1.5">Reward Description</label>
        <Textarea
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          placeholder={
            type === 'visit_based'
              ? 'e.g. Free coffee on your 10th visit!'
              : 'e.g. ₹100 off when you reach 500 points!'
          }
          maxLength={200}
          rows={2}
          className="resize-none mt-1 min-h-0"
        />
        <p className="text-xs text-ink-faint mt-1">{reward.length}/200</p>
      </div>

      {/* ── Streak Bonus ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-stroke overflow-hidden">
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setStreakEnabled(!streakEnabled)}
          className="w-full flex items-center justify-between px-4 py-3.5 bg-surface-2 hover:bg-surface-2/80 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Flame size={18} className={streakEnabled ? 'text-reward' : 'text-ink-faint'} />
            <div className="text-left">
              <p className="text-sm font-semibold text-ink">Streak Bonus</p>
              <p className="text-xs text-ink-faint">Reward customers who visit on consecutive days</p>
            </div>
          </div>
          {/* Toggle pill */}
          <div className={clsx(
            'w-10 h-6 rounded-full transition-colors flex-shrink-0 relative',
            streakEnabled ? 'bg-teal' : 'bg-stroke-strong',
          )}>
            <span className={clsx(
              'absolute top-1 w-4 h-4 rounded-full bg-surface-1 shadow transition-transform',
              streakEnabled ? 'translate-x-5' : 'translate-x-1',
            )} />
          </div>
        </button>

        {/* Streak config — only shown when enabled */}
        {streakEnabled && (
          <div className="px-4 py-4 space-y-4 border-t border-stroke bg-surface-1">

            {/* Streak period */}
            <div>
              <p className="text-body-sm font-semibold text-ink mb-2">Streak Period</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'day',   label: 'Daily',   desc: 'Visit every day'    },
                  { value: 'week',  label: 'Weekly',  desc: 'Visit every week'   },
                  { value: 'month', label: 'Monthly', desc: 'Visit every month'  },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStreakPeriod(opt.value)}
                    className={clsx(
                      'flex flex-col items-start gap-0.5 p-3 rounded-xl border-2 text-left transition-all',
                      streakPeriod === opt.value
                        ? 'border-teal bg-teal-subtle'
                        : 'border-stroke hover:border-teal/40',
                    )}
                  >
                    <span className={clsx('text-sm font-semibold', streakPeriod === opt.value ? 'text-teal' : 'text-ink')}>
                      {opt.label}
                    </span>
                    <span className="text-xs text-ink-faint">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Consecutive periods target */}
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">
                {`Consecutive ${streakPeriod === 'day' ? 'Days' : streakPeriod === 'week' ? 'Weeks' : 'Months'} Needed`}
              </label>
              <Input
                type="number"
                value={streakDays}
                onChange={(e) => setStreakDays(e.target.value)}
                placeholder="3"
                min={2}
                max={streakPeriod === 'day' ? 30 : streakPeriod === 'week' ? 12 : 6}
              />
              <p className="mt-1.5 text-xs text-ink-faint">
                {`Customer earns the bonus after this many consecutive ${streakPeriod}s`}
              </p>
            </div>

            {/* Multiplier */}
            <div>
              <label className="block text-body-sm font-semibold text-ink mb-1.5">Points Multiplier</label>
              <Input
                type="number"
                value={streakMultiplier}
                onChange={(e) => setStreakMultiplier(e.target.value)}
                placeholder="2"
                step="0.5"
                min={1.5}
                max={10}
              />
              <p className="mt-1.5 text-xs text-ink-faint">
                {type === 'visit_based'
                  ? `e.g. 2 = counts as 2 visits on the bonus ${streakPeriod} (rounded up)`
                  : `e.g. 2 = double points on the bonus ${streakPeriod}`}
              </p>
            </div>

            {/* Live preview */}
            <div className="rounded-[11px] bg-reward-subtle border border-reward/40 px-3 py-2.5 text-xs text-reward-deep">
              🔥 After <strong>{streakDays || '?'} consecutive {streakPeriod}{Number(streakDays) !== 1 ? 's' : ''}</strong>,
              customer earns <strong>{streakMultiplier || '?'}× points</strong> on that {streakPeriod}
            </div>

          </div>
        )}
      </div>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-[11px] bg-bad-subtle px-4 py-3 text-sm text-bad">
          {error}
        </div>
      )}

      {/* ── Save ─────────────────────────────────────────────────────── */}
      <Button onClick={handleSave} loading={saving} fullWidth>
        {isEdit ? 'Save Changes' : 'Launch Campaign'}
      </Button>

      {/* ── Status controls (edit only) ──────────────────────────────── */}
      {isEdit && existing.status !== 'ended' && (
        <div className="flex gap-3 pt-2 border-t border-stroke">
          {existing.status === 'active' ? (
            <Button
              intent="secondary"
              size="sm"
              loading={statusBusy}
              onClick={() => handleStatusChange('paused')}
              className="flex items-center gap-1.5"
            >
              <Pause size={14} /> Pause Campaign
            </Button>
          ) : (
            <Button
              intent="secondary"
              size="sm"
              loading={statusBusy}
              onClick={() => handleStatusChange('active')}
              className="flex items-center gap-1.5"
            >
              <Play size={14} /> Resume Campaign
            </Button>
          )}
          <Button
            intent="destructive"
            size="sm"
            loading={statusBusy}
            onClick={() => {
              if (confirm('End this campaign? This cannot be undone. Existing customer progress is kept.')) {
                handleStatusChange('ended');
              }
            }}
            className="flex items-center gap-1.5"
          >
            <X size={14} /> End Campaign
          </Button>
        </div>
      )}

      {/* ── Ended state ──────────────────────────────────────────────── */}
      {isEdit && existing.status === 'ended' && (
        <div className="rounded-[11px] bg-surface-2 px-4 py-3 text-sm text-ink-faint text-center">
          This campaign has ended. Create a new one to start earning again.
        </div>
      )}
    </div>
  );
}
