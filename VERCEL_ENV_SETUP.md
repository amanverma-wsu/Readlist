# Vercel Environment Variables Setup

## Copy these exact values to Vercel dashboard:

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com
2. Select your project "Readlist"
3. Click "Settings"
4. Click "Environment Variables"

### Step 2: Add Environment Variables

**Variable 1: DATABASE_URL**
```
Name:  DATABASE_URL
Value: postgresql://readlist_user:readlist_password@localhost:5432/readlist
```
⚠️ IMPORTANT: Change this to your hosted database!
Options:
- Vercel Postgres: Get from Vercel → Storage
- Railway: Get from Railway dashboard
- Supabase: Get from Database settings
- AWS RDS: Get from RDS console

**Variable 2: NEXT_PUBLIC_SUPABASE_URL**
```
Name:  NEXT_PUBLIC_SUPABASE_URL
Value: https://dwypviszoutfybvohtac.supabase.co
```

**Variable 3: NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3eXB2aXN6b3V0Znlidm9odGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NTIwMjAsImV4cCI6MjA4MTQyODAyMH0.Xd1asmMZuT_ckzFKYHj4a4H0XPvKF59v9UxcpLmdzWc
```

### Step 3: Set Production/Preview Environment
- Check "Production" ✓
- Check "Preview" ✓
- (Optional) Check "Development"

### Step 4: Click "Save"

### Step 5: Deploy
1. Click "Deployments"
2. Click "Redeploy" on latest deployment
3. OR commit new code to trigger auto-deploy

### Step 6: Initialize Database (After Deploy Succeeds)
Run in terminal:
```bash
vercel env pull .env.local
npm run db:push
```

## Checklist
- [ ] Vercel project created
- [ ] GitHub repository connected
- [ ] DATABASE_URL set (with real hosted database)
- [ ] NEXT_PUBLIC_SUPABASE_URL set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set
- [ ] All variables set to Production + Preview
- [ ] First deployment successful
- [ ] `npm run db:push` completed

## Troubleshooting

**"Failed to connect to database"**
- DATABASE_URL points to localhost (won't work)
- Need actual hosted PostgreSQL URL

**"Table does not exist"**
- Run `npm run db:push` after first successful deploy

**"Unauthorized" errors**
- Check SUPABASE variables are correct
- Verify Supabase project is active

## Support Links
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
