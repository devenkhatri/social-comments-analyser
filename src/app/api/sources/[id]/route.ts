import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { detectPlatform } from '@/lib/apify';
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

// PATCH /api/sources/[id] - update label and/or url
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { label, url } = body as { label?: string; url?: string };

    const db = getDb();
    const source = db.prepare('SELECT * FROM sources WHERE id = ?').get(Number(id)) as Source | undefined;
    if (!source) {
      return Response.json({ error: 'Source not found' }, { status: 404 });
    }

    let newUrl = source.url;
    let newPlatform = source.platform;

    if (url && url.trim() !== source.url) {
      newUrl = url.trim();
      const detected = detectPlatform(newUrl);
      if (!detected) {
        return Response.json({ error: 'URL must be from Instagram, YouTube, or X/Twitter' }, { status: 400 });
      }
      newPlatform = detected;
      const duplicate = db.prepare('SELECT id FROM sources WHERE url = ? AND id != ?').get(newUrl, Number(id));
      if (duplicate) {
        return Response.json({ error: 'This URL is already being tracked' }, { status: 409 });
      }
    }

    const newLabel = label !== undefined ? label.trim() : source.label ?? '';

    db.prepare('UPDATE sources SET url = ?, platform = ?, label = ? WHERE id = ?').run(
      newUrl,
      newPlatform,
      newLabel,
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
