'use client';

import { StatsData } from '@/lib/types';

function Metric({
  label,
  value,
  valueColor,
  sub,
}: {
  label: string;
  value: string | number;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <div style={{
      flex: 1,
      padding: '14px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: valueColor ?? 'var(--t1)',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {sub && (
          <span style={{ fontSize: 11, color: 'var(--t3)', fontWeight: 500 }}>{sub}</span>
        )}
      </div>
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--t3)',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        lineHeight: 1,
      }}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div style={{
      width: 1,
      alignSelf: 'stretch',
      background: 'var(--border)',
      flexShrink: 0,
      margin: '8px 0',
    }} />
  );
}

export function StatsBar({ stats }: { stats: StatsData | null }) {
  if (!stats) {
    return (
      <div style={{ display: 'flex', height: 64 }} aria-label="Loading statistics">
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
            <div style={{
              width: '80%', height: 20, borderRadius: 'var(--r-sm)',
              background: 'var(--surface-2)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          </div>
        ))}
      </div>
    );
  }

  const attentionPct = stats.total > 0 ? Math.round((stats.needs_attention / stats.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'stretch' }}>
      <Metric label="Total Comments" value={stats.total} />
      <Divider />
      <Metric
        label="Need Attention"
        value={stats.needs_attention}
        valueColor={stats.needs_attention > 0 ? 'var(--warning-text)' : undefined}
        sub={stats.total > 0 ? `${attentionPct}%` : undefined}
      />
      <Divider />
      <Metric
        label="Critical"
        value={stats.critical}
        valueColor={stats.critical > 0 ? 'var(--danger-text)' : undefined}
      />
      <Divider />
      <div style={{ flex: 1, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success-text)', fontVariantNumeric: 'tabular-nums' }}>
            {stats.by_sentiment.positive.toLocaleString()}
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--t3)', marginLeft: 3 }}>pos</span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--border-strong)' }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)', fontVariantNumeric: 'tabular-nums' }}>
            {stats.by_sentiment.neutral.toLocaleString()}
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--t3)', marginLeft: 3 }}>neu</span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--border-strong)' }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger-text)', fontVariantNumeric: 'tabular-nums' }}>
            {stats.by_sentiment.negative.toLocaleString()}
            <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--t3)', marginLeft: 3 }}>neg</span>
          </span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.07em', lineHeight: 1 }}>
          Sentiment
        </span>
      </div>
    </div>
  );
}
