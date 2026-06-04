import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Keep server-only Node.js packages out of the client bundle
  serverExternalPackages: [
    'mysql2',
    'nodemailer',
    'bcryptjs',
    '@aws-sdk/client-s3',
  ],

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
