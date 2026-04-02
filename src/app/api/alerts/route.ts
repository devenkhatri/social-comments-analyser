import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { Alert } from '@/lib/types';

// GET /api/alerts
// Query params:
//   resolved - "true" to include resolved, "false" (default) for open only
//   source_id - filter by source
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const sp = request.nextUrl.searchParams;
    const resolved = sp.get('resolved');
    const source_id = sp.get('source_id');

    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (resolved !== 'true') {
      conditions.push('a.resolved = 0');
    }
    if (source_id) {
      conditions.push('a.source_id = ?');
      values.push(Number(source_id));
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const alerts = db
      .prepare(
        `SELECT a.*,
                c.text as comment_text,
                c.author as comment_author,
                c.likes as comment_likes,
                c.sentiment,
                s.url as source_url,
                s.label as source_label,
                s.platform
         FROM alerts a
         JOIN comments c ON c.id = a.comment_id
         JOIN sources s ON s.id = a.source_id
         ${where}
         ORDER BY a.created_at DESC
         LIMIT 200`
      )
      .all(...values) as Alert[];

    return Response.json(alerts);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
