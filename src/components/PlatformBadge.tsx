'use client';

import { Platform } from '@/lib/types';

const PLATFORM_CONFIG: Record<Platform, { label: string; dot: string; bg: string; text: string }> = {
  instagram: {
    label: 'Instagram',
    dot: 'oklch(60% 0.20 320)',
    bg: 'oklch(94% 0.04 320)',
    text: 'oklch(38% 0.16 320)',
  },
  youtube: {
    label: 'YouTube',
    dot: 'var(--danger)',
    bg: 'var(--danger-muted)',
    text: 'var(--danger-text)',
  },
  twitter: {
    label: 'X / Twitter',
    dot: 'var(--t2)',
    bg: 'var(--surface-2)',
    text: 'var(--t2)',
  },
};

export function PlatformBadge({ platform, dotOnly = false }: { platform: Platform; dotOnly?: boolean }) {
  const config = PLATFORM_CONFIG[platform] ?? {
    label: platform,
    dot: 'var(--t3)',
    bg: 'var(--surface-2)',
    text: 'var(--t2)',
  };

  if (dotOnly) {
    return (
      <span
        title={config.label}
        style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: config.dot,
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        borderRadius: 'var(--r-sm)',
        background: config.bg,
        color: config.text,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.dot, flexShrink: 0 }} />
      {config.label}
    </span>
  );
}
