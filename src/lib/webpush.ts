import webpush from 'web-push';
import { query } from '@/lib/db';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export type Segment = 'all' | 'near_milestone' | 'loyal' | 'one_time' | 'inactive';

interface PushSub { endpoint: string; p256dh: string; auth: string; }

// Returns JOIN + extra WHERE clause for a customer segment filter.
// Joins: push_subscriptions -> customers -> customer_merchant -> campaigns
// (India stores phone_number as raw digits, no leading '+', matching owner_id directly.)
function segmentSQL(segment: Segment): { join: string; where: string } {
  if (segment === 'all') return { join: '', where: '' };
  const join = `
    JOIN customers c ON c.phone_number = ps.owner_id
    JOIN customer_merchant cm ON cm.customer_id = c.id
    JOIN campaigns camp ON camp.id = cm.campaign_id AND camp.merchant_id = ps.merchant_id`;
  const where: Record<Exclude<Segment, 'all'>, string> = {
    near_milestone: 'AND cm.progress >= GREATEST(1, camp.reward_threshold - 2) AND cm.progress < camp.reward_threshold',
    loyal:          'AND cm.cycle_number >= 2',
    one_time:       'AND cm.progress = 1 AND cm.cycle_number = 1',
    inactive:       'AND cm.last_scan_at < NOW() - INTERVAL 21 DAY',
  };
  return { join, where: where[segment as Exclude<Segment, 'all'>] ?? '' };
}

async function sendToSubs(subs: PushSub[], payload: object) {
  const results = await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      )
    )
  );
  // Clean up expired subscriptions (410 Gone)
  const expired: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const status = (r.reason as { statusCode?: number })?.statusCode;
      if (status === 410 || status === 404) expired.push(subs[i].endpoint);
    }
  });
  if (expired.length > 0) {
    for (const ep of expired) {
      await query('DELETE FROM push_subscriptions WHERE endpoint = ?', [ep]);
    }
  }
  return results.filter(r => r.status === 'fulfilled').length;
}

export async function pushToMerchant(merchantId: string, title: string, body: string, url?: string) {
  const subs = await query<PushSub>(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions
      WHERE owner_type = 'merchant' AND owner_id = ?`,
    [merchantId],
  );
  if (!subs.length) return 0;
  return sendToSubs(subs, { title, body, url: url ?? '/', tag: 'merchant-alert' });
}

export async function pushBlastSegmented(
  merchantId: string,
  segment: Segment,
  title: string,
  body: string,
  url?: string,
): Promise<number> {
  const { join, where } = segmentSQL(segment);
  const subs = await query<PushSub>(
    `SELECT DISTINCT ps.endpoint, ps.p256dh, ps.auth
       FROM push_subscriptions ps${join}
      WHERE ps.owner_type = 'customer' AND ps.merchant_id = ?${where ? ' ' + where : ''}`,
    [merchantId],
  );
  if (!subs.length) return 0;
  return sendToSubs(subs, { title, body, url: url ?? '/', tag: 'merchant-blast' });
}

// Kept for backwards compat with any callers that send to all customers
export async function pushBlastToCustomers(merchantId: string, title: string, body: string, url?: string): Promise<number> {
  return pushBlastSegmented(merchantId, 'all', title, body, url);
}

export async function countSegmentSubs(merchantId: string, segment: Segment = 'all'): Promise<number> {
  const { join, where } = segmentSQL(segment);
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(DISTINCT ps.id) AS cnt
       FROM push_subscriptions ps${join}
      WHERE ps.owner_type = 'customer' AND ps.merchant_id = ?${where ? ' ' + where : ''}`,
    [merchantId],
  );
  return Number(rows[0]?.cnt ?? 0);
}

// Kept for backwards compat
export async function countCustomerSubs(merchantId: string): Promise<number> {
  return countSegmentSubs(merchantId, 'all');
}

/** Push to a single customer who opted in while scanning a specific merchant. */
export async function pushToCustomer(
  phone: string,
  merchantId: string,
  title: string,
  body: string,
  url?: string,
): Promise<number> {
  const subs = await query<PushSub>(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions
      WHERE owner_type = 'customer' AND owner_id = ? AND merchant_id = ?`,
    [phone, merchantId],
  );
  if (!subs.length) return 0;
  return sendToSubs(subs, { title, body, url: url ?? '/', tag: 'milestone-alert' });
}
