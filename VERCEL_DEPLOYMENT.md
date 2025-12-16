# Vercel Deployment Guide

## Prerequisites
- GitHub account with your repository
- Vercel account (free at vercel.com)
- PostgreSQL database (Vercel Postgres, Railway, Supabase, or AWS RDS)
- Supabase project (free at supabase.com)

## Step 1: Prepare Your Repository
All files are ready! Push to GitHub:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Set Up PostgreSQL Database
Choose one option:

### Option A: Vercel Postgres (Recommended)
1. Go to Vercel Dashboard → Storage
2. Create a new Postgres database
3. Copy the connection string

### Option B: Railway.app
1. Create account at railway.app
2. New Project → Add PostgreSQL
3. View credentials and copy connection string

### Option C: Supabase
1. Create project at supabase.com
2. Go to Project Settings → Database
3. Copy the connection URI

## Step 3: Set Up Supabase Auth
1. Go to supabase.com → Create new project
2. Go to Authentication → Providers → Email
3. Enable "Email/Password" auth
4. Copy `Project URL` and `Anon Key` from Settings → API
5. Add redirect URL: `https://your-vercel-domain.vercel.app/auth/callback`

## Step 4: Deploy to Vercel
1. Go to vercel.com → Import Project
2. Connect your GitHub repository
3. Select your repository and import
4. In "Environment Variables" section, add:
   - `DATABASE_URL` = Your PostgreSQL connection string
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase Anon Key
5. Click "Deploy"

## Step 5: Initialize Database Schema
After deployment succeeds:

### Option A: Via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Link to your Vercel project
vercel link

# Run the migration
vercel env pull .env.local
npm run db:push
```

### Option B: Via Terminal
```bash
# Set environment variables temporarily
export DATABASE_URL="your-connection-string"

# Push schema
npm run db:push
```

## Step 6: Update Supabase Auth Redirect URLs
1. Go back to Supabase project settings
2. Find "URL Configuration"
3. Add your Vercel URL under "Redirect URLs":
   - `https://your-project.vercel.app/auth/callback`
   - `https://your-project.vercel.app/reset-password`

## Verification
1. Visit your Vercel URL
2. Try signing up with email/password
3. Confirm email verification works
4. Save a URL and verify it appears in the list

## Troubleshooting

### "Failed to connect to database"
- Verify `DATABASE_URL` is set in Vercel environment variables
- Check database connection string format
- Ensure database is accessible from Vercel IPs

### "Table does not exist"
- Run `npm run db:push` after deployment

### "Unauthorized" errors
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Check Supabase project is active

### Email not sending
- Check Supabase email settings
- Verify redirect URLs are configured correctly
- Check spam folder

## Production Tips
- Monitor database performance in Vercel/Railway dashboard
- Set up database backups
- Enable Supabase row-level security if needed
- Add rate limiting for API endpoints if scaling

## Support
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
