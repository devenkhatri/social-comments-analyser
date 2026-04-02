# Social Comments Analyzer

A Next.js dashboard application for collecting, analyzing, and managing comments from multiple social media platforms using Apify for data collection and OpenRouter AI for sentiment analysis.

## Features

### Multi-Platform Support
- **YouTube** - Scrape comments from YouTube videos
- **Twitter/X** - Collect replies from X/Twitter posts
- **Instagram** - Fetch comments from Instagram posts

### AI-Powered Analysis
- **Sentiment Detection** - Classifies comments as positive, negative, or neutral
- **Intent Recognition** - Identifies questions, complaints, praise, feedback, spam, or other
- **Urgency Classification** - Ranks urgency as spam, low, medium, high, or critical
- **Alert Generation** - Automatically flags comments needing attention

### Dashboard
- Real-time statistics overview
- Source management panel
- Comments table with filtering and analysis
- Alert panel for priority items
- Platform badges and sentiment indicators

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Database**: SQLite with better-sqlite3
- **Data Collection**: Apify API (YouTube, Twitter, Instagram scrapers)
- **AI Analysis**: OpenRouter API

## Prerequisites

- Node.js 18+
- Apify API Token
- OpenRouter API Key

## Setup

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API credentials:

```bash
# Apify API Token - get from https://console.apify.com/account#/integrations
APIFY_API_TOKEN=apify_api_xxxxxxxxxxxxx

# Apify Actor IDs — optional overrides for each platform's scraper actor
# Defaults are pre-configured; only set these if you want to use a different actor
# APIFY_ACTOR_INSTAGRAM=SbK00X0JYCPblD2wp
# APIFY_ACTOR_YOUTUBE=mExYO4A2k9976zMfA
# APIFY_ACTOR_TWITTER=m2yGezjjPmm4bOvax

# OpenRouter API Key - get from https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_MODEL=openrouter/free
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Usage

### Adding a Source

1. In the Sources panel, click "Add Source"
2. Enter the social media URL (YouTube video, X tweet, or Instagram post)
3. Select the platform (auto-detected from URL)
4. Add a label for easy identification
5. Click "Add" to save

### Fetching Comments

1. Select a source from the panel
2. Click "Fetch Comments" to scrape new comments
3. The comments will appear in the table

### Analyzing Comments

1. Select comments to analyze (or select all)
2. Click "Analyze" to run AI analysis
3. The system will classify sentiment, intent, and urgency
4. Comments flagged as high/critical urgency will generate alerts

### Managing Alerts

- Switch to the "Alerts" tab to view priority items
- Alerts are automatically created for high and critical urgency
- Mark alerts as resolved when addressed

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/              # API routes
│   │   ├── alerts/       # Alert management
│   │   ├── analyze/     # AI analysis endpoint
│   │   ├── comments/    # Comments CRUD
│   │   ├── fetch-comments/  # Data fetching
│   │   ├── sources/    # Source management
│   │   └── stats/       # Dashboard statistics
│   ├── globals.css       # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx        # Main dashboard
├── components/           # React components
│   ├── AlertPanel.tsx
│   ├── CommentsTable.tsx
│   ├── PlatformBadge.tsx
│   ├── SentimentBadge.tsx
│   ├── SeverityBadge.tsx
│   ├── SourcesPanel.tsx
│   └── StatsBar.tsx
└── lib/                 # Core libraries
    ├── adapters/        # Platform adapters
    │   ├── youtube.ts
    │   ├── twitter.ts
    │   └── instagram.ts
    ├── apify/          # Apify client
    ├── analysis.ts     # AI analysis functions
    ├── db.ts           # Database setup
    └── types.ts        # TypeScript types
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sources` | GET, POST | List/add sources |
| `/api/sources/[id]` | GET, DELETE | Get/delete source |
| `/api/sources/[id]/fetch` | POST | Fetch comments for source |
| `/api/comments` | GET | List comments |
| `/api/analyze` | POST | Run AI analysis |
| `/api/alerts` | GET, PATCH | List/resolve alerts |
| `/api/stats` | GET | Dashboard statistics |

## Database

Data is stored in `data/comments.db` (SQLite). The database is automatically created on first run with the following tables:

- **sources** - Social media sources
- **comments** - Collected comments with analysis
- **alerts** - Priority alerts for comments needing attention

## Build for Production

```bash
npm run build
npm start
```

## License

MIT