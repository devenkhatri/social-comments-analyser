import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { detectPlatform } from '@/lib/apify';
import { Source } from '@/lib/types';

// GET /api/sources - list all sources
export async function GET() {
  try {
    const db = getDb();
    const sources = db.prepare('SELECT * FROM sources ORDER BY created_at DESC').all() as Source[];
    return Response.json(sources);
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// POST /api/sources - create a new source
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, label } = body as { url?: string; label?: string };

    if (!url) {
      return Response.json({ error: 'url is required' }, { status: 400 });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return Response.json(
        { error: 'URL must be from Instagram, YouTube, or X/Twitter' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check for duplicate
    const existing = db
      .prepare('SELECT id FROM sources WHERE url = ?')
      .get(url.trim());
    if (existing) {
      return Response.json({ error: 'This URL is already being tracked' }, { status: 409 });
    }

    const stmt = db.prepare(
      `INSERT INTO sources (url, platform, label) VALUES (?, ?, ?)`
    );
    const result = stmt.run(url.trim(), platform, (label ?? '').trim() || url.trim());

    const source = db
      .prepare('SELECT * FROM sources WHERE id = ?')
      .get(result.lastInsertRowid) as Source;

    return Response.json(source, { status: 201 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
