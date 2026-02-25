# TMC Catalyst Tracker

A real-time dashboard tracking regulatory catalysts, permit status, and market data for The Metals Company ($TMC).

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (launches in demo mode)
npm run dev

# Build for production
npm run build
```

## Connect to Supabase

**Option A: Environment variables (recommended for deployment)**

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

The app will auto-connect on load.

**Option B: UI connection (for development)**

Leave `.env` empty and use the "Connect Supabase" button in the header to enter your URL and anon key at runtime.

## Project Structure

```
src/
├── main.jsx              # Entry point
├── App.jsx               # Main app orchestrator
├── components/
│   ├── Header.jsx        # Logo, live badge, scan time, setup toggle
│   ├── SetupPanel.jsx    # Supabase connection form
│   ├── HeroStatus.jsx    # Permit status banner + key metrics
│   ├── CatalystCard.jsx  # Expandable ranked catalyst card
│   ├── MarketSnapshot.jsx # Price, volume, SI, inst. ownership
│   ├── PermitTimeline.jsx # Vertical permit milestone timeline
│   ├── NewsFeed.jsx      # Latest news with source links
│   ├── Footer.jsx        # Disclaimer + links
│   └── Icons.jsx         # Reusable SVG icon components
├── lib/
│   ├── supabase.js       # Lightweight Supabase REST client
│   └── utils.js          # Formatters, time helpers, style maps
├── data/
│   └── demo.js           # Demo/fallback data
└── styles/
    └── global.css        # Design tokens, keyframes, responsive
```

## Deployment

Works with any static hosting. Recommended: **Vercel**.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in your Vercel project settings.

## Backend

See the companion files for the full backend:

- `supabase-schema.sql` — Database schema (run in Supabase SQL Editor)
- `schema-reference.md` — Manual editing guide and API patterns
- `agent.py` — Daily Python agent that scrapes sources and updates the DB

## Tech Stack

- **Frontend**: React 18 + Vite
- **Database**: Supabase (Postgres)
- **Agent**: Python + Claude API
- **Deployment**: Vercel / GitHub Pages
