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
        <h2 className="text-lg font-semibold text-gray-800">
          Alerts
          {alerts.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              {alerts.length}
            </span>
          )}
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            className="rounded"
          />
          Show resolved
        </label>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
          {showResolved ? 'No alerts.' : 'No open alerts.'}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={`rounded-lg border p-4 ${
                alert.resolved
                  ? 'border-gray-200 bg-gray-50 opacity-70'
                  : 'border-orange-200 bg-orange-50'
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={alert.severity} />
                  {alert.platform && <PlatformBadge platform={alert.platform} />}
                  {alert.sentiment && <SentimentBadge sentiment={alert.sentiment} />}
                  {alert.urgency && (
                    <span className="text-xs text-gray-500 font-medium">
                      urgency: {alert.urgency}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => handleResolve(alert.id, !alert.resolved)}
                  disabled={resolvingId === alert.id}
                  className={`shrink-0 rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                    alert.resolved
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {resolvingId === alert.id ? '…' : alert.resolved ? 'Reopen' : 'Resolve'}
                </button>
              </div>

              {/* Source */}
              {alert.source_label && (
                <p className="mt-2 text-xs text-gray-500">
                  Source:{' '}
                  <span className="font-medium text-gray-700">{alert.source_label}</span>
                </p>
              )}

              {/* Comment text */}
              {alert.comment_text && (
                <blockquote className="mt-2 rounded bg-white px-3 py-2 text-sm text-gray-700 border-l-4 border-orange-400 italic line-clamp-3">
                  <span className="not-italic font-medium text-gray-500">
                    @{alert.comment_author}:
                  </span>{' '}
                  {alert.comment_text}
                </blockquote>
              )}

              {/* Reason */}
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Reason:</span> {alert.reason}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
