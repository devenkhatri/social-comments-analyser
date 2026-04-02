'use client';

import { Sentiment } from '@/lib/types';

const CONFIG: Record<Sentiment, { label: string; bg: string; text: string }> = {
  positive: { label: '↑ Positive', bg: 'var(--success-subtle)', text: 'var(--success-text)' },
  negative: { label: '↓ Negative', bg: 'var(--danger-subtle)',  text: 'var(--danger-text)'  },
  neutral:  { label: '→ Neutral',  bg: 'var(--surface-2)',      text: 'var(--t3)'            },
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment | null }) {
  if (!sentiment) return null;
  const config = CONFIG[sentiment];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 7px',
        borderRadius: 'var(--r-sm)',
        background: config.bg,
        color: config.text,
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
