'use client';

import { useState, useCallback, useEffect } from 'react';
import { Alert } from '@/lib/types';
import { PlatformBadge } from './PlatformBadge';
import { SentimentBadge } from './SentimentBadge';
import { SeverityBadge } from './SeverityBadge';

interface AlertPanelProps {
  refreshKey?: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

const SEVERITY_BORDER: Record<string, string> = {
  high:   'var(--danger)',
  medium: 'var(--warning)',
  low:    'var(--border-strong)',
};

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

  useEffect(() => { fetchAlerts(); }, [fetchAlerts, refreshKey]);

  async function handleResolve(id: number, resolved: boolean) {
    setResolvingId(id);
    try {
      const res = await fetch(`/api/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved }),
      });
      if (res.ok) await fetchAlerts();
    } finally {
      setResolvingId(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
            Alerts
          </h2>
          {!loading && alerts.length > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 20,
              height: 20,
              padding: '0 6px',
              borderRadius: 'var(--r-full)',
              background: 'var(--danger-muted)',
              color: 'var(--danger-text)',
              fontSize: 11,
              fontWeight: 700,
            }}>
              {alerts.length}
            </span>
          )}
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            style={{ accentColor: 'var(--brand)', width: 14, height: 14 }}
          />
          Show resolved
        </label>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              height: 100,
              borderRadius: 'var(--r-lg)',
              background: 'var(--surface-2)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div style={{
          padding: '48px 24px',
          textAlign: 'center',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--r-lg)',
        }}>
          <p style={{ fontSize: 14, color: 'var(--t3)', lineHeight: 1.5 }}>
            {showResolved ? 'No alerts found.' : "No open alerts \u2014 you're all clear."}
          </p>
        </div>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label="Alerts">
          {alerts.map((alert) => {
            const borderColor = SEVERITY_BORDER[alert.severity] ?? 'var(--border-strong)';
            return (
              <li
                key={alert.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${borderColor}`,
                  borderRadius: 'var(--r-lg)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  opacity: alert.resolved ? 0.6 : 1,
                  transition: 'opacity var(--dur-base)',
                }}
              >
                {/* Row 1: badges + resolve button */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <SeverityBadge severity={alert.severity} />
                    {alert.platform && <PlatformBadge platform={alert.platform} />}
                    {alert.sentiment && <SentimentBadge sentiment={alert.sentiment} />}
                    {alert.urgency && (
                      <span style={{ fontSize: 11, color: 'var(--t3)' }}>
                        urgency: <span style={{ color: 'var(--t2)', fontWeight: 500 }}>{alert.urgency}</span>
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--t4)' }}>{formatDate(alert.created_at)}</span>
                  </div>
                  <button
                    onClick={() => handleResolve(alert.id, !alert.resolved)}
                    disabled={resolvingId === alert.id}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      fontWeight: 500,
                      borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--border)',
                      background: alert.resolved ? 'var(--surface-2)' : 'var(--success-subtle)',
                      color: alert.resolved ? 'var(--t2)' : 'var(--success-text)',
                      cursor: resolvingId === alert.id ? 'not-allowed' : 'pointer',
                      opacity: resolvingId === alert.id ? 0.5 : 1,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'background var(--dur-fast)',
                    }}
                    aria-label={alert.resolved ? 'Reopen alert' : 'Resolve alert'}
                  >
                    {resolvingId === alert.id ? '\u2026' : alert.resolved ? 'Reopen' : '\u2713 Resolve'}
                  </button>
                </div>

                {/* Source */}
                {alert.source_label && (
                  <p style={{ fontSize: 12, color: 'var(--t3)' }}>
                    Source: <span style={{ color: 'var(--t2)', fontWeight: 500 }}>{alert.source_label}</span>
                  </p>
                )}

                {/* Comment quote */}
                {alert.comment_text && (
                  <blockquote style={{
                    padding: '8px 12px',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--r-md)',
                    fontSize: 13,
                    color: 'var(--t1)',
                    lineHeight: 1.5,
                    fontStyle: 'normal',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--t2)' }}>@{alert.comment_author}:</span>{' '}
                    {alert.comment_text}
                  </blockquote>
                )}

                {/* AI reason */}
                <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 600, color: 'var(--t1)' }}>AI:</span> {alert.reason}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
