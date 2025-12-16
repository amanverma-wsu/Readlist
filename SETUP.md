# Readlist - Setup Guide

## Quick Start with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed

### Steps
```bash
# Create environment file
cp .env.example .env.local

# Start the app and database
docker-compose up

# In another terminal, push database schema
docker-compose exec app npm run db:push
```

Open [http://localhost:3000](http://localhost:3000)

To stop: `docker-compose down`

---

## Manual Setup (without Docker)

### 1. Create `.env.local` file
Copy `.env.example` to `.env.local` and add your PostgreSQL connection string:

```bash
cp .env.example .env.local
```

Add your Supabase credentials (Project Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**If using Docker:**
```
DATABASE_URL=postgresql://readlist_user:readlist_password@postgres:5432/readlist
```

**If using local PostgreSQL:**

**macOS (using Homebrew):**
```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb readlist

# Get connection string
# postgresql://username@localhost:5432/readlist
```

**Linux (Ubuntu/Debian):**
```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb readlist

# Connection string usually:
# postgresql://postgres:password@localhost:5432/readlist
```

**Windows:**
- Download PostgreSQL from https://www.postgresql.org/download/windows/
- During installation, note the password you set
- Use pgAdmin (comes with PostgreSQL) to create a `readlist` database
- Connection string: `postgresql://postgres:your_password@localhost:5432/readlist`

### 2. Install dependencies
```bash
npm install
```

### 3. Push database schema
```bash
npm run db:push
```

This will create the `items` table in your PostgreSQL database.

### 4. Start development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features
- ✅ Save URLs with auto-fetched metadata (title, description, image)
- ✅ Search across titles, domains, descriptions, and URLs
- ✅ Copy URLs to clipboard
- ✅ Delete items
- ✅ Light/Dark theme toggle
- ✅ Error notifications
- ✅ Keyboard shortcuts (Cmd/K for search)

## Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio (GUI for database)
npm run lint         # Run ESLint
```

## Troubleshooting

**"Failed to connect to database"**
- Check DATABASE_URL is correct in `.env.local`
- Verify PostgreSQL is running
- Check database exists

**"Table does not exist"**
- Run `npm run db:push` to create tables

**Metadata not fetching**
- Some websites block requests. The app still saves the URL/domain even if metadata fails
- Check browser console for errors

## Deployment
For production deployment:
1. Set `DATABASE_URL` environment variable in your hosting platform
2. Run `npm run build`
3. Run `npm run start`

## Tech Stack
- Next.js 16 (React 19)
- PostgreSQL + Drizzle ORM
- Tailwind CSS
- TypeScript
