# Fix Railway Deployment Issues

## Issue 1: UntrustedHost Error

**Error:**
```
[auth][error] UntrustedHost: Host must be trusted. URL was: http://localhost:3000/api/auth/session
```

**Fix Applied:**
I've updated `auth.ts` to include `trustHost: true` in the NextAuth configuration. This allows Auth.js to trust the host header in production environments like Railway.

**Additional Steps:**
Make sure your Railway environment variables are set correctly:

1. **Go to Railway Dashboard** → Your App Service → Variables tab
2. **Set `AUTH_URL` or `NEXTAUTH_URL`** to your Railway domain:
   ```
   AUTH_URL=https://your-app-name.up.railway.app
   ```
   OR
   ```
   NEXTAUTH_URL=https://your-app-name.up.railway.app
   ```

3. **To find your Railway domain:**
   - Go to your app service → Settings tab
   - Look for "Domains" section
   - Copy the Railway domain (e.g., `https://webv1-production.up.railway.app`)

4. **Redeploy** your app after setting the environment variable

## Issue 2: Missing Database Columns

**Error:**
```
ERROR: column users.icNumber does not exist
```

**Fix:**
The migration to add missing columns exists but hasn't been applied yet. Apply it using Railway CLI:

```powershell
# Make sure you're logged in and linked
railway login
railway link

# Apply the migration
railway run pnpm prisma migrate deploy
```

**Alternative:** If Railway CLI isn't working, the migration will run automatically during the next build (since it's included in the build script), but you need to make sure `DATABASE_URL` is available during build.

## Quick Fix Checklist

- [x] Added `trustHost: true` to `auth.ts` (already done)
- [ ] Set `AUTH_URL` or `NEXTAUTH_URL` in Railway Variables to your Railway domain
- [ ] Apply database migration: `railway run pnpm prisma migrate deploy`
- [ ] Redeploy your app on Railway

## After Fixing

1. **Redeploy on Railway:**
   - Push your code changes (the `trustHost: true` fix)
   - Or manually trigger a redeploy in Railway dashboard

2. **Verify:**
   - Check Railway logs - UntrustedHost errors should be gone
   - Try accessing your app - authentication should work
   - Database queries should work without column errors

## Environment Variables Checklist for Railway

Make sure these are set in Railway:

- [ ] `DATABASE_URL` (auto-set by Railway if PostgreSQL service is linked)
- [ ] `AUTH_URL` or `NEXTAUTH_URL` (your Railway domain, e.g., `https://your-app.up.railway.app`)
- [ ] `AUTH_SECRET` or `NEXTAUTH_SECRET` (generate with: `openssl rand -base64 32`)
- [ ] `S3_ACCESS_KEY_ID` (optional)
- [ ] `S3_SECRET_ACCESS_KEY` (optional)
- [ ] `S3_BUCKET_NAME` (optional)
- [ ] `S3_REGION` (optional)

## Notes

- `trustHost: true` tells Auth.js to trust the host header, which is necessary when Railway proxies requests
- The migration file `20251114035551_add_student_fields` adds the missing columns: `icNumber`, `phoneNumber`, `parentName`, `parentPhone`
- After applying the migration, your database will be in sync with your Prisma schema

