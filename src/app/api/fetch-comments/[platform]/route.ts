import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { runApifyActor } from "@/lib/apify/client";
import { buildInstagramInput, normalizeInstagramComment } from "@/lib/adapters/instagram";
import { buildYouTubeInput, normalizeYouTubeComment } from "@/lib/adapters/youtube";
import { buildTwitterInput, normalizeTwitterComment } from "@/lib/adapters/twitter";
import { Platform, Source } from "@/lib/types";

const DEFAULT_ACTOR_IDS: Record<Platform, string> = {
  instagram: "apify~instagram-comment-scraper",
  youtube: "LXCwFkJ18vBfDQuHn",
  twitter: "datapilot~twitter-x-comment-scraper",
};

function getActorId(platform: Platform): string {
  const fromEnv = process.env[`APIFY_ACTOR_${platform.toUpperCase()}`];
  if (fromEnv?.trim()) return fromEnv.trim();
  return DEFAULT_ACTOR_IDS[platform];
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  if (!["instagram", "youtube", "twitter"].includes(platform)) {
    return Response.json({ error: "Invalid platform" }, { status: 400 });
  }

  const db = getDb();
  const sources = db
    .prepare("SELECT * FROM sources WHERE platform = ?")
    .all(platform) as Source[];

  if (sources.length === 0) {
    return Response.json(
      { error: `No ${platform} sources configured` },
      { status: 400 }
    );
  }

  let inputFn: (url: string) => Record<string, unknown>;
  let normalizeFn: (item: Record<string, unknown>) => {
    external_id: string;
    author: string;
    text: string;
    likes: number;
    published_at: string | null;
  } | null;

  switch (platform) {
    case "instagram":
      inputFn = buildInstagramInput;
      normalizeFn = normalizeInstagramComment;
      break;
    case "youtube":
      inputFn = buildYouTubeInput;
      normalizeFn = normalizeYouTubeComment;
      break;
    case "twitter":
      inputFn = buildTwitterInput;
      normalizeFn = normalizeTwitterComment;
      break;
    default:
      return Response.json({ error: "Invalid platform" }, { status: 400 });
  }

  const now = new Date().toISOString();
  let totalFetched = 0;
  const errors: string[] = [];

  for (const source of sources) {
    try {
      const rawItems = await runApifyActor(getActorId(platform as Platform), inputFn(source.url));

      const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO comments (source_id, external_id, author, text, likes, published_at, fetched_at)
        VALUES (@source_id, @external_id, @author, @text, @likes, @published_at, @fetched_at)
      `);

      const insertMany = db.transaction((items: Record<string, unknown>[]) => {
        let count = 0;
        for (const item of items) {
          const normalized = normalizeFn(item);
          if (normalized) {
            insertStmt.run({ source_id: source.id, ...normalized, fetched_at: now });
            count++;
          }
        }
        return count;
      });

      const count = insertMany(rawItems as Record<string, unknown>[]);
      totalFetched += count;
      db.prepare("UPDATE sources SET last_fetched_at = ? WHERE id = ?").run(now, source.id);
    } catch (err) {
      errors.push(
        `Source ${source.url}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return Response.json({ success: true, platform, fetched: totalFetched, errors });
}
