import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { runApifyActor } from '@/lib/apify/client';
import { buildInstagramInput, normalizeInstagramComment } from '@/lib/adapters/instagram';
import { buildYouTubeInput, normalizeYouTubeComment } from '@/lib/adapters/youtube';
import { buildTwitterInput, normalizeTwitterComment } from '@/lib/adapters/twitter';
import { Platform, RawComment, Source } from '@/lib/types';

export const maxDuration = 300; // Allow up to 5 min for Apify actor runs

const DEFAULT_ACTOR_IDS: Record<Platform, string> = {
  instagram: 'apify~instagram-comment-scraper',
  youtube: 'scrapio~youtube-comments-scraper',
  twitter: 'datapilot~twitter-x-comment-scraper',
};

function getActorId(platform: Platform): string {
  const fromEnv = process.env[`APIFY_ACTOR_${platform.toUpperCase()}`];
  if (fromEnv?.trim()) return fromEnv.trim();
  return DEFAULT_ACTOR_IDS[platform];
}

type NormalizerFn = (item: Record<string, unknown>) => RawComment | null;

const NORMALIZERS: Record<Platform, NormalizerFn> = {
  instagram: (item) => normalizeInstagramComment(item as never),
  youtube: (item) => normalizeYouTubeComment(item as never),
  twitter: (item) => normalizeTwitterComment(item as never),
};

const INPUT_BUILDERS: Record<Platform, (url: string) => Record<string, unknown>> = {
  instagram: buildInstagramInput,
  youtube: buildYouTubeInput,
  twitter: buildTwitterInput,
};

// POST /api/sources/[id]/fetch
// Runs the Apify actor for the source and persists new comments to SQLite.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!process.env.APIFY_API_TOKEN) {
    return Response.json({ error: 'APIFY_API_TOKEN is not configured' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const db = getDb();

    const source = db
      .prepare('SELECT * FROM sources WHERE id = ?')
      .get(Number(id)) as Source | undefined;

    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }

    const actorId = getActorId(source.platform);
    const input = INPUT_BUILDERS[source.platform](source.url);
    const normalizer = NORMALIZERS[source.platform];

    const rawItems = await runApifyActor(actorId, input);

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO comments
        (source_id, external_id, author, text, likes, published_at, fetched_at)
      VALUES (@source_id, @external_id, @author, @text, @likes, @published_at, datetime('now'))
    `);

    let newCount = 0;
    const insertMany = db.transaction((items: Record<string, unknown>[]) => {
      for (const item of items) {
        const normalized = normalizer(item);
        if (normalized) {
          const info = insertStmt.run({
            source_id: source.id,
            external_id: normalized.external_id,
            author: normalized.author,
            text: normalized.text,
            likes: normalized.likes,
            published_at: normalized.published_at,
          });
          if (info.changes > 0) newCount++;
        }
      }
    });
    insertMany(rawItems as Record<string, unknown>[]);

    // Update last_fetched_at
    db.prepare(`UPDATE sources SET last_fetched_at = datetime('now') WHERE id = ?`).run(
      source.id
    );

    return Response.json({
      fetched: rawItems.length,
      new: newCount,
      source_id: source.id,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
