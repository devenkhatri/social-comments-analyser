import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

// PATCH /api/alerts/[id] - resolve or unresolve an alert
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { resolved } = body as { resolved?: boolean };

    const db = getDb();
    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(Number(id));
    if (!alert) {
      return Response.json({ error: 'Alert not found' }, { status: 404 });
    }

    db.prepare('UPDATE alerts SET resolved = ? WHERE id = ?').run(
      resolved ? 1 : 0,
      Number(id)
    );

    const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(Number(id));
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
