import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { query } from '@/lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    requireAdmin(req);
    const { id } = await params;
    const body = await req.json();
    const updates: string[] = [];
    const values: unknown[] = [];
    if (body.plan !== undefined)         { updates.push('plan = ?');         values.push(body.plan); }
    if (body.status !== undefined)       { updates.push('status = ?');       values.push(body.status); }
    if (body.billing_note !== undefined) { updates.push('billing_note = ?'); values.push(body.billing_note); }
    if (!updates.length) return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    values.push(id);
    await query(`UPDATE merchants SET ${updates.join(', ')} WHERE id = ?`, values as string[]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Failed.' }, { status: 500 });
  }
}
