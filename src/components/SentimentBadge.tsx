'use client';

import { Sentiment } from '@/lib/types';

const CONFIG: Record<Sentiment, { label: string; color: string }> = {
  positive: { label: 'Positive', color: 'bg-green-100 text-green-800' },
  negative: { label: 'Negative', color: 'bg-red-100 text-red-800' },
  neutral: { label: 'Neutral', color: 'bg-gray-100 text-gray-700' },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return null;
  const config = CONFIG[sentiment];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
