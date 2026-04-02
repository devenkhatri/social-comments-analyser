## Commands

```bash
npm run dev       # Dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # ESLint
npm start         # Production server (after build)
```

## Environment Variables

Required:
- `APIFY_API_TOKEN` — Apify account token
- `OPENROUTER_API_KEY` — OpenRouter API key

Optional:
- `OPENROUTER_MODEL` — defaults to `openai/gpt-4o-mini`
- `APIFY_ACTOR_INSTAGRAM` — override default actor (`apify~instagram-comment-scraper`)
- `APIFY_ACTOR_YOUTUBE` — override default actor (`LXCwFkJ18vBfDQuHn`)
- `APIFY_ACTOR_TWITTER` — override default actor (`datapilot~twitter-x-comment-scraper`)

## Architecture

Next.js 16 App Router + SQLite (better-sqlite3) + Apify (scraping) + OpenRouter (AI)

```
src/
├── app/api/           # API routes (sources, comments, analyze, alerts, stats, fetch-comments)
├── components/        # React UI components
└── lib/
    ├── adapters/      # Platform input builders + comment normalizers (youtube, twitter, instagram)
    ├── apify/client.ts # Apify actor runner
    ├── analysis.ts    # AI batch analysis with progress callbacks
    ├── db.ts          # SQLite singleton, auto-creates schema on first run
    └── types.ts       # Shared TypeScript types
```

Database: `data/comments.db` (auto-created, gitignored)
Tables: `sources`, `comments` (deduplicated by `source_id+external_id`), `alerts`

## Key Gotchas

- `db.ts` exports a singleton via `getDb()` — always import from there, never instantiate `Database` directly
- Apify actor IDs are overridable via `APIFY_ACTOR_<PLATFORM>` env vars; defaults are hardcoded in `fetch-comments/[platform]/route.ts`
- AI analysis has two endpoints: `POST /api/analyze` (batch, no progress) and `GET /api/analyze/stream` (SSE with live progress)
- `analyzeBatch()` uses `concurrency=3`; chunks of 1 fall back to single-comment mode instead of batch prompt
- `maxDuration = 300` is set on the analyze route for Vercel serverless timeout
- Comments use `INSERT OR IGNORE` with `UNIQUE(source_id, external_id)` for deduplication
