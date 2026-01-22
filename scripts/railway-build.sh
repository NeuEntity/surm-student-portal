#!/bin/bash
set -e

# Railway build script for Prisma + Next.js
# This script handles the case where DATABASE_URL might not be available during prisma generate

echo "🔨 Starting Railway build..."

# Store original DATABASE_URL if it exists
ORIGINAL_DB_URL="$DATABASE_URL"

# Step 1: Generate Prisma Client
# prisma generate doesn't need a real database connection, but Prisma 6 validates the schema
# If DATABASE_URL is not set, use a dummy URL for validation only
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  WARNING: DATABASE_URL not set during build"
  echo "   Using dummy URL for prisma generate (schema validation only)"
  echo "   Make sure your PostgreSQL service is linked to your app service in Railway"
  export DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
fi

echo "📦 Generating Prisma Client..."
pnpm prisma generate || {
  echo "❌ ERROR: prisma generate failed"
  echo "   This might be because DATABASE_URL is not properly configured"
  echo "   Please ensure your PostgreSQL service is linked in Railway"
  exit 1
}

# Step 2: Run migrations (requires real DATABASE_URL)
# Restore original DATABASE_URL if we had one
if [ -n "$ORIGINAL_DB_URL" ]; then
  export DATABASE_URL="$ORIGINAL_DB_URL"
fi

# Check if DATABASE_URL is still dummy (meaning Railway didn't provide it)
if [ "$DATABASE_URL" = "postgresql://dummy:dummy@localhost:5432/dummy?schema=public" ]; then
  echo "❌ ERROR: DATABASE_URL is not set or is still dummy"
  echo ""
  echo "   To fix this:"
  echo "   1. Go to your Railway project dashboard"
  echo "   2. Make sure you have a PostgreSQL service added"
  echo "   3. Ensure the PostgreSQL service is in the same project as your app"
  echo "   4. Railway should automatically share DATABASE_URL between services"
  echo "   5. If not, manually add DATABASE_URL in your app service Variables tab"
  echo ""
  echo "   The DATABASE_URL should look like:"
  echo "   postgresql://postgres:password@host:port/railway"
  exit 1
fi

echo "🔄 Pushing database schema (using db push for Railway)..."
# Using db push instead of migrate deploy because we don't have a migrations folder
# and the database might not be empty. This is safer for this setup.
pnpm prisma db push --accept-data-loss || {
  echo "❌ ERROR: Database push failed"
  echo "   Check that DATABASE_URL is correct and the database is accessible"
  exit 1
}

# Step 3: Build Next.js
echo "🏗️  Building Next.js application..."
pnpm next build

echo "✅ Build completed successfully!"

