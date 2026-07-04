import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const merchant = searchParams.get('merchant') ?? '';
  const sub      = searchParams.get('sub') ?? '';

  const title = merchant
    ? `${merchant} — Loyalty Rewards`
    : 'LetLoyal — QR Loyalty for Indian Merchants';

  const body = sub || (merchant
    ? `Scan to earn rewards at ${merchant}. No app needed.`
    : 'Turn your QR code into a professional loyalty program. No app. No hardware. Live in 10 minutes.');

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #134E4A 0%, #0D9488 100%)',
          fontFamily: 'sans-serif',
          padding: '80px',
        }}
      >
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '16px',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 36, color: 'white', fontWeight: 900 }}>L</div>
          </div>
          <span style={{ fontSize: 36, fontWeight: 800, color: 'white', letterSpacing: '-0.5px' }}>
            LetLoyal
          </span>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: merchant ? 52 : 60,
          fontWeight: 800,
          color: 'white',
          textAlign: 'center',
          lineHeight: 1.1,
          marginBottom: '24px',
          maxWidth: '900px',
        }}>
          {title}
        </div>

        {/* Subline */}
        <div style={{
          fontSize: 28,
          color: 'rgba(255,255,255,0.75)',
          textAlign: 'center',
          maxWidth: '780px',
          lineHeight: 1.4,
        }}>
          {body}
        </div>

        {/* Badge */}
        <div style={{
          marginTop: '48px',
          padding: '12px 28px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '50px',
          color: 'white',
          fontSize: 20,
          fontWeight: 600,
        }}>
          letloyal.in
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
