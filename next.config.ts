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
    remotePatterns: [
      // Cloudflare R2 public bucket (NEXT_PUBLIC_MEDIA_URL)
      {
        protocol: 'https',
        hostname: 'pub-296a26c4474f4fa292574ea422002407.r2.dev',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
