import { getDb } from '@/lib/db';
import { StatsData } from '@/lib/types';

// GET /api/stats - dashboard statistics
export async function GET() {
  try {
    const db = getDb();

    const totalRow = db.prepare('SELECT COUNT(*) as n FROM comments').get() as { n: number };
    const attentionRow = db
      .prepare('SELECT COUNT(*) as n FROM comments WHERE needs_attention = 1')
      .get() as { n: number };
    const criticalRow = db
      .prepare("SELECT COUNT(*) as n FROM comments WHERE urgency = 'critical'")
      .get() as { n: number };
    const unanalyzedRow = db
      .prepare('SELECT COUNT(*) as n FROM comments WHERE analyzed_at IS NULL')
      .get() as { n: number };

    const byPlatform = db
      .prepare(
        `SELECT s.platform, COUNT(c.id) as n
         FROM comments c JOIN sources s ON s.id = c.source_id
         GROUP BY s.platform`
      )
      .all() as Array<{ platform: string; n: number }>;

    const bySentiment = db
      .prepare(
        `SELECT sentiment, COUNT(*) as n
         FROM comments
         WHERE sentiment IS NOT NULL
         GROUP BY sentiment`
      )
      .all() as Array<{ sentiment: string; n: number }>;

    const byUrgency = db
      .prepare(
        `SELECT urgency, COUNT(*) as n
         FROM comments
         WHERE urgency IS NOT NULL
         GROUP BY urgency`
      )
      .all() as Array<{ urgency: string; n: number }>;

    const stats: StatsData = {
      total: totalRow.n,
      needs_attention: attentionRow.n,
      critical: criticalRow.n,
      unanalyzed: unanalyzedRow.n,
      by_platform: {
        instagram: 0,
        youtube: 0,
        twitter: 0,
        ...Object.fromEntries(byPlatform.map((r) => [r.platform, r.n])),
      },
      by_sentiment: {
        positive: 0,
        negative: 0,
        neutral: 0,
        ...Object.fromEntries(bySentiment.map((r) => [r.sentiment, r.n])),
      },
      by_urgency: {
        spam: 0,
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
        ...Object.fromEntries(byUrgency.map((r) => [r.urgency, r.n])),
      },
    };

    return Response.json(stats);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
