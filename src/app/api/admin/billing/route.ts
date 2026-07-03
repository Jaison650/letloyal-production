import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    const merchants = await query<{
      id: string;
      business_name: string;
      email: string;
      plan: string;
      status: string;
      billing_note: string | null;
      created_at: string;
    }>(
      'SELECT id, business_name, email, plan, status, billing_note, created_at FROM merchants ORDER BY created_at DESC',
    );
    return NextResponse.json({ ok: true, merchants });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
