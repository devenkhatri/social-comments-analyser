'use client';

import { Sentiment } from '@/lib/types';

const CONFIG: Record<Sentiment, { label: string; bg: string; text: string }> = {
  positive: { label: 'Positive', bg: 'var(--color-success-100)', text: 'var(--color-success-700)' },
  negative: { label: 'Negative', bg: 'var(--color-danger-100)', text: 'var(--color-danger-700)' },
  neutral: { label: 'Neutral', bg: 'var(--surface-muted)', text: 'var(--text-secondary)' },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return null;
  const config = CONFIG[sentiment];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
