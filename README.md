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
- Real-time statistics overview (total, needs attention, critical, sentiment breakdown)
- Collapsible sidebar with source management panel — toggleable via hamburger button at all screen sizes
- Sortable comments table with filtering, search, and pagination
- **Comment detail dialog** — click any comment to view full text, AI analysis, and metadata
- **"Needs attention" highlighting** — amber border and background on flagged rows; critical urgency overrides to red
- Alert panel with unresolved alert badge counter
- Platform badges and sentiment/severity indicators
- **Light/Dark mode toggle** — persists preference via `localStorage`, respects system preference on first visit
- Responsive layout with mobile sidebar overlay

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

### Editing a Source

1. Hover over any source in the sidebar to reveal the action icons
2. Click the pencil icon to open the edit dialog
3. Update the URL and/or label, then click "Save"
4. The platform is automatically re-detected from the new URL

### Fetching Comments

1. Click the refresh icon next to any source to fetch new comments
2. Only new comments are fetched — duplicates are automatically skipped
3. The comments view auto-refreshes to show the latest comments first

### Analyzing Comments

1. Click "Analyze with AI" to run AI analysis — only unanalyzed comments are processed
2. Watch real-time progress with a live progress bar and done/total counter
3. If all comments are already analyzed, "All comments already analyzed" is shown briefly
4. The system classifies sentiment, intent, and urgency
5. Comments flagged as high/critical urgency automatically generate alerts

### Managing Alerts

- Switch to the "Alerts" tab to view priority items
- An unresolved alert count badge is shown on the Alerts tab
- Alerts are automatically created for high and critical urgency comments
- Mark alerts as resolved when addressed

### Sorting and Filtering

- Click any column header (Author, Sentiment, Urgency, Likes, Date) to sort
- Click again to toggle ascending/descending order
- Use the search box to filter comments by text
- Toggle **"Needs attention"** to show only flagged comments
- Toggle **"Hide analyzed"** to show only comments that have not yet been analyzed

### Viewing a Comment

- Click any row in the comments table (or any card on mobile) to open the detail dialog
- The dialog shows the full untruncated comment text, AI analysis badges (sentiment, urgency, intent), the AI reason, and metadata (source, published date, likes)
- Close with the ✕ button, backdrop click, or Escape key

### Theme Toggle

- Click the sun/moon icon in the top-right header to switch between light and dark mode
- Your preference is saved to `localStorage` and restored on next visit
- Falls back to the OS/system color scheme preference on first visit

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
│   ├── globals.css         # Global styles + design tokens (light & dark themes)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main dashboard
├── components/             # React components
│   ├── AlertPanel.tsx
│   ├── CommentsTable.tsx   # Sortable table with analysis progress
│   ├── PlatformBadge.tsx   # Platform color-coded badge (dot or full)
│   ├── SentimentBadge.tsx
│   ├── SeverityBadge.tsx
│   ├── SourcesPanel.tsx
│   ├── StatsBar.tsx        # Stats strip with sentiment breakdown
│   ├── ThemeToggle.tsx     # Light/dark mode toggle button
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
| `/api/sources/[id]` | GET, PATCH, DELETE | Get/update (label + URL)/delete source |
| `/api/sources/[id]/fetch` | POST | Fetch comments for a single source |
| `/api/fetch-comments/[platform]` | POST | Fetch comments for all sources of a platform |
| `/api/comments` | GET | List comments with sorting, filtering (`analyzed`, `needs_attention`, `search`), pagination |
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

- **Sidebar toggle on all screen sizes** — Hamburger button is now always visible; clicking it collapses/expands the sidebar on both desktop and mobile. Desktop uses a smooth width animation; mobile uses a slide overlay
- **Edit source** — Pencil icon appears on hover for each source; opens a dialog to update the URL and/or label. Platform is re-detected automatically from the new URL
- **Comment detail dialog** — Click any comment row or mobile card to open a modal with the full text, all AI analysis badges, AI reason, and metadata. Closes via ✕, backdrop click, or Escape
- **"Needs attention" highlighting** — Rows/cards with `needs_attention = true` get an amber left-border accent and background; critical urgency overrides with red (more severe)
- **Analyze only unanalyzed** — "Analyze with AI" already skipped analyzed records; fixed a bug that left the button stuck in loading state when there was nothing to analyze. Now shows "All comments already analyzed" briefly
- **"Hide analyzed" filter** — New checkbox in the toolbar; when checked, only unanalyzed comments are shown. Backed by a new `analyzed` query param on `GET /api/comments`
- **Theme toggle** — New `ThemeToggle` component in the header; switches between light and dark mode, persists to `localStorage`, and respects system preference on first visit
- **Alert badge** — Unresolved alert count shown as a badge on the Alerts tab; updates after every analysis run
- **Stats bar redesign** — Compact metric strip with sentiment breakdown (positive / neutral / negative) inline
- **Platform badge** — Supports `dotOnly` prop for compact inline display; uses design-token colors
- **Component redesign** — `AlertPanel`, `CommentsTable`, `SourcesPanel`, `SentimentBadge`, `SeverityBadge` updated to use CSS design tokens for full theme compatibility
- **Global CSS tokens** — `globals.css` now defines a complete set of light and dark design tokens (`--bg`, `--surface`, `--brand`, `--danger`, `--success`, `--warning`, etc.) toggled via `data-theme` attribute
- **YouTube adapter** — Supports multiple video URLs with `videosUrls` array, `maxComments: 30`, and `orderBy: 'top'`
- **Real-time analysis progress** — Streaming SSE endpoint shows live progress bar and done/total counter
- **Column sorting** — All major columns are sortable with visual indicators
- **Auto-refresh** — Comments view refreshes automatically after fetching or analyzing
- **Deduplication** — Only new comments are stored; duplicates are skipped via unique constraint

## Build for Production

```bash
npm run build
npm start
```

## License

MIT
