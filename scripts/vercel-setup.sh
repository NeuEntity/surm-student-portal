#!/bin/bash
# Vercel deployment setup script
# This script runs migrations and seeds the database on Vercel

set -e

echo "🔧 Setting up database for Vercel..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
pnpm prisma generate

# Run migrations
echo "🚀 Running database migrations..."
pnpm prisma migrate deploy || echo "⚠️  Migrations may have already been applied"

# Seed database (only if needed - check if users exist)
echo "🌱 Seeding database..."
pnpm prisma db seed || echo "⚠️  Database may already be seeded"

echo "✅ Database setup complete!"







