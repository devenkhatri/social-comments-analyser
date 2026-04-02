import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { analyzeBatch } from '@/lib/analysis';

export const maxDuration = 300;

// Urgency → Alert severity mapping
const URGENCY_SEVERITY: Record<string, 'low' | 'medium' | 'high'> = {
  critical: 'high',
  high: 'high',
  medium: 'medium',
  low: 'low',
  spam: 'low',
};

// POST /api/analyze
// Body: { source_id?: number, model?: string }
export async function POST(request: NextRequest) {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    return Response.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const defaultModel = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';
    const { source_id, model = defaultModel } = body as {
      source_id?: number;
      model?: string;
    };

    const db = getDb();

    const conditions = ['analyzed_at IS NULL'];
    const values: (string | number)[] = [];

    if (source_id) {
      conditions.push('source_id = ?');
      values.push(source_id);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const unanalyzed = db
      .prepare(`SELECT id, text FROM comments ${where} LIMIT 500`)
      .all(...values) as Array<{ id: number; text: string }>;

    if (unanalyzed.length === 0) {
      return Response.json({ analyzed: 0, alerts_created: 0 });
    }

    const results = await analyzeBatch(unanalyzed, openrouterKey, model);

    const updateStmt = db.prepare(`
      UPDATE comments
      SET sentiment = ?,
          intent = ?,
          urgency = ?,
          needs_attention = ?,
          ai_reason = ?,
          analyzed_at = datetime('now')
      WHERE id = ?
    `);

    const insertAlertStmt = db.prepare(`
      INSERT INTO alerts (comment_id, source_id, reason, severity)
      SELECT ?, source_id, ?, ?
      FROM comments WHERE id = ?
    `);

    let alertsCreated = 0;

    const applyResults = db.transaction(() => {
      for (const { id, result } of results) {
        updateStmt.run(
          result.sentiment,
          result.intent,
          result.urgency,
          result.needs_attention ? 1 : 0,
          result.reason,
          id
        );

        if (result.needs_attention) {
          const severity = URGENCY_SEVERITY[result.urgency] ?? 'medium';
          insertAlertStmt.run(id, result.reason, severity, id);
          alertsCreated++;
        }
      }
    });
    applyResults();

    return Response.json({ analyzed: results.length, alerts_created: alertsCreated });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
