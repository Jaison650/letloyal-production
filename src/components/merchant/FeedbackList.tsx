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
          className={s <= rating ? 'fill-amber-400 text-amber-400' : 'text-border-light'}
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
        <svg className="animate-spin h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error) {
    return <p className="text-status-error text-sm text-center py-8">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare size={36} className="text-border-light mx-auto mb-3" />
        <p className="text-text-medium font-semibold">No feedback yet</p>
        <p className="text-sm text-text-light mt-1">
          Feedback will appear here after customers submit reviews.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      {avgRating !== null && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary-light/30 border border-primary/20">
          <div className="text-3xl font-extrabold text-primary">{avgRating.toFixed(1)}</div>
          <div>
            <StarDisplay rating={Math.round(avgRating)} />
            <p className="text-xs text-text-medium mt-1">
              Average across {items.filter((i) => i.rating !== null).length} rated review
              {items.filter((i) => i.rating !== null).length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-bold text-text-dark">{items.length}</p>
            <p className="text-xs text-text-light">total</p>
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
            className="rounded-2xl border border-border-light bg-white p-4 space-y-2"
          >
            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={clsx('text-sm font-semibold', isAnon ? 'text-text-light italic' : 'text-text-dark')}>
                  {displayName}
                </p>
                <p className="text-xs text-text-light">{date}</p>
              </div>
              {item.rating !== null && <StarDisplay rating={item.rating} />}
            </div>

            {/* Message */}
            <p className="text-sm text-text-medium leading-relaxed">{item.message}</p>
          </div>
        );
      })}
    </div>
  );
}
