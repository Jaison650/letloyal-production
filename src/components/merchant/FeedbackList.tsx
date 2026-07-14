'use client';

import { useEffect, useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';

interface FeedbackItem {
  id:            string;
  message:       string;
  rating:        number | null;
  is_anonymous:  number;
  customer_name: string | null;
  phone_number:  string | null;
  created_at:    string;
}

interface FeedbackListProps {
  slug: string;
}

function StarDisplay({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={13}
          className={s <= rating ? 'fill-reward text-reward' : 'text-stroke'}
        />
      ))}
    </div>
  );
}

export default function FeedbackList({ slug }: FeedbackListProps) {
  const [items,    setItems]    = useState<FeedbackItem[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    fetch(`/api/merchant/${slug}/feedback`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setItems(d.feedback);
          setAvgRating(d.avg_rating);
        } else {
          setError(d.error || 'Failed to load feedback.');
        }
      })
      .catch(() => setError('Connection error.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-6 w-6 text-teal" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return <p className="text-bad text-sm text-center py-8">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare size={36} className="text-stroke mx-auto mb-3" />
        <p className="text-ink-sub font-semibold">No feedback yet</p>
        <p className="text-sm text-ink-faint mt-1">
          Feedback will appear here after customers submit reviews.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {avgRating !== null && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-teal-subtle/30 border border-teal/20">
          <div className="text-3xl font-extrabold text-teal">{avgRating.toFixed(1)}</div>
          <div>
            <StarDisplay rating={Math.round(avgRating)} />
            <p className="text-xs text-ink-sub mt-1">
              Average across {items.filter((i) => i.rating !== null).length} rated review
              {items.filter((i) => i.rating !== null).length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-bold text-ink">{items.length}</p>
            <p className="text-xs text-ink-faint">total</p>
          </div>
        </div>
      )}

      {/* Feedback cards */}
      {items.map((item) => {
        const isAnon      = item.is_anonymous === 1;
        const displayName = isAnon
          ? 'Anonymous'
          : item.customer_name ?? (item.phone_number ? `+91 ${item.phone_number}` : 'Customer');
        const date        = new Date(item.created_at).toLocaleDateString('en-IN', {
          day:   'numeric',
          month: 'short',
          year:  'numeric',
        });

        return (
          <div
            key={item.id}
            className="rounded-[16px] border border-stroke bg-surface-1 p-4 space-y-2"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={clsx('text-sm font-semibold', isAnon ? 'text-ink-faint italic' : 'text-ink')}>
                  {displayName}
                </p>
                <p className="text-xs text-ink-faint">{date}</p>
              </div>
              {item.rating !== null && <StarDisplay rating={item.rating} />}
            </div>

            {/* Message */}
            <p className="text-sm text-ink-sub leading-relaxed">{item.message}</p>
          </div>
        );
      })}
    </div>
  );
}
