import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { Source } from '@/lib/types';

// GET /api/sources/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(Number(id)) as Source | undefined;
    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }
    return Response.json(source);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH /api/sources/[id] - update label
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { label } = body as { label?: string };

    const db = getDb();
    const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(Number(id));
    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }

    db.prepare('UPDATE sources SET label = ? WHERE id = ?').run(
      (label ?? '').trim(),
      Number(id)
    );

    const updated = db
      .prepare('SELECT * FROM sources WHERE id = ?')
      .get(Number(id)) as Source;
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE /api/sources/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(Number(id));
    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }
    db.prepare('DELETE FROM sources WHERE id = ?').run(Number(id));
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
