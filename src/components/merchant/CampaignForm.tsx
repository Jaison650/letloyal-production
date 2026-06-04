'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Stamp, IndianRupee, Pause, Play, X } from 'lucide-react';
import { clsx } from 'clsx';

export interface Campaign {
  id:                 string;
  name:               string;
  campaign_type:      'visit_based' | 'spend_based';
  status:             'active' | 'paused' | 'ended';
  reward_threshold:   number;
  reward_description: string;
  points_per_rupee:   number | null;
  created_at:         string;
}

interface CampaignFormProps {
  slug:     string;
  existing: Campaign | null;
}

export default function CampaignForm({ slug, existing }: CampaignFormProps) {
  const router = useRouter();
  const isEdit = !!existing;

  const [type,        setType]        = useState<'visit_based' | 'spend_based'>(
    existing?.campaign_type ?? 'visit_based',
  );
  const [name,        setName]        = useState(existing?.name ?? '');
  const [threshold,   setThreshold]   = useState(String(existing?.reward_threshold ?? 10));
  const [reward,      setReward]      = useState(existing?.reward_description ?? '');
  const [ppr,         setPpr]         = useState(String(existing?.points_per_rupee ?? ''));
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [statusBusy,  setStatusBusy]  = useState(false);

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      const body = {
        name,
        campaign_type:      type,
        reward_threshold:   Number(threshold),
        reward_description: reward,
        points_per_rupee:   type === 'spend_based' ? Number(ppr) : undefined,
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
      active: { label: 'Active',  cls: 'bg-green-100 text-green-700'  },
      paused: { label: 'Paused',  cls: 'bg-yellow-100 text-yellow-700' },
      ended:  { label: 'Ended',   cls: 'bg-gray-100 text-gray-500'    },
    }[existing.status];
    return (
      <span className={clsx('text-xs font-semibold px-2.5 py-1 rounded-full', cfg.cls)}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="max-w-xl space-y-6">

      {/* ── Existing campaign header ─────────────────────────────────── */}
      {isEdit && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-text-dark">Your Campaign</h2>
          <StatusBadge />
        </div>
      )}

      {/* ── Campaign type toggle (only for new campaigns) ────────────── */}
      {!isEdit && (
        <div>
          <p className="form-label mb-2">Campaign Type</p>
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
                    ? 'border-primary bg-primary-light/40 text-primary'
                    : 'border-border-light hover:border-primary/40 text-text-medium',
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
        <div className="flex items-center gap-3 p-4 rounded-xl bg-bg-muted border border-border-light">
          {type === 'visit_based'
            ? <Stamp size={20} className="text-primary" />
            : <IndianRupee size={20} className="text-primary" />}
          <div>
            <p className="text-sm font-semibold text-text-dark">
              {type === 'visit_based' ? 'Visit-Based' : 'Spend-Based'}
            </p>
            <p className="text-xs text-text-light">
              {type === 'visit_based' ? 'One stamp per visit' : 'Points earned per ₹ spent'}
            </p>
          </div>
        </div>
      )}

      {/* ── Campaign name ─────────────────────────────────────────────── */}
      <Input
        label="Campaign Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={type === 'visit_based' ? 'e.g. Loyalty Stamps' : 'e.g. Points Rewards'}
        maxLength={120}
      />

      {/* ── Reward threshold ─────────────────────────────────────────── */}
      <Input
        label={type === 'visit_based' ? 'Stamps to Earn Reward' : 'Points to Earn Reward'}
        type="number"
        value={threshold}
        onChange={(e) => setThreshold(e.target.value)}
        placeholder="10"
        min={1}
        hint={
          type === 'visit_based'
            ? 'Customer earns a reward after this many stamps'
            : 'Customer earns a reward after this many points'
        }
      />

      {/* ── Points per ₹ (spend-based only) ──────────────────────────── */}
      {type === 'spend_based' && (
        <Input
          label="Points per ₹"
          type="number"
          value={ppr}
          onChange={(e) => setPpr(e.target.value)}
          placeholder="0.1"
          step="0.01"
          min={0.01}
          hint="e.g. 0.1 = 1 point per ₹10 spent. Customer earns floor(₹ × rate) points."
          icon={<IndianRupee size={16} />}
        />
      )}

      {/* ── Reward description ───────────────────────────────────────── */}
      <div>
        <label className="form-label">Reward Description</label>
        <textarea
          value={reward}
          onChange={(e) => setReward(e.target.value)}
          placeholder={
            type === 'visit_based'
              ? 'e.g. Free coffee on your 10th visit!'
              : 'e.g. ₹100 off when you reach 500 points!'
          }
          maxLength={200}
          rows={2}
          className="form-input resize-none mt-1"
        />
        <p className="text-xs text-text-light mt-1">{reward.length}/200</p>
      </div>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error">
          {error}
        </div>
      )}

      {/* ── Save ─────────────────────────────────────────────────────── */}
      <Button onClick={handleSave} loading={saving} fullWidth>
        {isEdit ? 'Save Changes' : 'Launch Campaign'}
      </Button>

      {/* ── Status controls (edit only) ──────────────────────────────── */}
      {isEdit && existing.status !== 'ended' && (
        <div className="flex gap-3 pt-2 border-t border-border-light">
          {existing.status === 'active' ? (
            <Button
              variant="secondary"
              size="sm"
              loading={statusBusy}
              onClick={() => handleStatusChange('paused')}
              className="flex items-center gap-1.5"
            >
              <Pause size={14} /> Pause Campaign
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              loading={statusBusy}
              onClick={() => handleStatusChange('active')}
              className="flex items-center gap-1.5"
            >
              <Play size={14} /> Resume Campaign
            </Button>
          )}
          <Button
            variant="danger"
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
        <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-500 text-center">
          This campaign has ended. Create a new one to start earning again.
        </div>
      )}
    </div>
  );
}
