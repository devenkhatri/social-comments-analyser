import { Platform, RawComment } from '@/lib/types';
import { buildInstagramInput, normalizeInstagramComment } from '@/lib/adapters/instagram';
import { buildYouTubeInput, normalizeYouTubeComment } from '@/lib/adapters/youtube';
import { buildTwitterInput, normalizeTwitterComment } from '@/lib/adapters/twitter';

const APIFY_BASE_URL = 'https://api.apify.com/v2';

const ACTOR_IDS: Record<Platform, string> = {
  instagram: 'SbK00X0JYCPblD2wp',
  youtube: 'C4ojP3lsPaQotPrz3',
  twitter: 'm2yGezjjPmm4bOvax',
};

type NormalizerFn = (item: Record<string, unknown>) => RawComment | null;

const NORMALIZERS: Record<Platform, NormalizerFn> = {
  instagram: (item) => normalizeInstagramComment(item as Record<string, unknown>),
  youtube: (item) => normalizeYouTubeComment(item as Record<string, unknown>),
  twitter: (item) => normalizeTwitterComment(item as Record<string, unknown>),
};

type InputBuilderFn = (url: string) => Record<string, unknown>;

const INPUT_BUILDERS: Record<Platform, InputBuilderFn> = {
  instagram: buildInstagramInput,
  youtube: buildYouTubeInput,
  twitter: buildTwitterInput,
};

/**
 * Detect the platform from a source URL.
 */
export function detectPlatform(url: string): Platform | null {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    if (hostname === 'instagram.com') return 'instagram';
    if (hostname === 'youtube.com' || hostname === 'youtu.be') return 'youtube';
    if (hostname === 'x.com' || hostname === 'twitter.com') return 'twitter';
  } catch {
    // invalid URL
  }
  return null;
}

/**
 * Run an Apify actor synchronously and return the normalized comments.
 * Uses the run-sync-get-dataset-items endpoint which blocks until the actor
 * finishes and returns dataset items in the same response.
 *
 * Timeout is set to 5 minutes, which should be enough for most scraping jobs.
 */
export async function fetchCommentsFromApify(
  url: string,
  platform: Platform,
  apiToken: string
): Promise<RawComment[]> {
  const actorId = ACTOR_IDS[platform];
  const input = INPUT_BUILDERS[platform](url);
  const normalizer = NORMALIZERS[platform];

  const endpoint = `${APIFY_BASE_URL}/acts/${actorId}/run-sync-get-dataset-items?token=${apiToken}&timeout=300&memory=512`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    // Allow up to 5.5 minutes for the request (actor timeout is 5 minutes)
    signal: AbortSignal.timeout(330_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Apify actor run failed (${response.status}): ${body.slice(0, 500)}`
    );
  }

  const items: Record<string, unknown>[] = await response.json();

  const comments: RawComment[] = [];
  for (const item of items) {
    const normalized = normalizer(item);
    if (normalized) comments.push(normalized);
  }

  return comments;
}
