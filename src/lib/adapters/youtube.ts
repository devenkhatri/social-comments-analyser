import { RawComment } from '@/lib/types';

// Actor: scrapio/youtube-comments-scraper
// Actor ID: mExYO4A2k9976zMfA

interface ApifyYouTubeComment {
  cid?: string;
  id?: string;
  author?: string;
  authorText?: string;
  text?: string;
  commentText?: string;
  likes?: number;
  likeCount?: number;
  publishedTimeText?: string;
  publishedAt?: string;
}

/**
 * Build the Apify run input for the YouTube comments scraper actor.
 * @param url Full YouTube video URL e.g. https://www.youtube.com/watch?v=...
 */
export function buildYouTubeInput(url: string): Record<string, unknown> {
  return {
    startUrls: [{ url }],
    maxComments: 200,
  };
}

/**
 * Normalize a raw Apify YouTube actor dataset item into our common RawComment shape.
 */
export function normalizeYouTubeComment(item: ApifyYouTubeComment): RawComment | null {
  const text = (item.text ?? item.commentText ?? '').trim();
  if (!text) return null;

  const external_id = item.cid ?? item.id ?? '';
  if (!external_id) return null;

  return {
    external_id,
    author: item.author ?? item.authorText ?? 'unknown',
    text,
    likes: item.likes ?? item.likeCount ?? 0,
    published_at: item.publishedAt ?? item.publishedTimeText ?? null,
  };
}
