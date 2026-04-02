'use client';

import { StatsData } from '@/lib/types';

interface StatCardProps {
  label: string;
  value: number | string;
  color?: string;
}

function StatCard({ label, value, color = 'text-gray-900' }: StatCardProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

export function StatsBar({ stats }: { stats: StatsData | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-lg bg-gray-100" />
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
        color={stats.needs_attention > 0 ? 'text-orange-600' : 'text-gray-900'}
      />
      <StatCard
        label="Critical"
        value={stats.critical.toLocaleString()}
        color={stats.critical > 0 ? 'text-red-600' : 'text-gray-900'}
      />
      <div className="rounded-lg bg-white border border-gray-200 p-4 flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Sentiment split
        </span>
        <div className="flex items-end gap-3 mt-auto">
          <span className="text-sm font-medium text-green-700">
            +{stats.by_sentiment.positive}
          </span>
          <span className="text-sm font-medium text-gray-400">
            ~{stats.by_sentiment.neutral}
          </span>
          <span className="text-sm font-medium text-red-700">
            -{stats.by_sentiment.negative}
          </span>
        </div>
      </div>
    </div>
  );
}
