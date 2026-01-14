/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Exclude Prisma and other Node.js-only packages from Edge Runtime
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
};

module.exports = nextConfig;

