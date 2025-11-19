/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Exclude Prisma and other Node.js-only packages from Edge Runtime
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
};

module.exports = nextConfig;

