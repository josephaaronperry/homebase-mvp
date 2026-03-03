# HomeBase — Real Estate Platform

A modern, full-stack real estate platform with Zillow-level search, property listings, saved homes, showings, and offers. Built with Next.js, Expo (React Native), Supabase, and Tailwind CSS.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HomeBase Platform                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   Web App    │    │  Mobile App  │    │   API        │                   │
│  │   (Next.js)  │    │  (Expo RN)   │    │   (Express)  │                   │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                   │
│         │                   │                   │                            │
│         └───────────────────┼───────────────────┘                            │
│                             │                                                │
│                    ┌────────▼────────┐                                       │
│                    │    Supabase     │                                       │
│                    │  Auth · DB ·    │                                       │
│                    │  Storage · RLS  │                                       │
│                    └─────────────────┘                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer       | Technology                              |
|------------|------------------------------------------|
| Web        | Next.js 14, React 18, Tailwind CSS       |
| Mobile     | Expo SDK 53, React Native, NativeWind    |
| API        | Express, Prisma                          |
| Database   | Supabase (PostgreSQL)                    |
| Auth       | Supabase Auth (email, OAuth)             |
| Deploy     | Vercel (web), EAS / App Store (mobile)   |

## Project Structure

```
realestate-platform/
├── apps/
│   ├── web/                 # Next.js web app
│   │   ├── app/             # App Router pages, layouts, API routes
│   │   ├── components/      # Reusable UI components
│   │   └── lib/             # Supabase client, utilities
│   ├── mobile/              # Expo React Native app
│   │   ├── app/             # Expo Router screens
│   │   └── components/      # Mobile components
│   └── api/                 # Express API (optional)
├── packages/
│   └── database/            # Prisma schema, seeds, migrations
├── supabase/
│   └── migrations/          # SQL migrations (RLS, full-text search, etc.)
├── .github/workflows/       # CI/CD
└── vercel.json              # Vercel deployment config
```

## Environment Variables

| Variable | App | Description |
|----------|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Web, Mobile | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web, Mobile | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Migrations, Backend | Supabase service role key (secret) |
| `DATABASE_URL` | Database | Postgres connection string for migrations |
| `NEXT_PUBLIC_SITE_URL` | Web | Production site URL (e.g. https://homebase.example.com) |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | Same as `NEXT_PUBLIC_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile | Same as `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

## Setup

### Prerequisites

- Node.js 20+
- npm or pnpm
- Supabase account
- (Optional) Expo CLI for mobile

### 1. Clone and install

```bash
git clone <repo-url>
cd realestate-platform
npm install
```

### 2. Supabase setup

1. Create a [Supabase project](https://supabase.com/dashboard)
2. Run the base schema (create `properties`, `saved_properties`, `showings`, `offers`, `notifications` tables)
3. Copy URL and anon key from Project Settings → API

### 3. Run migrations

```bash
# Set DATABASE_URL (from Supabase: Project Settings → Database → Connection string)
export DATABASE_URL="postgresql://..."

cd packages/database
npm run migrate
```

### 4. Seed data (optional)

```bash
cd packages/database

# Prisma seed (if using Prisma)
npm run db:seed

# Supabase seed (20 extra properties)
NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npm run seed:more
```

## Run Locally

### Web app

```bash
cd apps/web
cp .env.example .env.local   # if you have one
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

npm run dev
# → http://localhost:3000
```

### Mobile app

```bash
cd apps/mobile
# Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env

npm start
# → Scan QR with Expo Go, or run iOS/Android simulator
```

## Deploy

### Web (Vercel)

1. Push to GitHub and connect the repo to Vercel
2. Set **Root Directory** to `apps/web`
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
4. Deploy

Or use GitHub Actions (see `.github/workflows/deploy.yml`):

- Add `VERCEL_TOKEN` to repo secrets
- Push to `main` to trigger deploy

### Mobile (EAS / App Store / Play Store)

```bash
cd apps/mobile
npx eas build --platform all
npx eas submit --platform ios
npx eas submit --platform android
```

## Screenshots

| Web Homepage | Property Search | Mobile Dashboard |
|--------------|-----------------|------------------|
| Dark premium hero, search bar, featured properties | Full-text search, filters, property cards | Tabbed UI: Home, Search, Saved, Showings, Profile |

## Scripts

| Command | Location | Description |
|---------|----------|-------------|
| `npm run dev` | Root | Start all apps (Turbo) |
| `npm run build` | Root | Build all apps |
| `npm run db:seed` | packages/database | Prisma seed |
| `npm run seed:more` | packages/database | Supabase seed (20 properties) |
| `npm run migrate` | packages/database | Run Supabase migrations |

## License

Private / Proprietary
