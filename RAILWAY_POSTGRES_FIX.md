# Railway Postgres Service Crash Fix

## Issue: Postgres Service Container Crash
**Error:** `ERROR (catatonit:2): failed to exec pid1: No such file or directory`

This error indicates the Postgres container is failing to start. This is a Railway infrastructure issue with the Postgres service itself.

## Solutions (Try in Order)

### Solution 1: Restart the Postgres Service
1. Go to Railway Dashboard → Your Project
2. Click on the **Postgres** service
3. Go to **Settings** tab
4. Scroll down and click **"Restart Service"** or **"Redeploy"**
5. Wait for the service to restart

### Solution 2: Recreate the Postgres Service (⚠️ Data Loss Warning)
If restarting doesn't work, you may need to recreate the service:

**⚠️ WARNING: This will delete all data in the database!**

1. **Backup your data first** (if possible):
   - Go to Postgres service → **Database** tab → **Backups**
   - Create a backup if you have important data

2. **Delete and recreate:**
   - Go to Postgres service → **Settings** tab
   - Scroll to bottom → Click **"Delete Service"**
   - Add a new Postgres service:
     - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will automatically link it and provide a new `DATABASE_URL`

3. **Re-run migrations:**
   ```bash
   railway run pnpm prisma migrate deploy
   ```

### Solution 3: Check Volume Issues
The error mentions volume mounting. Check:

1. Go to Postgres service → **Settings** tab
2. Look for **"Volumes"** section
3. If there's a volume attached, try:
   - Detaching the volume temporarily
   - Restart the service
   - If it works, the volume might be corrupted

### Solution 4: Contact Railway Support
If none of the above work:

1. Go to Railway Dashboard → **Get Help** (top right)
2. Report the issue with:
   - Service: Postgres
   - Error: `failed to exec pid1: No such file or directory`
   - Logs from the Deploy Logs tab

## Quick Fix Steps (Recommended)

1. **Try restarting first** (Solution 1) - this often fixes temporary issues
2. **Check Railway Status** - Go to https://status.railway.app to see if there are known issues
3. **If restart doesn't work** - Consider Solution 2 (recreate service) if you don't have critical data
4. **If you have important data** - Contact Railway support before deleting

## After Fixing

Once Postgres is running:

1. **Verify connection:**
   - Go to Postgres service → **Database** tab → **Data**
   - You should see your tables

2. **Verify DATABASE_URL:**
   - Go to your app service → **Variables** tab
   - Ensure `DATABASE_URL` is present and correct
   - If missing, copy it from Postgres service → **Variables** → `DATABASE_URL`

3. **Re-run migrations if needed:**
   ```bash
   railway run pnpm prisma migrate deploy
   ```

4. **Redeploy your app** to ensure it connects properly

## Prevention

- Regularly backup your database (Postgres service → Database → Backups)
- Monitor Railway status for service issues
- Consider using Railway's managed Postgres backups

