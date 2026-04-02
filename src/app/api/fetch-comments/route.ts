import { getDb } from "@/lib/db";
import { runApifyActor } from "@/lib/apify/client";
import { buildInstagramInput, normalizeInstagramComment } from "@/lib/adapters/instagram";
import { buildYouTubeInput, normalizeYouTubeComment } from "@/lib/adapters/youtube";
import { buildTwitterInput, normalizeTwitterComment } from "@/lib/adapters/twitter";
import { Source } from "@/lib/types";

const DEFAULT_ACTOR_IDS: Record<string, string> = {
  instagram: "apify~instagram-comment-scraper",
  youtube: "scrapio~youtube-comments-scraper",
  twitter: "datapilot~twitter-x-comment-scraper",
};

function getActorId(platform: string): string {
  const fromEnv = process.env[`APIFY_ACTOR_${platform.toUpperCase()}`];
  if (fromEnv?.trim()) return fromEnv.trim();
  return DEFAULT_ACTOR_IDS[platform];
}

export async function POST() {
  const db = getDb();

  const sources = db
    .prepare("SELECT * FROM sources WHERE platform IN ('instagram', 'youtube', 'twitter')")
    .all() as Source[];

  if (sources.length === 0) {
    return Response.json({ error: "No sources configured. Add a source first." }, { status: 400 });
  }

  const results: Record<string, { fetched: number; errors: string[] }> = {};
  const now = new Date().toISOString();

  for (const source of sources) {
    results[source.platform] = { fetched: 0, errors: [] };

    try {
      let input: unknown;
      let normalizeFn: (item: Record<string, unknown>) => {
        external_id: string;
        author: string;
        text: string;
        likes: number;
        published_at: string | null;
      } | null;

      switch (source.platform) {
        case "instagram":
          input = buildInstagramInput(source.url);
          normalizeFn = normalizeInstagramComment;
          break;
        case "youtube":
          input = buildYouTubeInput(source.url);
          normalizeFn = normalizeYouTubeComment;
          break;
        case "twitter":
          input = buildTwitterInput(source.url);
          normalizeFn = normalizeTwitterComment;
          break;
        default:
          continue;
      }

      const rawItems = await runApifyActor(getActorId(source.platform), input);

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO comments (source_id, external_id, author, text, likes, published_at, fetched_at)
        VALUES (@source_id, @external_id, @author, @text, @likes, @published_at, @fetched_at)
      `);

      const insertMany = db.transaction((items: Record<string, unknown>[]) => {
        let count = 0;
        for (const item of items) {
          const normalized = normalizeFn(item);
          if (normalized) {
            insertStmt.run({
              source_id: source.id,
              ...normalized,
              fetched_at: now,
            });
            count++;
          }
        }
        return count;
      });

      const count = insertMany(rawItems as Record<string, unknown>[]);
      results[source.platform].fetched = count;

      db.prepare("UPDATE sources SET last_fetched_at = ? WHERE id = ?").run(now, source.id);
    } catch (err) {
      results[source.platform].errors.push(
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  return Response.json({ success: true, results });
}
