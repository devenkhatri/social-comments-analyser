'use client';

import { useState, useCallback, useEffect } from 'react';
import { Alert } from '@/lib/types';
import { PlatformBadge } from './PlatformBadge';
import { SentimentBadge } from './SentimentBadge';
import { SeverityBadge } from './SeverityBadge';

interface AlertPanelProps {
  refreshKey?: number;
}

export function AlertPanel({ refreshKey }: AlertPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showResolved) params.set('resolved', 'true');
      const res = await fetch(`/api/alerts?${params}`);
      if (res.ok) setAlerts(await res.json());
    } finally {
      setLoading(false);
    }
  }, [showResolved]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts, refreshKey]);

  async function handleResolve(id: number, resolved: boolean) {
    setResolvingId(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved }),
      });
      if (res.ok) {
        await fetchAlerts();
      }
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Alerts
          {alerts.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: 'var(--color-danger-600)' }}>
              {alerts.length}
            </span>
          )}
        </h2>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded accent-[var(--color-brand-600)]"
          />
          Show resolved
        </label>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg" style={{ background: 'var(--surface-muted)' }} />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-lg p-8 text-center text-sm" style={{ border: '1px dashed var(--border-default)', color: 'var(--text-tertiary)' }}>
          {showResolved ? 'No alerts.' : 'No open alerts. Great job keeping things under control.'}
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Alerts list">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="rounded-lg p-4"
              style={{
                border: `1px solid ${alert.resolved ? 'var(--border-default)' : 'var(--color-warning-200)'}`,
                background: alert.resolved ? 'var(--surface-muted)' : 'var(--color-warning-50)',
                opacity: alert.resolved ? 0.7 : 1,
              }}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={alert.severity} />
                  {alert.platform && <PlatformBadge platform={alert.platform} />}
                  {alert.sentiment && <SentimentBadge sentiment={alert.sentiment} />}
                  {alert.urgency && (
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      urgency: {alert.urgency}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleResolve(alert.id, !alert.resolved)}
                  disabled={resolvingId === alert.id}
                  className="shrink-0 rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
                  style={{
                    background: alert.resolved ? 'var(--surface-elevated)' : 'var(--color-success-600)',
                    color: alert.resolved ? 'var(--text-secondary)' : 'white',
                  }}
                  aria-label={alert.resolved ? 'Reopen alert' : 'Resolve alert'}
                >
                  {resolvingId === alert.id ? '\u2026' : alert.resolved ? 'Reopen' : 'Resolve'}
                </button>
              </div>

              {/* Source */}
              {alert.source_label && (
                <p className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Source:{' '}
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{alert.source_label}</span>
                </p>
              )}

              {/* Comment text */}
              {alert.comment_text && (
                <blockquote className="mt-2 rounded px-3 py-2 text-sm italic line-clamp-3" style={{
                  background: 'var(--surface-card)',
                  color: 'var(--text-primary)',
                  borderLeft: '3px solid var(--color-warning-600)',
                }}>
                  <span className="not-italic font-medium" style={{ color: 'var(--text-secondary)' }}>
                    @{alert.comment_author}:
                  </span>{' '}
                  {alert.comment_text}
                </blockquote>
              )}

              {/* Reason */}
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Reason:</span> {alert.reason}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
