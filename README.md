# Social Comments Analyzer

A Next.js dashboard application for collecting, analyzing, and managing comments from multiple social media platforms using Apify for data collection and OpenRouter AI for sentiment analysis.

## Features

### Multi-Platform Support
- **YouTube** - Scrape comments from multiple YouTube videos in a single run
- **Twitter/X** - Collect replies from X/Twitter posts
- **Instagram** - Fetch comments from Instagram posts

### AI-Powered Analysis
- **Sentiment Detection** - Classifies comments as positive, negative, or neutral
- **Intent Recognition** - Identifies questions, complaints, praise, feedback, spam, or other
- **Urgency Classification** - Ranks urgency as spam, low, medium, high, or critical
- **Alert Generation** - Automatically flags comments needing attention
- **Real-time Progress** - Live progress bar and counter during AI analysis

### Dashboard
- Real-time statistics overview
- Source management panel
- Sortable comments table with filtering, search, and pagination
- Alert panel for priority items
- Platform badges and sentiment indicators
- Dark mode support

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Database**: SQLite with better-sqlite3
- **Data Collection**: Apify API (YouTube, Twitter, Instagram scrapers)
- **AI Analysis**: OpenRouter API with streaming progress via Server-Sent Events

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
# APIFY_ACTOR_YOUTUBE=LXCwFkJ18vBfDQuHn
# APIFY_ACTOR_TWITTER=m2yGezjjPmm4bOvax

# OpenRouter API Key - get from https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxx
OPENROUTER_MODEL=openai/gpt-4o-mini
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Usage

### Adding a Source

1. In the Sources panel, enter a social media URL (YouTube video, X tweet, or Instagram post)
2. Add an optional label for easy identification
3. Click "Add Source" to save

### Fetching Comments

1. Click the refresh icon next to any source to fetch new comments
2. Only new comments are fetched — duplicates are automatically skipped
3. The comments view auto-refreshes to show the latest comments first

### Analyzing Comments

1. Click "Analyze with AI" to run AI analysis on unanalyzed comments
2. Watch real-time progress with a live progress bar and done/total counter
3. The system classifies sentiment, intent, and urgency
4. Comments flagged as high/critical urgency automatically generate alerts

### Managing Alerts

- Switch to the "Alerts" tab to view priority items
- Alerts are automatically created for high and critical urgency comments
- Mark alerts as resolved when addressed

### Sorting and Filtering

- Click any column header (Author, Sentiment, Urgency, Likes, Date) to sort
- Click again to toggle ascending/descending order
- Use the search box to filter comments by text
- Toggle "Needs attention only" to see flagged items

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   │   ├── alerts/         # Alert management
│   │   ├── analyze/        # AI analysis (streaming + legacy)
│   │   ├── comments/       # Comments listing with sorting
│   │   ├── fetch-comments/ # Platform-specific fetching
│   │   ├── sources/        # Source management
│   │   └── stats/          # Dashboard statistics
│   ├── globals.css         # Global styles + design tokens
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main dashboard
├── components/             # React components
│   ├── AlertPanel.tsx
│   ├── CommentsTable.tsx   # Sortable table with analysis progress
│   ├── PlatformBadge.tsx
│   ├── SentimentBadge.tsx
│   ├── SeverityBadge.tsx
│   ├── SourcesPanel.tsx
│   ├── StatsBar.tsx
│   └── icons/              # SVG icon components
└── lib/                    # Core libraries
    ├── adapters/           # Platform-specific input/output adapters
    │   ├── youtube.ts
    │   ├── twitter.ts
    │   └── instagram.ts
    ├── apify.ts            # Apify client
    ├── analysis.ts         # AI analysis with progress callbacks
    ├── db.ts               # SQLite database setup
    └── types.ts            # TypeScript types
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sources` | GET, POST | List/add sources |
| `/api/sources/[id]` | GET, DELETE | Get/delete source |
| `/api/sources/[id]/fetch` | POST | Fetch comments for a single source |
| `/api/fetch-comments/[platform]` | POST | Fetch comments for all sources of a platform |
| `/api/comments` | GET | List comments with sorting, filtering, pagination |
| `/api/analyze` | POST | Run AI analysis (legacy, batch) |
| `/api/analyze/stream` | GET | Run AI analysis with real-time SSE progress |
| `/api/alerts` | GET, PATCH | List/resolve alerts |
| `/api/stats` | GET | Dashboard statistics |

## Database

Data is stored in `data/comments.db` (SQLite). The database is automatically created on first run with the following tables:

- **sources** - Social media sources to monitor
- **comments** - Collected comments with AI analysis results (deduplicated by `source_id` + `external_id`)
- **alerts** - Priority alerts for comments needing attention

## Recent Changes

- **YouTube adapter updated** - Now supports multiple video URLs with `videosUrls` array, `maxComments: 30`, and `orderBy: 'top'`
- **Real-time analysis progress** - Streaming SSE endpoint shows live progress bar and done/total counter
- **Column sorting** - All major columns are now sortable with visual indicators
- **Auto-refresh** - Comments view refreshes automatically after fetching or analyzing
- **Deduplication** - Only new comments are stored; duplicates are skipped via unique constraint
- **Error handling** - User-friendly error messages for AI model limitations

## Build for Production

```bash
npm run build
npm start
```

## License

MIT
