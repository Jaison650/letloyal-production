import webpush from 'web-push';
import { query } from '@/lib/db';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

interface PushSub { endpoint: string; p256dh: string; auth: string; }

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

export async function pushBlastToCustomers(merchantId: string, title: string, body: string, url?: string): Promise<number> {
  const subs = await query<PushSub>(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions
      WHERE owner_type = 'customer' AND merchant_id = ?`,
    [merchantId],
  );
  if (!subs.length) return 0;
  return sendToSubs(subs, { title, body, url: url ?? '/', tag: 'merchant-blast' });
}

export async function countCustomerSubs(merchantId: string): Promise<number> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM push_subscriptions
      WHERE owner_type = 'customer' AND merchant_id = ?`,
    [merchantId],
  );
  return Number(rows[0]?.cnt ?? 0);
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
