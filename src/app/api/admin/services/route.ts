import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const [merchantCount, customerCount, visitCount] = await Promise.all([
      queryOne<{ c: number }>('SELECT COUNT(*) as c FROM merchants WHERE status = "active"'),
      queryOne<{ c: number }>('SELECT COUNT(*) as c FROM customers'),
      queryOne<{ c: number }>('SELECT COUNT(*) as c FROM visits'),
    ]);
    return NextResponse.json({
      ok: true,
      db: {
        merchants: merchantCount?.c ?? 0,
        customers: customerCount?.c ?? 0,
        visits:    visitCount?.c    ?? 0,
      },
      services: {
        smtp:         !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
        r2:           !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID),
        webpush:      !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        google_oauth: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      uptime: process.uptime(),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
