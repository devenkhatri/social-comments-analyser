import { RawComment } from '@/lib/types';

// Actor: scrapio/youtube-comments-scraper
// Actor ID: mExYO4A2k9976zMfA

interface ApifyYouTubeComment {
  id: string;
  content: string;
  publishedTimeText?: string;
  publishedTime?: string;
  replyLevel?: number;
  author: {
    name: string;
    channelId?: string;
    isVerified?: boolean;
    isCreator?: boolean;
    avatarUrl?: string;
    channelUrl?: string;
  };
  likes?: number;
  replies?: number;
  input?: string;
}

/**
 * Build the Apify run input for the YouTube comments scraper actor.
 * @param url Full YouTube video URL or array of URLs
 */
export function buildYouTubeInput(url: string | string[]): Record<string, unknown> {
  const urls = Array.isArray(url) ? url : [url];
  return {
    maxComments: 30,
    orderBy: 'top',
    videosUrls: urls,
  };
}

/**
 * Normalize a raw Apify YouTube actor dataset item into our common RawComment shape.
 */
export function normalizeYouTubeComment(item: ApifyYouTubeComment): RawComment | null {
  const text = item.content?.trim();
  if (!text) return null;

  const external_id = item.id ?? '';
  if (!external_id) return null;

  const authorName = item.author?.name ?? 'unknown';
  const author = authorName.startsWith('@') ? authorName.slice(1) : authorName;

  return {
    external_id,
    author,
    text,
    likes: item.likes ?? 0,
    published_at: item.publishedTime ?? item.publishedTimeText ?? null,
  };
}
