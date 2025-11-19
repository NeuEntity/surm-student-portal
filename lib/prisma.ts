import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prepare database URL for Prisma
function prepareDatabaseUrl(url: string): string {
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  
  let cleanUrl = url;
  
  // Check if this is Vercel Postgres
  const isVercelPostgres = 
    url.includes("vercel-storage.com") || 
    url.includes("vercel-db") ||
    (url.includes("aws-0") && !url.includes("pooler.supabase.com")); // Vercel Postgres can use AWS hosts
  
  // Check if this is Supabase (and warn user)
  const isSupabase = url.includes("supabase.co");
  
  if (isSupabase && process.env.NODE_ENV === "production") {
    console.warn("⚠️  WARNING: Detected Supabase connection string in production.");
    console.warn("⚠️  If you're using Vercel Postgres, please update DATABASE_URL in Vercel:");
    console.warn("⚠️  1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables");
    console.warn("⚠️  2. Delete the old DATABASE_URL (Supabase)");
    console.warn("⚠️  3. Go to Storage → Your Postgres Database → .env.local");
    console.warn("⚠️  4. Copy the DATABASE_URL from Vercel Postgres");
    console.warn("⚠️  5. Add it as a new environment variable in Vercel");
    console.warn("⚠️  6. Redeploy your application");
  }
  
  // Vercel Postgres: Use as-is (Vercel handles connection pooling)
  if (isVercelPostgres) {
    // Ensure schema=public is present for Prisma
    if (!cleanUrl.includes("schema=")) {
      const separator = cleanUrl.includes("?") ? "&" : "?";
      cleanUrl = `${cleanUrl}${separator}schema=public`;
    }
    return cleanUrl;
  }
  
  // Supabase: Handle connection string format
  if (isSupabase) {
    // Remove search_path parameter (not supported by Supabase connection pooler)
    cleanUrl = cleanUrl.replace(/[?&]search_path=[^&]*/gi, '');
    
    const isSupabasePooler = cleanUrl.includes("pooler.supabase.com");
    const isSupabaseWrongFormat = cleanUrl.includes(".supabase.co:6543/") && !isSupabasePooler;
    
    // Detect incorrect format: db.xxx.supabase.co with port 6543
    if (isSupabaseWrongFormat) {
      console.error("❌ Invalid Supabase connection string format!");
      console.error("❌ You're using: db.xxx.supabase.co with port 6543");
      console.error("❌ This format doesn't work with Prisma.");
      console.error("");
      console.error("✅ Use one of these formats instead:");
      console.error("   Option 1 (Pooler): postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true");
      console.error("   Option 2 (Direct): postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public");
      throw new Error(
        "Invalid Supabase connection string. Use pooler.supabase.com:6543 with ?pgbouncer=true OR db.xxx.supabase.co:5432 with ?schema=public"
      );
    }
    
    if (isSupabasePooler) {
      // Remove schema parameter (pooler doesn't support it)
      cleanUrl = cleanUrl.replace(/[?&]schema=[^&]*/gi, '');
      // Add pgbouncer=true for session mode
      if (!cleanUrl.includes("pgbouncer=")) {
        const separator = cleanUrl.includes("?") ? "&" : "?";
        cleanUrl = `${cleanUrl}${separator}pgbouncer=true`;
      }
    } else {
      // Direct connection - ensure schema=public
      if (!cleanUrl.includes("schema=")) {
        const separator = cleanUrl.includes("?") ? "&" : "?";
        cleanUrl = `${cleanUrl}${separator}schema=public`;
      }
    }
  } else {
    // Standard PostgreSQL: ensure schema=public is present
    if (!cleanUrl.includes("schema=")) {
      const separator = cleanUrl.includes("?") ? "&" : "?";
      cleanUrl = `${cleanUrl}${separator}schema=public`;
    }
  }
  
  // Clean up any double separators
  cleanUrl = cleanUrl.replace(/\?&/g, '?').replace(/&&/g, '&');
  
  return cleanUrl;
}

// Validate and prepare the DATABASE_URL
const originalDatabaseUrl = process.env.DATABASE_URL;

if (!originalDatabaseUrl) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  console.error("❌ Please set DATABASE_URL in your Vercel environment variables.");
  console.error("❌ For Vercel Postgres: Go to Storage → Your Database → .env.local");
  throw new Error("DATABASE_URL environment variable is not set");
}

let databaseUrl: string;
try {
  databaseUrl = prepareDatabaseUrl(originalDatabaseUrl);
  // Update process.env if URL was modified (only in dev)
  if (databaseUrl !== originalDatabaseUrl && process.env.NODE_ENV !== "production") {
    process.env.DATABASE_URL = databaseUrl;
  }
} catch (error) {
  console.error("❌ Error preparing DATABASE_URL:", error);
  throw error;
}

// Create Prisma client
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
