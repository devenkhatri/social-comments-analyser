'use client';

import { Platform } from '@/lib/types';

const PLATFORM_CONFIG: Record<Platform, { label: string; color: string }> = {
  instagram: { label: 'Instagram', color: 'bg-pink-100 text-pink-800' },
  youtube: { label: 'YouTube', color: 'bg-red-100 text-red-800' },
  twitter: { label: 'X / Twitter', color: 'bg-sky-100 text-sky-800' },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform] ?? { label: platform, color: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
