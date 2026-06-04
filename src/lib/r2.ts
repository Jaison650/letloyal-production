/**
 * r2.ts — Cloudflare R2 helpers (S3-compatible).
 * Server-only. Never import in client components or middleware.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region:   'auto',
  endpoint: process.env.R2_ENDPOINT ?? '',
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID     ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  },
});

export const MEDIA_BUCKET = process.env.R2_BUCKET_MEDIA ?? 'letloyal-media';
export const MEDIA_URL    = process.env.NEXT_PUBLIC_MEDIA_URL ?? '';

// ── Upload a buffer to R2 ─────────────────────────────────────────────
export async function uploadToR2(opts: {
  bucket:      string;
  key:         string;
  body:        Buffer | Uint8Array;
  contentType: string;
}): Promise<string> {
  await R2.send(
    new PutObjectCommand({
      Bucket:       opts.bucket,
      Key:          opts.key,
      Body:         opts.body,
      ContentType:  opts.contentType,
      CacheControl: 'public, max-age=31536000',
    }),
  );
  return `${MEDIA_URL}/${opts.key}`;
}

// ── Delete a file from R2 ─────────────────────────────────────────────
export async function deleteFromR2(bucket: string, key: string): Promise<void> {
  await R2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// ── Extract key from a full R2 public URL ─────────────────────────────
export function keyFromUrl(url: string, baseUrl: string = MEDIA_URL): string {
  return url.replace(`${baseUrl}/`, '');
}

// ── Generate a unique, safe file key ─────────────────────────────────
export function generateKey(folder: string, fileName: string): string {
  const ext    = fileName.split('.').pop()?.toLowerCase() ?? 'bin';
  const ts     = Date.now();
  const rand   = Math.random().toString(36).slice(2, 8);
  return `${folder}/${ts}-${rand}.${ext}`;
}
