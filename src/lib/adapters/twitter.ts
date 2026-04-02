import { RawComment } from '@/lib/types';

// Actor: datapilot/twitter-x-comment-scraper
// Actor ID: m2yGezjjPmm4bOvax

interface ApifyTwitterComment {
  id?: string;
  tweetId?: string;
  author?: string;
  username?: string;
  user?: { username?: string; name?: string };
  text?: string;
  fullText?: string;
  likeCount?: number;
  likes?: number;
  favoriteCount?: number;
  createdAt?: string;
  created_at?: string;
}

/**
 * Build the Apify run input for the Twitter/X comment scraper actor.
 * @param url Full X/Twitter tweet URL e.g. https://x.com/user/status/...
 */
export function buildTwitterInput(url: string): Record<string, unknown> {
  return {
    tweetUrls: [url],
    maxReplies: 200,
  };
}

/**
 * Normalize a raw Apify Twitter actor dataset item into our common RawComment shape.
 */
export function normalizeTwitterComment(item: ApifyTwitterComment): RawComment | null {
  const text = (item.text ?? item.fullText ?? '').trim();
  if (!text) return null;

  const external_id = item.id ?? item.tweetId ?? '';
  if (!external_id) return null;

  const author =
    item.username ??
    item.author ??
    item.user?.username ??
    item.user?.name ??
    'unknown';

  return {
    external_id,
    author,
    text,
    likes: item.likeCount ?? item.likes ?? item.favoriteCount ?? 0,
    published_at: item.createdAt ?? item.created_at ?? null,
  };
}
