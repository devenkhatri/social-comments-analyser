'use client';

import { Severity } from '@/lib/types';

const CONFIG: Record<Severity, { label: string; bg: string; text: string }> = {
  low: { label: 'Low', bg: 'oklch(95% 0.03 90)', text: 'oklch(45% 0.08 90)' },
  medium: { label: 'Medium', bg: 'var(--color-warning-100)', text: 'var(--color-warning-700)' },
  high: { label: 'High', bg: 'var(--color-danger-100)', text: 'var(--color-danger-700)' },
};

export function SeverityBadge({ severity }: { severity: Severity | null }) {
  if (!severity) return null;
  const config = CONFIG[severity];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ background: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
