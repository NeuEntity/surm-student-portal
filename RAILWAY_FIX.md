# Railway App Service Deployment Fix

## Issue: App Container Startup Error
**Error:** `ERROR (catatonit:2): failed to exec pid1: No such file or directory`

This error occurs when the app container can't find or execute the start command.

**Note:** If this error is on the **Postgres service** (not your app), see `RAILWAY_POSTGRES_FIX.md` instead.

## Fixes Applied

1. **Created `nixpacks.toml`** - Explicit Nixpacks configuration to ensure:
   - Node.js 20 and pnpm are installed
   - Build script is executable
   - Start command uses the correct path

2. **Updated `railway.json`** - Changed start command to use `pnpm exec next start` for better reliability

## Next Steps

1. **Commit and push these changes:**
   ```bash
   git add nixpacks.toml railway.json
   git commit -m "Fix Railway deployment: Add nixpacks config and update start command"
   git push
   ```

2. **In Railway Dashboard:**
   - Go to your app service
   - The deployment should automatically trigger
   - Check the build logs to ensure the build completes successfully
   - Check the deploy logs to verify the container starts

3. **Verify DATABASE_URL is set:**
   - Go to your app service → Variables tab
   - Ensure `DATABASE_URL` is present (Railway should auto-inject it if Postgres service is linked)
   - If not, manually add it from your Postgres service → Variables → `DATABASE_URL`

4. **If the error persists:**
   - Check the build logs to see if the build completed
   - Verify that `.next` folder was created during build
   - Check that `node_modules/.bin/next` exists after build
   - Try using `node node_modules/.bin/next start` as an alternative start command

## Alternative Start Commands (if needed)

If `pnpm exec next start` doesn't work, try these in Railway's start command:

1. `node_modules/.bin/next start`
2. `node node_modules/.bin/next start`
3. `NODE_ENV=production node_modules/.bin/next start`

## Troubleshooting

- **Build fails:** Check that DATABASE_URL is available during build (Railway auto-injects it)
- **Start fails:** Verify the build completed and `.next` folder exists
- **Still getting pid1 error:** The container might not have Node.js/pnpm in PATH - the nixpacks.toml should fix this

