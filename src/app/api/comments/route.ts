import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { CommentsResponse } from '@/lib/types';

// GET /api/comments
// Query params:
//   source_id       - filter by source
//   needs_attention - "true" to show only comments needing attention
//   sentiment       - filter by sentiment value
//   urgency         - filter by urgency value
//   page            - page number (1-indexed, default 1)
//   pageSize        - items per page (default 50)
//   search          - text search in comment body
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const sp = request.nextUrl.searchParams;

    const source_id = sp.get('source_id');
    const needs_attention = sp.get('needs_attention');
    const sentiment = sp.get('sentiment');
    const urgency = sp.get('urgency');
    const search = sp.get('search');
    const page = Math.max(1, Number(sp.get('page') ?? '1'));
    const pageSize = Math.min(200, Math.max(1, Number(sp.get('pageSize') ?? '50')));
    const offset = (page - 1) * pageSize;

    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (source_id) {
      conditions.push('c.source_id = ?');
      values.push(Number(source_id));
    }
    if (needs_attention === 'true') {
      conditions.push('c.needs_attention = 1');
    }
    if (sentiment && ['positive', 'negative', 'neutral'].includes(sentiment)) {
      conditions.push('c.sentiment = ?');
      values.push(sentiment);
    }
    if (urgency && ['spam', 'low', 'medium', 'high', 'critical'].includes(urgency)) {
      conditions.push('c.urgency = ?');
      values.push(urgency);
    }
    if (search) {
      conditions.push('c.text LIKE ?');
      values.push(`%${search}%`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(
        `SELECT COUNT(*) as n FROM comments c
         JOIN sources s ON s.id = c.source_id
         ${where}`
      )
      .get(...values) as { n: number };

    const comments = db
      .prepare(
        `SELECT c.*,
                s.platform,
                s.url as source_url,
                s.label as source_label
         FROM comments c
         JOIN sources s ON s.id = c.source_id
         ${where}
         ORDER BY c.fetched_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...values, pageSize, offset);

    const response: CommentsResponse = {
      comments: comments as CommentsResponse['comments'],
      total: countRow.n,
      page,
      pageSize,
    };

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
