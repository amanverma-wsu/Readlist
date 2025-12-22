# Readlist

A modern, full-featured web application for saving and managing your reading list. Save links, extract metadata, organize articles, and track your reading progress with an intuitive interface powered by Next.js, React, and PostgreSQL.

## Live-project: https://www.readlist.lol/

## Features

- Save and organize links from across the web
- Automatic metadata extraction (title, description, Open Graph images)
- Mark items as read or favorite
- Sort by date, title, domain, or last read
- Search and filter your saved links
- User authentication via Supabase
- Beautiful, responsive interface with Tailwind CSS
- Theme support (light/dark mode)
- RESTful API for managing items

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, PostCSS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase
- **Deployment**: Docker, Vercel ready
- **Development Tools**: ESLint, Drizzle Kit

## Quick Start

### Using Docker (Recommended)

Prerequisites:
- Docker and Docker Compose

Steps:
```bash
# Clone the repository
git clone <repository-url>
cd readlist

# Create environment file
cp .env.example .env.local

# Start the app and database
docker-compose up

# In another terminal, push database schema
docker-compose exec app npm run db:push
```

Open http://localhost:3000

To stop: `docker-compose down`

### Manual Setup

#### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

#### 1. Environment Setup

Create a `.env.local` file:
```bash
cp .env.example .env.local
```

Configure your Supabase credentials (from Project Settings → API):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

And your database connection:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/readlist
```

#### 2. Database Setup

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb readlist
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb readlist
```

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Use pgAdmin (included) to create a `readlist` database
- Connection string: `postgresql://postgres:your_password@localhost:5432/readlist`

#### 3. Installation and Running

```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Open http://localhost:3000

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio
```

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── items/        # Items endpoints (GET, POST, PATCH, DELETE)
│   │   ├── auth/         # Authentication callback
│   │   ├── config/       # Configuration endpoint
│   │   └── reset-password/ # Password reset page
│   ├── auth/             # Auth pages
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main application page
│   ├── providers.tsx     # Context providers
│   └── globals.css       # Global styles
├── components/           # React components
│   └── auth-modal.tsx   # Authentication modal
├── db/                   # Database configuration
│   ├── index.ts         # Database connection
│   └── schema.ts        # Data models
└── lib/                  # Utilities and helpers
    ├── auth.ts          # Authentication utilities
    └── supabase/        # Supabase client setup
        ├── client.ts    # Browser client
        └── server.ts    # Server client
```

## API Endpoints

### Items

- `GET /api/items` - List all saved items for authenticated user
- `POST /api/items` - Save a new link
- `PATCH /api/items/[id]` - Update item (mark as read/favorite)
- `DELETE /api/items/[id]` - Delete a saved item

### Authentication

- `POST /api/auth/callback` - OAuth callback handler

### Config

- `GET /api/config` - Get application configuration

## Database Schema

### Items Table

```typescript
{
  id: UUID,                    // Primary key
  userId: UUID,               // Supabase auth user ID
  url: text,                  // Original URL
  title: text (optional),     // Page title
  description: text (optional), // Page description
  image: text (optional),     // OG image URL
  domain: text,               // Domain hostname
  isRead: boolean,            // Read status
  isFavorite: boolean,        // Favorite status
  createdAt: timestamp,       // Creation date
  readAt: timestamp (optional) // When marked as read
}
```

## Authentication

This app uses Supabase for user authentication. To set up:

1. Create a Supabase project at https://supabase.com
2. Get your API URL and Anon Key
3. Add to `.env.local`
4. Configure OAuth providers in Supabase dashboard

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

### Docker

Build and run the Docker image:
```bash
docker build -t readlist .
docker run -p 3000:3000 readlist
```

## Performance Optimizations

- Favicon caching to reduce redundant requests
- Debounced search input for optimized database queries
- Pre-compiled regex patterns for metadata extraction
- 5-second timeout on external URL fetches
- Database connection pooling with Supabase

## Development

### Code Quality

```bash
# Run ESLint
npm run lint

# View database schema
npm run db:studio
```

### Database Migrations

Drizzle handles database migrations automatically:
```bash
npm run db:push
```

## Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Database
DATABASE_URL=
```
