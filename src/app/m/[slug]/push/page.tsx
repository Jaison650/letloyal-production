'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { Bell, Users, Send, Clock, Star, Target, UserPlus, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import InfoTooltip from '@/components/ui/InfoTooltip';

type Segment = 'all' | 'near_milestone' | 'loyal' | 'one_time' | 'inactive';

interface Blast {
  id:              string;
  title:           string;
  body:            string;
  recipient_count: number;
  sent_at:         string;
}

const TITLE_MAX = 80;
const BODY_MAX  = 200;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
}

const TITLE_SUGGESTIONS = [
  'Special offer this weekend! 🎉',
  'We miss you! 😊',
  'Your reward is ready! 🎁',
  'New arrivals just for you ✨',
];

const BODY_SUGGESTIONS = [
  'Show this notification for a free coffee!',
  'Visit us today and earn your stamp!',
  "You're close to your reward — visit us now!",
  'Exclusive deal for our loyal customers only.',
];

function SuggestionChips({ items, onSelect }: {
  items: string[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(v => !v)}
        className="mt-1.5 text-xs text-primary font-medium hover:text-primary/70 transition-colors">
        Suggest a message
      </button>
      {open && (
        <div className="flex flex-wrap gap-2 mt-2 p-3 rounded-xl bg-primary-light/30 border border-primary/10">
          {items.map(item => (
            <button key={item} type="button"
              onClick={() => { onSelect(item); setOpen(false); }}
              className="px-3 py-1.5 rounded-full bg-white border border-primary/20 text-primary text-xs font-medium hover:bg-primary hover:text-white transition-colors shadow-sm">
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const SEGMENT_LABELS: Record<Segment, string> = {
  all:            'Everyone',
  near_milestone: 'Near reward',
  loyal:          'Loyal (2nd+ round)',
  one_time:       'One-time visitors',
  inactive:       'Inactive 21+ days',
};

const SEGMENT_DESCRIPTIONS: Record<Segment, string> = {
  all:            'All opted-in customers',
  near_milestone: '1–2 visits from unlocking a reward',
  loyal:          'Already redeemed once, still coming back',
  one_time:       'Visited exactly once, never returned',
  inactive:       "Haven't scanned in 21+ days",
};

interface SegmentCard { id: Segment; icon: React.ReactNode; }

const SEGMENT_CARDS: SegmentCard[] = [
  { id: 'all',            icon: <Bell size={16} /> },
  { id: 'near_milestone', icon: <Target size={16} /> },
  { id: 'loyal',          icon: <Star size={16} /> },
  { id: 'one_time',       icon: <UserPlus size={16} /> },
  { id: 'inactive',       icon: <Moon size={16} /> },
];

export default function MerchantPushPage() {
  const params = useParams<{ slug: string }>();
  const slug   = params.slug;

  const [subCount,    setSubCount]    = useState<number | null>(null);
  const [blastsUsed,  setBlastsUsed]  = useState(0);
  const [blastLimit,  setBlastLimit]  = useState(4);
  const [blasts,      setBlasts]      = useState<Blast[]>([]);
  const [loading,     setLoading]     = useState(true);

  const [segment,      setSegment]      = useState<Segment>('all');
  const [segmentCount, setSegmentCount] = useState<number | null>(null);
  const [segLoading,   setSegLoading]   = useState(false);

  const [title,     setTitle]     = useState('');
  const [body,      setBody]      = useState('');
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  function load() {
    setLoading(true);
    fetch(`/api/merchant/${slug}/push`)
      .then(r => r.json())
      .then(d => {
        setSubCount(d.subscriber_count ?? 0);
        setBlasts(d.blasts ?? []);
        setBlastsUsed(d.blasts_used ?? 0);
        setBlastLimit(d.blast_limit ?? 4);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(load, [slug]);

  useEffect(() => {
    if (!slug) return;
    setSegLoading(true);
    fetch(`/api/merchant/${slug}/push?segment=${segment}`)
      .then(r => r.json())
      .then(d => setSegmentCount(d.segment_count ?? 0))
      .catch(() => {})
      .finally(() => setSegLoading(false));
  }, [slug, segment]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setSent(null);
    if (!title.trim()) { setFormError('Please enter a title.'); return; }
    if (!body.trim())  { setFormError('Please enter a message.'); return; }

    setSending(true);
    try {
      const res  = await fetch(`/api/merchant/${slug}/push`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title: title.trim(), body: body.trim(), segment }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Failed to send. Please try again.'); return; }
      setSent(data.sent ?? 0);
      setTitle('');
      setBody('');
      load();
    } catch {
      setFormError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const limitReached = blastsUsed >= blastLimit;
  const noReach       = !segLoading && (segmentCount ?? 0) === 0;

  return (
    <div className="max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
          <Bell size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-dark">Push Notifications</h1>
          <p className="text-sm text-text-light">Send a message to customers who&apos;ve opted in.</p>
        </div>
      </div>

      {/* Subscriber count card */}
      <div className="card flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
          <Users size={22} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">Subscribers</p>
          <p className="text-3xl font-extrabold text-text-dark mt-0.5">
            {loading ? '—' : (subCount ?? 0)}
          </p>
        </div>
        <div className="text-right min-w-0 max-w-full basis-full sm:basis-auto sm:max-w-[140px]">
          <p className="text-xs text-text-medium">{blastsUsed}/{blastLimit} sent this month</p>
          <p className="text-xs text-text-light mt-0.5">Resets on a rolling 30-day window</p>
        </div>
      </div>

      {!loading && (subCount ?? 0) === 0 && (
        <div className="card text-center py-6 text-text-medium">
          <Bell size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No subscribers yet — customers opt in from their rewards page.</p>
        </div>
      )}

      {!loading && (
        <form onSubmit={handleSend} className="card space-y-5">
          <p className="font-semibold text-text-dark">Send a notification</p>

          {limitReached && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
              Monthly limit reached — available again as older sends roll off.
            </div>
          )}

          {/* Audience segment selector */}
          <div>
            <label className="text-xs font-semibold text-text-medium uppercase tracking-wide mb-3 block">
              Send to
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SEGMENT_CARDS.map(({ id, icon }) => {
                const active = segment === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={limitReached}
                    onClick={() => { setSegment(id); setSent(null); setFormError(''); }}
                    className={clsx(
                      'flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all disabled:opacity-40',
                      active ? 'border-primary bg-primary-light/50 text-primary' : 'border-border-light hover:border-primary/40 text-text-medium',
                    )}
                  >
                    <span className={clsx(
                      'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                      active ? 'bg-primary text-white' : 'bg-bg-muted text-text-light',
                    )}>
                      {icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-tight">{SEGMENT_LABELS[id]}</p>
                      <p className={clsx('text-[10px] mt-0.5 leading-tight', active ? 'opacity-80' : 'text-text-light')}>
                        {SEGMENT_DESCRIPTIONS[id]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-text-light mt-2">
              {segLoading ? '…' : `Estimated reach: ${segmentCount ?? 0} customer${segmentCount === 1 ? '' : 's'}`}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <label className="text-xs font-medium text-text-medium">Title</label>
                <InfoTooltip text="Shown as the notification headline, prefixed with your business name." />
              </div>
              <span className="text-xs text-text-light">{title.length}/{TITLE_MAX}</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value.slice(0, TITLE_MAX))}
              placeholder="e.g. Weekend special!"
              disabled={limitReached}
              className="form-input"
            />
            <SuggestionChips items={TITLE_SUGGESTIONS} onSelect={v => setTitle(v.slice(0, TITLE_MAX))} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center">
                <label className="text-xs font-medium text-text-medium">Message</label>
                <InfoTooltip text="The main body text of the notification." />
              </div>
              <span className="text-xs text-text-light">{body.length}/{BODY_MAX}</span>
            </div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value.slice(0, BODY_MAX))}
              placeholder="e.g. Visit us today and earn your stamp!"
              disabled={limitReached}
              rows={3}
              className="form-input resize-none"
            />
            <SuggestionChips items={BODY_SUGGESTIONS} onSelect={v => setBody(v.slice(0, BODY_MAX))} />
          </div>

          {formError && <p className="text-xs text-status-error">{formError}</p>}
          {sent !== null && (
            <p className="text-xs text-green-600 font-medium">Sent to {sent} customer{sent === 1 ? '' : 's'}.</p>
          )}

          <button
            type="submit"
            disabled={sending || limitReached || noReach}
            className="btn-primary w-full flex items-center justify-center gap-2 font-bold rounded-full px-8 py-3 transition-all disabled:opacity-50 text-base"
          >
            <Send size={15} />
            {sending ? 'Sending…' : 'Send Notification'}
          </button>
        </form>
      )}

      {/* Recent blasts */}
      {!loading && blasts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-medium uppercase tracking-wide">Recently sent</p>
          {blasts.map(b => (
            <div key={b.id} className="card space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-text-dark text-sm truncate">{b.title}</p>
                <span className="flex items-center gap-1 text-xs text-text-light flex-shrink-0 mt-0.5">
                  <Clock size={11} /> {timeAgo(b.sent_at)}
                </span>
              </div>
              <p className="text-xs text-text-medium">{b.body}</p>
              <p className="text-xs text-text-light">Sent to {b.recipient_count} customer{b.recipient_count === 1 ? '' : 's'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
