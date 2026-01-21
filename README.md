# SURM Student Portal

A comprehensive student learning management system built with Next.js 15, TypeScript, Prisma, and Auth.js.

## Features

- **Role-Based Access Control**: Three user roles (Student, Teacher, Admin) with specific permissions
- **Student Dashboard**: Level-specific dashboards for 4 secondary levels with:
  - Learning materials organized by subject
  - Assignments with due dates
  - File upload system with 5-upload limit for medical certificates and early dismissal forms
- **Teacher Dashboard**: Create and manage learning materials and assignments
- **Admin Dashboard**: User management and system statistics
- **Authentication**: Secure login with Auth.js v5 and bcrypt password hashing
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: Beautiful, accessible UI with shadcn/ui and TailwindCSS
- **File Upload**: S3-compatible storage integration

## Documentation
- [Letters Feature & Admin Enhancements](docs/LETTERS_FEATURE.md)

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma 6.x
- **Authentication**: Auth.js v5 (NextAuth)
- **UI**: TailwindCSS + shadcn/ui
- **File Storage**: AWS S3 or S3-compatible services

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm)
- PostgreSQL database
- AWS S3 bucket or S3-compatible storage (MinIO, etc.)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd webv1
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Set up environment variables**:
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` with your configurations:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/surm_portal?schema=public"

# Auth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# S3 Storage
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="surm-portal-uploads"
S3_REGION="us-east-1"
S3_ENDPOINT="" # Optional: for MinIO or other S3-compatible services
```

4. **Set up the database**:
```bash
# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed the database with sample data
pnpm prisma db seed
```

5. **Run the development server**:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

After seeding the database, you can use these demo accounts:

### Students (one per level)
- **Email**: `student1@surm.edu` → Level: Secondary 1
- **Email**: `student2@surm.edu` → Level: Secondary 2
- **Email**: `student3@surm.edu` → Level: Secondary 3
- **Email**: `student4@surm.edu` → Level: Secondary 4

### Teacher
- **Email**: `teacher@surm.edu`

### Admin
- **Email**: `admin@surm.edu`

**Password for all accounts**: `password123`

## Project Structure

```
webv1/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── materials/            # Learning materials API
│   │   ├── assignments/          # Assignments API
│   │   ├── submissions/          # Submissions API
│   │   └── upload/               # File upload API
│   ├── dashboard/                # Dashboard pages
│   │   ├── secondary-1/          # Level 1 student dashboard
│   │   ├── secondary-2/          # Level 2 student dashboard
│   │   ├── secondary-3/          # Level 3 student dashboard
│   │   ├── secondary-4/          # Level 4 student dashboard
│   │   ├── teacher/              # Teacher dashboard
│   │   ├── admin/                # Admin dashboard
│   │   └── page.tsx              # Main dashboard router
│   ├── login/                    # Login page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (redirects)
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   └── dashboard/                # Dashboard components
├── lib/                          # Utility libraries
│   ├── auth-utils.ts             # Auth helper functions
│   ├── prisma.ts                 # Prisma client
│   └── utils.ts                  # General utilities
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed script
├── types/                        # TypeScript type definitions
├── auth.ts                       # Auth.js configuration
├── middleware.ts                 # Next.js middleware for auth
└── .env.example                  # Environment variables template
```

## Database Schema

### Models

- **User**: Students, teachers, and admins with roles and levels
- **LearningMaterial**: Educational content organized by level and subject
- **Assignment**: Tasks assigned to students by level and subject
- **Submission**: Student submissions including medical certificates and early dismissal forms

### Subjects

The system supports 12 subjects:
- Akidah
- Akhlak
- Fiqh
- Faraidh
- Sirah
- Hadis
- Mustolah Hadis
- English
- Bahasa Melayu
- Arabic
- Maths
- IRK (Islamic Religious Knowledge)

## Key Features Explained

### Student Dashboard

- **Auto-redirect**: Students are automatically redirected to their level-specific dashboard
- **Subject filtering**: Filter learning materials and assignments by subject
- **Upload limits**: Students can upload up to 5 medical certificates or early dismissal forms
- **Real-time validation**: Upload limits are enforced server-side

### Teacher Dashboard

- **Create materials**: Add learning materials with video and file URLs
- **Create assignments**: Set assignments with due dates
- **Server actions**: Uses Next.js server actions for form submissions
- **Recent items**: View recently created materials and assignments

### Admin Dashboard

- **User management**: View all users with their roles and levels
- **Statistics**: See system-wide statistics
- **Activity monitoring**: Track submissions and user activity

## Development

### Running Prisma Studio

View and edit your database:
```bash
pnpm prisma studio
```

### Database Migrations

Create a new migration:
```bash
pnpm prisma migrate dev --name migration_name
```

### Reset Database

Reset the database and re-seed:
```bash
pnpm prisma migrate reset
```

## Production Deployment

### Environment Setup

1. Set up a PostgreSQL database (Vercel Postgres, Supabase, etc.)
2. Configure S3 bucket with appropriate CORS settings
3. Set all environment variables in your hosting platform
4. Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables (including `DATABASE_URL`)
4. Deploy
5. Run database migrations separately (see `RUN_MIGRATIONS_ON_VERCEL.md`)

**Note:** Migrations are NOT run during build. You must run them manually after deployment using:
```bash
vercel env pull .env.local
pnpm prisma migrate deploy
```

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running
- Check `DATABASE_URL` format
- Verify database credentials

### Auth Issues

- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Clear browser cookies if experiencing login issues

### File Upload Issues

- Verify S3 credentials are correct
- Check bucket permissions
- For development without S3, the app will return mock URLs

## Contributing

This is a private project for SURM. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved by SURM.

