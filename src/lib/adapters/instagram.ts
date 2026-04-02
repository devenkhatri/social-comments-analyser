import { RawComment } from '@/lib/types';

// Actor: apify/instagram-comment-scraper
// Actor ID: SbK00X0JYCPblD2wp

interface ApifyInstagramComment {
  id?: string;
  ownerUsername?: string;
  text?: string;
  likesCount?: number;
  timestamp?: string;
  // Some versions use these fields
  commentId?: string;
  username?: string;
}

/**
 * Build the Apify run input for the Instagram comment scraper actor.
 * @param url Full Instagram post URL e.g. https://www.instagram.com/p/ABC123/
 */
export function buildInstagramInput(url: string): Record<string, unknown> {
  return {
    directUrls: [url],
    resultsLimit: 200,
  };
}

/**
 * Normalize a raw Apify Instagram actor dataset item into our common RawComment shape.
 */
export function normalizeInstagramComment(item: ApifyInstagramComment): RawComment | null {
  const text = item.text?.trim();
  if (!text) return null;

  const external_id = item.id ?? item.commentId ?? '';
  if (!external_id) return null;

  return {
    external_id,
    author: item.ownerUsername ?? item.username ?? 'unknown',
    text,
    likes: item.likesCount ?? 0,
    published_at: item.timestamp ?? null,
  };
}
