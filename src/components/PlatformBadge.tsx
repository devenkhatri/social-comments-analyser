'use client';

import { Platform } from '@/lib/types';

const PLATFORM_CONFIG: Record<Platform, { label: string; bg: string; text: string }> = {
  instagram: { label: 'Instagram', bg: 'oklch(93% 0.05 330)', text: 'oklch(40% 0.12 330)' },
  youtube: { label: 'YouTube', bg: 'var(--color-danger-100)', text: 'var(--color-danger-700)' },
  twitter: { label: 'X / Twitter', bg: 'oklch(93% 0.03 250)', text: 'oklch(40% 0.08 250)' },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform] ?? { label: platform, bg: 'var(--surface-muted)', text: 'var(--text-secondary)' };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}
