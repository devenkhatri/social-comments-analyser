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
//   sortBy          - sort column: fetched_at, likes, published_at, author, sentiment, urgency (default: fetched_at)
//   sortOrder       - sort direction: asc or desc (default: desc)
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const sp = request.nextUrl.searchParams;

    const source_id = sp.get('source_id');
    const needs_attention = sp.get('needs_attention');
    const analyzed = sp.get('analyzed'); // 'true' | 'false' | null
    const sentiment = sp.get('sentiment');
    const urgency = sp.get('urgency');
    const search = sp.get('search');
    const page = Math.max(1, Number(sp.get('page') ?? '1'));
    const pageSize = Math.min(200, Math.max(1, Number(sp.get('pageSize') ?? '50')));
    const offset = (page - 1) * pageSize;
    const sortBy = sp.get('sortBy') ?? 'fetched_at';
    const sortOrder = sp.get('sortOrder') === 'asc' ? 'ASC' : 'DESC';

    const validSortColumns: Record<string, string> = {
      fetched_at: 'c.fetched_at',
      likes: 'c.likes',
      published_at: 'c.published_at',
      author: 'c.author',
      sentiment: 'c.sentiment',
      urgency: 'c.urgency',
    };
    const sortColumn = validSortColumns[sortBy] ?? 'c.fetched_at';

    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (source_id) {
      conditions.push('c.source_id = ?');
      values.push(Number(source_id));
    }
    if (needs_attention === 'true') {
      conditions.push('c.needs_attention = 1');
    }
    if (analyzed === 'true') {
      conditions.push('c.analyzed_at IS NOT NULL');
    } else if (analyzed === 'false') {
      conditions.push('c.analyzed_at IS NULL');
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
         ORDER BY ${sortColumn} ${sortOrder}, c.id DESC
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
