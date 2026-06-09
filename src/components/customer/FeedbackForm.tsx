'use client';

import { useState } from 'react';
import { Star, EyeOff, X } from 'lucide-react';
import { clsx } from 'clsx';

interface FeedbackFormProps {
  merchantId:  string;
  phoneNumber: string;        // already entered phone — pre-fill for non-anon
  onDismiss:   () => void;
}

export default function FeedbackForm({ merchantId, phoneNumber, onDismiss }: FeedbackFormProps) {
  const [rating,      setRating]      = useState<number | null>(null);
  const [hovered,     setHovered]     = useState<number | null>(null);
  const [message,     setMessage]     = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState('');

  async function handleSubmit() {
    if (!message.trim()) { setError('Please write a short message.'); return; }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          merchant_id:  merchantId,
          phone_number: isAnonymous ? undefined : phoneNumber,
          message:      message.trim(),
          rating:       rating ?? null,
          is_anonymous: isAnonymous,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Submission failed.');
        return;
      }

      setDone(true);
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Thank you state ────────────────────────────────────────────────
  if (done) {
    return (
      <div className="rounded-2xl border border-border-light bg-white px-5 py-6 text-center space-y-2">
        <p className="text-2xl">🙏</p>
        <p className="font-bold text-text-dark">Thanks for your feedback!</p>
        <p className="text-xs text-text-light">It helps us improve.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-light bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
        <p className="font-bold text-text-dark text-sm">Leave a quick review</p>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-bg-muted text-text-light hover:text-text-dark transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Star rating */}
        <div>
          <p className="text-xs font-medium text-text-medium mb-2">
            How was your experience? <span className="text-text-light">(optional)</span>
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? null : star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(null)}
                className="transition-transform hover:scale-110 active:scale-95"
                aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              >
                <Star
                  size={28}
                  className={clsx(
                    'transition-colors',
                    (hovered ?? rating ?? 0) >= star
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-border-light',
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you thought…"
            rows={3}
            maxLength={500}
            className="form-input resize-none w-full"
          />
          <p className="text-xs text-text-light text-right mt-1">{message.length}/500</p>
        </div>

        {/* Anonymous checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-brand-border text-primary focus:ring-primary cursor-pointer flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <EyeOff size={13} className={clsx('transition-colors', isAnonymous ? 'text-primary' : 'text-text-light')} />
              <span className={clsx('text-sm font-medium transition-colors', isAnonymous ? 'text-primary' : 'text-text-medium group-hover:text-text-dark')}>
                Submit anonymously
              </span>
            </div>
            <p className="text-xs text-text-light mt-0.5">
              {isAnonymous
                ? 'Your name and phone number will not be shared with the merchant.'
                : 'Your name will be visible to the merchant.'}
            </p>
          </div>
        </label>

        {/* Error */}
        {error && (
          <p className="text-xs text-status-error">{error}</p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !message.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed text-sm py-2.5"
        >
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
}
