import { NextRequest, NextResponse } from 'next/server';
import { getMerchantAuthFromRequest } from '@/lib/auth';
import { uploadToR2, generateKey, MEDIA_BUCKET } from '@/lib/r2';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_LOGO_SIZE_MB,
  MAX_BANNER_SIZE_MB,
} from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────
    const auth = getMerchantAuthFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    // ── Parse multipart form ──────────────────────────────────────────
    const formData = await req.formData();
    const file     = formData.get('file') as File | null;
    const folder   = (formData.get('folder') as string | null) ?? 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    // ── Validate file type ────────────────────────────────────────────
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: JPEG, PNG, WebP.' },
        { status: 400 },
      );
    }

    // ── Validate file size ────────────────────────────────────────────
    const maxMb    = folder === 'banners' ? MAX_BANNER_SIZE_MB : MAX_LOGO_SIZE_MB;
    const maxBytes = maxMb * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Maximum ${maxMb}MB allowed.` },
        { status: 400 },
      );
    }

    // ── Upload to R2 ──────────────────────────────────────────────────
    const key    = generateKey(`merchants/${auth.slug}/${folder}`, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToR2({
      bucket:      MEDIA_BUCKET,
      key,
      body:        buffer,
      contentType: file.type,
    });

    return NextResponse.json({ ok: true, url, key });
  } catch (err) {
    console.error('[POST /api/upload]', err);
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 });
  }
}
