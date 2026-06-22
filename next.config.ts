import type { NextConfig } from 'next';
import path from 'path';

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Pin file-tracing to this project so a stray package-lock.json elsewhere
  // (e.g. in the home dir) can't make Next infer the wrong workspace root.
  outputFileTracingRoot: path.resolve(),

  // Keep server-only Node.js packages out of the client bundle
  serverExternalPackages: [
    'mysql2',
    'nodemailer',
    'bcryptjs',
    '@aws-sdk/client-s3',
  ],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  images: {
    remotePatterns: buildImagePatterns(),
  },
};

// Whitelist whatever hostname NEXT_PUBLIC_MEDIA_URL points to (R2 public
// bucket or custom domain) plus a hardcoded fallback. If the uploaded image
// hostname isn't whitelisted, next/image throws a client-side exception at
// render — so this must always match the bucket the uploads actually use.
function buildImagePatterns(): NonNullable<NextConfig['images']>['remotePatterns'] {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    { protocol: 'https', hostname: 'pub-296a26c4474f4fa292574ea422002407.r2.dev', pathname: '/**' },
  ];
  const mediaUrl = process.env.NEXT_PUBLIC_MEDIA_URL;
  if (mediaUrl) {
    try {
      const u = new URL(mediaUrl);
      const protocol = u.protocol.replace(':', '') as 'http' | 'https';
      if (!patterns.some((p) => p.hostname === u.hostname)) {
        patterns.push({ protocol, hostname: u.hostname, pathname: '/**' });
      }
    } catch {
      // ignore malformed NEXT_PUBLIC_MEDIA_URL
    }
  }
  return patterns;
}

export default nextConfig;
