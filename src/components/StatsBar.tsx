'use client';

import { StatsData } from '@/lib/types';

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
}

function StatCard({ label, value, color = 'var(--text-primary)' }: StatCardProps) {
  return (
    <div className="rounded-lg p-4 flex flex-col gap-1" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}>
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <span className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

export function StatsBar({ stats }: { stats: StatsData | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse" aria-label="Loading statistics">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg" style={{ background: 'var(--surface-muted)' }} />
        ))}
      </div>
    );
  }

  const attentionPct =
    stats.total > 0 ? Math.round((stats.needs_attention / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Comments" value={stats.total.toLocaleString()} />
      <StatCard
        label="Needs Attention"
        value={`${stats.needs_attention.toLocaleString()} (${attentionPct}%)`}
        color={stats.needs_attention > 0 ? 'var(--color-warning-600)' : 'var(--text-primary)'}
      />
      <StatCard
        label="Critical"
        value={stats.critical.toLocaleString()}
        color={stats.critical > 0 ? 'var(--color-danger-600)' : 'var(--text-primary)'}
      />
      <div className="rounded-lg p-4 flex flex-col gap-1" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)' }}>
        <span className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
          Sentiment split
        </span>
        <div className="flex items-end gap-3 mt-auto">
          <span className="text-sm font-medium" style={{ color: 'var(--color-success-600)' }}>
            {stats.by_sentiment.positive} <span className="font-normal text-xs" style={{ color: 'var(--text-tertiary)' }}>positive</span>
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {stats.by_sentiment.neutral} <span className="font-normal text-xs">neutral</span>
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--color-danger-600)' }}>
            {stats.by_sentiment.negative} <span className="font-normal text-xs" style={{ color: 'var(--text-tertiary)' }}>negative</span>
          </span>
        </div>
      </div>
    </div>
  );
}
