/**
 * qr.ts — QR code image generation only.
 * Token logic (single-use, expiry, revoke) lives in the API routes + qr_tokens table.
 * Server-only — imports 'qrcode' which uses Node.js canvas.
 */
import QRCode from 'qrcode';

/**
 * Generate a QR code data URL for a given URL string.
 * Uses teal brand colour (#0D9488) on white background.
 */
export async function generateQRDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    width: 320,
    margin: 2,
    color: {
      dark:  '#0D9488',
      light: '#FFFFFF',
    },
  });
}
