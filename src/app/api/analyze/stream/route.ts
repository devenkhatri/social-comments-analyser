import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { analyzeBatch } from '@/lib/analysis';

export const maxDuration = 300;

const URGENCY_SEVERITY: Record<string, 'low' | 'medium' | 'high'> = {
  critical: 'high',
  high: 'high',
  medium: 'medium',
  low: 'low',
  spam: 'low',
};

export async function GET(request: NextRequest) {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    return Response.json({ error: 'OPENROUTER_API_KEY is not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('source_id');
  const defaultModel = process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini';
  const model = searchParams.get('model') ?? defaultModel;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const db = getDb();

        const conditions = ['analyzed_at IS NULL'];
        const values: (string | number)[] = [];

        if (sourceId) {
          conditions.push('source_id = ?');
          values.push(Number(sourceId));
        }

        const where = `WHERE ${conditions.join(' AND ')}`;

        const unanalyzed = db
          .prepare(`SELECT id, text FROM comments ${where} LIMIT 500`)
          .all(...values) as Array<{ id: number; text: string }>;

        const total = unanalyzed.length;

        if (total === 0) {
          controller.enqueue(encoder.encode(`data: {"done":0,"total":0,"message":"No comments to analyze"}\n\n`));
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(`data: {"done":0,"total":${total},"status":"starting"}\n\n`));

        const results = await analyzeBatch(unanalyzed, openrouterKey, model, 3, (processed) => {
          controller.enqueue(encoder.encode(`data: {"done":${processed},"total":${total},"status":"processing"}\n\n`));
        });

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
        let processed = 0;

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
            processed++;
          }
        });
        applyResults();

        controller.enqueue(encoder.encode(`data: {"done":${total},"total":${total},"alerts":${alertsCreated},"status":"complete"}\n\n`));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: {"error":"${String(error).replace(/"/g, "'")}"}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}