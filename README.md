# Readlist 📚

A modern, self-hosted link saving and search application. Save URLs with auto-fetched metadata (titles, descriptions, preview images), search across all your saved links, and organize your reading list efficiently.

## Features

- 🔗 **Save URLs** - Paste any URL and auto-fetch title, description, and preview image
- 🔍 **Smart Search** - Real-time search across titles, domains, descriptions, and URLs
- 🎨 **Light/Dark Theme** - Toggle between beautiful light and dark modes
- 📋 **Copy to Clipboard** - Quick copy button for each URL
- ⌨️ **Keyboard Shortcuts** - Cmd/K to focus search, Escape to blur
- 🚀 **Fast & Responsive** - Built with Next.js 16 and React 19
- 🐳 **Docker Ready** - One-command deployment with PostgreSQL
- 🎯 **Optimistic UI** - Instant feedback on all actions
- 🔔 **Error Handling** - Toast notifications for errors

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL + Drizzle ORM
- **Deployment**: Docker & Docker Compose
- **Styling**: Custom CSS with CSS variables for theming

## Quick Start

### Prerequisites
- Docker & Docker Compose (recommended)
- OR Node.js 20+ & PostgreSQL

### With Docker (Recommended)

```bash
# Clone and setup
git clone <repo-url>
cd readlist
cp .env.example .env.local

# Start
docker-compose up

# In another terminal, initialize database
docker-compose exec app npm run db:push

# Open http://localhost:3000
```

### Manual Setup

See [SETUP.md](SETUP.md) for detailed instructions without Docker.

## Usage

1. **Save a URL**: Paste any article/blog link and click "Save"
2. **View Details**: See auto-fetched title, description, and preview image
3. **Search**: Use the search bar to find saved links (Cmd/K)
4. **Manage**: Open links, copy URLs, or delete items
5. **Theme**: Toggle between light/dark mode in the top right

## Project Structure

```
readlist/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main UI component
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── globals.css        # Theme & styling
│   │   └── api/items/         # API endpoints
│   │       ├── route.ts       # POST (save), GET (list)
│   │       └── [id]/route.ts  # DELETE endpoint
│   └── db/
│       ├── schema.ts          # Database schema
│       └── index.ts           # Database client
├── Dockerfile                 # Container build
├── docker-compose.yml         # Services orchestration
├── SETUP.md                   # Detailed setup guide
└── package.json               # Dependencies
```

## Available Scripts

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Push database schema changes
npm run db:studio    # Open Drizzle Studio (GUI for DB)
npm run lint         # Run ESLint
```

## Environment Variables

Create `.env.local` with:

```
DATABASE_URL=postgresql://readlist_user:readlist_password@postgres:5432/readlist
```

For local PostgreSQL setup, see [SETUP.md](SETUP.md).

## API Endpoints

- `POST /api/items` - Save new URL with metadata
- `GET /api/items` - Get all saved items
- `DELETE /api/items/:id` - Delete item by ID

## Deployment

### Vercel (with external PostgreSQL)
1. Push to GitHub
2. Connect to Vercel
3. Set `DATABASE_URL` environment variable
4. Deploy

### Self-hosted (Docker)
```bash
docker-compose up -d
```

### DigitalOcean, AWS, Heroku, etc.
Set `DATABASE_URL` environment variable and deploy the Docker image.

## Contributing

Feel free to open issues and pull requests!

## License

MIT
