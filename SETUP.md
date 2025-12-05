# Quick Setup Guide

## 1. Install Dependencies

```bash
pnpm install
```

## 2. Configure Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your database URL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/surm_portal"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

For S3 storage (optional for development):
```env
S3_ACCESS_KEY_ID="your-key"
S3_SECRET_ACCESS_KEY="your-secret"
S3_BUCKET_NAME="surm-uploads"
S3_REGION="us-east-1"
```

## 3. Setup Database

```bash
# Generate Prisma client
pnpm prisma generate

# Create database and run migrations
pnpm prisma migrate dev

# Seed with demo data
pnpm prisma db seed
```

## 4. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:3000 and login with:
- **Student**: `student1@surm.edu` / `password123`
- **Teacher**: `teacher@surm.edu` / `password123`
- **Admin**: `admin@surm.edu` / `password123`

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000
# or use different port
PORT=3001 pnpm dev
```

### Database Connection Error
- Make sure PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists

### Prisma Issues
```bash
# Reset everything
pnpm prisma migrate reset
# This will drop database, recreate, and re-seed
```

### Auth Issues
```bash
# Generate a secure secret
openssl rand -base64 32
# Add to .env as NEXTAUTH_SECRET
```

## Project Structure Overview

```
app/
  ├── api/              # API endpoints
  ├── dashboard/        # Protected dashboards
  │   ├── secondary-1/  # Student Level 1
  │   ├── secondary-2/  # Student Level 2
  │   ├── secondary-3/  # Student Level 3
  │   ├── secondary-4/  # Student Level 4
  │   ├── teacher/      # Teacher portal
  │   └── admin/        # Admin panel
  └── login/            # Login page

components/
  ├── ui/               # shadcn/ui components
  └── dashboard/        # Dashboard components

prisma/
  ├── schema.prisma     # Database schema
  └── seed.ts           # Sample data
```

## Development Tips

### View Database
```bash
pnpm prisma studio
```

### Create New Migration
```bash
pnpm prisma migrate dev --name your_migration_name
```

### Format Code
```bash
pnpm format
```

### Type Check
```bash
pnpm type-check
```

## Next Steps

1. Customize the subjects and levels in `prisma/schema.prisma`
2. Configure real S3 bucket for production
3. Update branding and colors in `app/globals.css`
4. Add email notifications (optional)
5. Set up production database

## Support

For issues or questions, contact the development team.

