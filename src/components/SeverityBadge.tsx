'use client';

import { Severity } from '@/lib/types';

const CONFIG: Record<Severity, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-yellow-100 text-yellow-800' },
  medium: { label: 'Medium', color: 'bg-orange-100 text-orange-800' },
  high: { label: 'High', color: 'bg-red-100 text-red-800' },
};

export function SeverityBadge({ severity }: { severity: Severity | null }) {
  if (!severity) return null;
  const config = CONFIG[severity];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  );
}
