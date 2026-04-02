'use client';

import { Severity } from '@/lib/types';

const CONFIG: Record<Severity, { label: string; bg: string; text: string }> = {
  low:    { label: 'Low',    bg: 'var(--surface-2)',     text: 'var(--t2)'         },
  medium: { label: 'Medium', bg: 'var(--warning-muted)', text: 'var(--warning-text)' },
  high:   { label: 'High',   bg: 'var(--danger-muted)',  text: 'var(--danger-text)'  },
};

export function SeverityBadge({ severity }: { severity: Severity | null }) {
  if (!severity) return null;
  const config = CONFIG[severity];
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
        fontWeight: 600,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
