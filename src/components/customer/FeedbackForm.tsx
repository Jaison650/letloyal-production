'use client';

import { useState } from 'react';
import { Star, EyeOff, X } from 'lucide-react';
import { clsx } from 'clsx';

interface FeedbackFormProps {
  merchantId:      string;
  phoneNumber:     string;        // already entered phone — pre-fill for non-anon
  googleReviewUrl?: string;       // if set, shown after internal feedback is submitted
  onDismiss:       () => void;
}

export default function FeedbackForm({ merchantId, phoneNumber, googleReviewUrl, onDismiss }: FeedbackFormProps) {
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
      <div className="space-y-3">
        <div className="rounded-[16px] border border-stroke bg-surface-1 px-5 py-5 text-center space-y-1.5">
          <p className="text-2xl">🙏</p>
          <p className="font-bold text-ink">Thanks for sharing!</p>
          <p className="text-xs text-ink-faint">Your thoughts help make every visit better.</p>
        </div>
        {googleReviewUrl && (
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 w-full rounded-[16px] border border-stroke bg-surface-1 px-5 py-3.5 shadow-ds hover:shadow-lg transition-shadow"
          >
            {/* Google G logo */}
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            <div className="text-left">
              <p className="text-sm font-semibold text-ink leading-tight">Loved your visit?</p>
              <p className="text-xs text-ink-sub">Leave us a Google Review ↗</p>
            </div>
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-stroke bg-surface-1 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-stroke">
        <p className="font-bold text-ink text-sm">How was your visit?</p>
        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-lg hover:bg-surface-2 text-ink-faint hover:text-ink transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Star rating */}
        <div>
          <p className="text-xs font-medium text-ink-sub mb-2">
            How was your experience? <span className="text-ink-faint">(optional)</span>
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
                      ? 'fill-reward text-reward'
                      : 'text-stroke-strong',
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
            className="w-full rounded-[11px] border-[1.5px] border-stroke-strong bg-surface-1 text-ink placeholder:text-ink-faint px-4 py-3 resize-none focus:outline-none focus:border-teal focus:shadow-ring"
          />
          <p className="text-xs text-ink-faint text-right mt-1">{message.length}/500</p>
        </div>

        {/* Anonymous checkbox */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stroke-strong text-teal focus:ring-teal cursor-pointer flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <EyeOff size={13} className={clsx('transition-colors', isAnonymous ? 'text-teal' : 'text-ink-faint')} />
              <span className={clsx('text-sm font-medium transition-colors', isAnonymous ? 'text-teal' : 'text-ink-sub group-hover:text-ink')}>
                Submit anonymously
              </span>
            </div>
            <p className="text-xs text-ink-faint mt-0.5">
              {isAnonymous
                ? 'Your name and phone number will not be shared with the merchant.'
                : 'Your name will be visible to the merchant.'}
            </p>
          </div>
        </label>

        {/* Error */}
        {error && (
          <p className="text-xs text-bad">{error}</p>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !message.trim()}
          className="w-full rounded-full bg-teal text-teal-fg font-bold text-sm py-3 hover:bg-teal-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {submitting ? 'Submitting…' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
}
