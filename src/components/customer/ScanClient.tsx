'use client';

import { useState, FormEvent } from 'react';
import MilestoneCard from '@/components/customer/MilestoneCard';
import FeedbackForm from '@/components/customer/FeedbackForm';
import { Phone, User } from 'lucide-react';

interface ScanResult {
  ok:                 boolean;
  business_name:      string;
  progress:           number;
  threshold:          number;
  reward_unlocked:    boolean;
  reward_description: string;
  points_added:       number;
  is_first_visit:     boolean;
  campaign_type:      'visit_based' | 'spend_based';
}

interface ScanClientProps {
  token:        string;
  merchantId:   string;
  businessName: string;
  campaignType: 'visit_based' | 'spend_based';
}

export default function ScanClient({ token, merchantId, businessName, campaignType }: ScanClientProps) {
  const [phone,        setPhone]        = useState('');
  const [name,         setName]         = useState('');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [result,       setResult]       = useState<ScanResult | null>(null);
  const [showName,     setShowName]     = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    // Basic client-side check
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = { token, phone_number: digits };
      if (name.trim()) body.name = name.trim();

      const res  = await fetch('/api/scan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        // Show name field on first visit if not yet shown
        if (data.is_first_visit) setShowName(true);
        return;
      }

      setResult(data);
      if (data.is_first_visit) setShowName(true);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success: show milestone card ──────────────────────────────────────
  if (result) {
    return (
      <div className="space-y-4">
        <MilestoneCard
          businessName={result.business_name || businessName}
          progress={result.progress}
          threshold={result.threshold}
          rewardDescription={result.reward_description}
          rewardUnlocked={result.reward_unlocked}
          pointsAdded={result.points_added}
          campaignType={result.campaign_type}
        />

        {/* Come back prompt */}
        {!result.reward_unlocked && (
          <p className="text-center text-xs text-text-light pt-2">
            Come back again to keep earning{' '}
            {campaignType === 'visit_based' ? 'stamps' : 'points'}!
          </p>
        )}

        {/* Feedback form — dismissible */}
        {showFeedback && (
          <FeedbackForm
            merchantId={merchantId}
            phoneNumber={phone}
            onDismiss={() => setShowFeedback(false)}
          />
        )}
      </div>
    );
  }

  // ── Phone entry form ──────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-text-dark mb-1">Enter your mobile number</h2>
        <p className="text-sm text-text-medium">
          We&apos;ll use this to track your loyalty points.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Phone input */}
        <div>
          <label className="form-label">Mobile Number</label>
          <div className="flex gap-2">
            {/* +91 prefix */}
            <div className="flex items-center justify-center px-3 rounded-xl border border-border-light bg-bg-muted text-text-medium font-medium text-sm flex-shrink-0">
              🇮🇳 +91
            </div>
            <div className="relative flex-1">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                placeholder="98765 43210"
                className="form-input pl-9"
                inputMode="numeric"
                autoComplete="tel-national"
                autoFocus
                required
              />
            </div>
          </div>
        </div>

        {/* Name field — shown on first visit or if result marks first visit */}
        {showName && (
          <div>
            <label className="form-label">
              Your Name <span className="text-text-light font-normal">(optional)</span>
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-light" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="form-input pl-9"
                autoComplete="name"
                maxLength={120}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-status-error font-medium">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || phone.replace(/\D/g, '').length !== 10}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking…
            </span>
          ) : (
            'Claim My Stamp'
          )}
        </button>
      </form>
    </div>
  );
}
