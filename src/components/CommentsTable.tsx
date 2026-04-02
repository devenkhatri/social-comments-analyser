'use client';

import { useState, useCallback, useEffect } from 'react';
import { Comment, CommentsResponse } from '@/lib/types';
import { PlatformBadge } from './PlatformBadge';
import { SentimentBadge } from './SentimentBadge';
import { SpinnerIcon } from './icons';

const URGENCY_STYLE: Record<string, React.CSSProperties> = {
  critical: { background: 'var(--danger-subtle)', boxShadow: 'inset 3px 0 0 var(--danger)' },
  high:     { background: 'var(--warning-subtle)', boxShadow: 'inset 3px 0 0 var(--warning)' },
  medium:   {},
  low:      {},
  spam:     {},
};

const URGENCY_BADGE: Record<string, React.CSSProperties> = {
  critical: { background: 'var(--danger-muted)',  color: 'var(--danger-text)',  fontWeight: 600 },
  high:     { background: 'var(--warning-muted)', color: 'var(--warning-text)', fontWeight: 600 },
  medium:   { background: 'var(--surface-2)',     color: 'var(--t2)' },
  low:      { background: 'var(--surface-2)',     color: 'var(--t3)' },
  spam:     { background: 'var(--info-subtle)',   color: 'var(--info-text)' },
};

interface CommentsTableProps {
  sourceId?: number | null;
  onAnalyzeRequest?: () => void;
}

interface AnalysisProgress {
  done: number;
  total: number;
  status: string;
  alerts?: number;
  error?: string;
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <span style={{ opacity: 0.3, fontSize: 10 }}>{'\u2195'}</span>;
  return <span style={{ fontSize: 10, color: 'var(--brand)' }}>{dir === 'asc' ? '\u2191' : '\u2193'}</span>;
}

export function CommentsTable({ sourceId, onAnalyzeRequest }: CommentsTableProps) {
  const [data, setData] = useState<CommentsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [sortBy, setSortBy] = useState('fetched_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const pageSize = 50;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sortBy, sortOrder });
      if (sourceId) params.set('source_id', String(sourceId));
      if (attentionOnly) params.set('needs_attention', 'true');
      if (search) params.set('search', search);
      const res = await fetch(`/api/comments?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, sourceId, attentionOnly, search, sortBy, sortOrder]);

  useEffect(() => { setPage(1); }, [sourceId, attentionOnly, search, sortBy, sortOrder]);
  useEffect(() => { fetchComments(); }, [fetchComments]);

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder(column === 'likes' ? 'desc' : 'asc');
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalysisProgress({ done: 0, total: 0, status: 'starting' });
    try {
      const params = new URLSearchParams();
      if (sourceId) params.set('source_id', String(sourceId));
      const res = await fetch(`/api/analyze/stream?${params}`);
      if (!res.ok) {
        const error = await res.json();
        alert(error.error ?? 'Analysis failed');
        setAnalyzing(false);
        setAnalysisProgress(null);
        return;
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { alert('Failed to read response'); setAnalyzing(false); setAnalysisProgress(null); return; }
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.error) {
                const errorMsg = event.error.includes('image input')
                  ? 'This AI model does not support image analysis. Try a different model.'
                  : event.error;
                setAnalyzing(false); setAnalysisProgress(null); alert(errorMsg); return;
              }
              setAnalysisProgress({ done: event.done, total: event.total, status: event.status, alerts: event.alerts });
              if (event.status === 'complete') {
                await fetchComments();
                onAnalyzeRequest?.();
                setAnalyzing(false);
                setTimeout(() => setAnalysisProgress(null), 2000);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      alert(String(err));
      setAnalyzing(false);
      setAnalysisProgress(null);
    }
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const thStyle: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--t3)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    background: 'var(--surface-2)',
  };

  const thSortStyle: React.CSSProperties = {
    ...thStyle,
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        {/* Search */}
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}
          role="search"
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <label htmlFor="comment-search" className="sr-only">Search comments</label>
          <div style={{ position: 'relative' }}>
            <svg
              width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--t3)', pointerEvents: 'none' }}
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              id="comment-search"
              type="text"
              placeholder="Search comments\u2026"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                paddingLeft: 30,
                paddingRight: 10,
                paddingTop: 7,
                paddingBottom: 7,
                fontSize: 13,
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--t1)',
                outline: 'none',
                width: 200,
                transition: 'border-color var(--dur-base)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              style={{ fontSize: 12, color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Attention filter */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={attentionOnly}
            onChange={(e) => setAttentionOnly(e.target.checked)}
            style={{ accentColor: 'var(--brand)', width: 14, height: 14, cursor: 'pointer' }}
          />
          Needs attention
        </label>

        {/* Right: count + analyze */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {data && (
            <span style={{ fontSize: 12, color: 'var(--t3)', fontVariantNumeric: 'tabular-nums' }}>
              {data.total.toLocaleString()} comment{data.total !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 'var(--r-md)',
              border: 'none',
              background: analyzing ? 'var(--brand-subtle)' : 'var(--brand)',
              color: analyzing ? 'var(--brand-text)' : 'var(--t-brand)',
              cursor: analyzing ? 'not-allowed' : 'pointer',
              transition: 'background var(--dur-base)',
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { if (!analyzing) (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = analyzing ? 'var(--brand-subtle)' : 'var(--brand)'; }}
          >
            {analyzing && <SpinnerIcon className="h-3.5 w-3.5" />}
            {analyzing
              ? analysisProgress?.total
                ? `${analysisProgress.done} / ${analysisProgress.total}`
                : 'Starting\u2026'
              : 'Analyze with AI'
            }
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {analyzing && analysisProgress && analysisProgress.total > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 'var(--r-md)',
          background: analysisProgress.status === 'complete' ? 'var(--success-subtle)' : 'var(--brand-subtle)',
          border: `1px solid ${analysisProgress.status === 'complete' ? 'var(--success-muted)' : 'var(--brand-muted)'}`,
        }}>
          <div style={{ flex: 1, height: 3, borderRadius: 'var(--r-full)', background: 'var(--border)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                borderRadius: 'var(--r-full)',
                background: analysisProgress.status === 'complete' ? 'var(--success)' : 'var(--brand)',
                width: `${(analysisProgress.done / analysisProgress.total) * 100}%`,
                transition: 'width 300ms var(--ease-out)',
              }}
            />
          </div>
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            color: analysisProgress.status === 'complete' ? 'var(--success-text)' : 'var(--brand-text)',
            whiteSpace: 'nowrap',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {analysisProgress.status === 'complete'
              ? `Done \u00b7 ${analysisProgress.alerts ?? 0} alert${analysisProgress.alerts !== 1 ? 's' : ''} created`
              : `Analyzing ${analysisProgress.done} of ${analysisProgress.total}`
            }
          </span>
        </div>
      )}

      {/* Desktop table */}
      <div
        className="hidden sm:block overflow-x-auto"
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          background: 'var(--surface)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                { key: 'author', label: 'Author', sortable: true },
                { key: 'comment', label: 'Comment', sortable: false },
                { key: 'platform', label: 'Platform', sortable: false },
                { key: 'sentiment', label: 'Sentiment', sortable: true },
                { key: 'urgency', label: 'Urgency', sortable: true },
                { key: 'likes', label: 'Likes', sortable: true },
                { key: 'published_at', label: 'Date', sortable: true },
              ].map(col => (
                <th
                  key={col.key}
                  style={col.sortable ? thSortStyle : thStyle}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {col.label}
                    {col.sortable && <SortIcon active={sortBy === col.key} dir={sortOrder} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px 14px', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <SpinnerIcon className="h-4 w-4" />
                    Loading comments\u2026
                  </div>
                </td>
              </tr>
            ) : data?.comments.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 14px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--t3)', fontSize: 13 }}>
                    {search || attentionOnly ? 'No comments match your filters.' : 'No comments yet. Add a source and fetch comments to get started.'}
                  </p>
                </td>
              </tr>
            ) : (
              data?.comments.map((comment: Comment) => {
                const urgencyStyle = URGENCY_STYLE[comment.urgency ?? ''] ?? {};
                return (
                  <tr
                    key={comment.id}
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      ...urgencyStyle,
                      transition: 'background var(--dur-fast)',
                    }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', fontSize: 13 }}>
                      <span style={{ color: 'var(--t3)', fontSize: 11 }}>@</span>{comment.author}
                    </td>
                    <td style={{ padding: '10px 14px', maxWidth: 320 }}>
                      <p style={{
                        color: 'var(--t1)',
                        fontSize: 13,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}>
                        {comment.text}
                      </p>
                      {comment.ai_reason && (
                        <p style={{ marginTop: 3, fontSize: 11, color: 'var(--warning-text)', fontStyle: 'italic', lineHeight: 1.3 }}>
                          {comment.ai_reason}
                        </p>
                      )}
                      {!comment.analyzed_at && analyzing && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 3, fontSize: 11, color: 'var(--brand)' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--brand)', animation: 'pulse 1s ease-in-out infinite' }} />
                          Analyzing\u2026
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {comment.platform && <PlatformBadge platform={comment.platform} />}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <SentimentBadge sentiment={comment.sentiment} />
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      {comment.urgency && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 7px',
                          borderRadius: 'var(--r-sm)',
                          fontSize: 11,
                          ...URGENCY_BADGE[comment.urgency],
                        }}>
                          {comment.urgency}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--t2)', fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                      {comment.likes > 0 ? comment.likes.toLocaleString() : <span style={{ color: 'var(--t4)' }}>{'\u2014'}</span>}
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--t3)', fontSize: 11 }}>
                      {comment.published_at ? new Date(comment.published_at).toLocaleDateString() : <span style={{ color: 'var(--t4)' }}>{'\u2014'}</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden flex flex-col gap-2">
        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
            Loading\u2026
          </div>
        ) : data?.comments.length === 0 ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>
            No comments found.
          </div>
        ) : (
          data?.comments.map((comment: Comment) => {
            const urgencyStyle = URGENCY_STYLE[comment.urgency ?? ''] ?? {};
            return (
              <div
                key={comment.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--r-lg)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  ...urgencyStyle,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>
                    <span style={{ color: 'var(--t3)', fontWeight: 400 }}>@</span>{comment.author}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {comment.platform && <PlatformBadge platform={comment.platform} />}
                    <SentimentBadge sentiment={comment.sentiment} />
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--t1)', lineHeight: 1.45 }}>{comment.text}</p>
                {comment.ai_reason && (
                  <p style={{ fontSize: 11, color: 'var(--warning-text)', fontStyle: 'italic' }}>{comment.ai_reason}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {comment.urgency && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 'var(--r-sm)', fontSize: 11, ...URGENCY_BADGE[comment.urgency] }}>
                      {comment.urgency}
                    </span>
                  )}
                  {comment.likes > 0 && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{comment.likes.toLocaleString()} likes</span>}
                  {comment.published_at && <span style={{ fontSize: 11, color: 'var(--t3)' }}>{new Date(comment.published_at).toLocaleDateString()}</span>}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--t2)',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.4 : 1,
            }}
          >
            {'\u2190'} Previous
          </button>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>
            Page <strong style={{ color: 'var(--t2)' }}>{page}</strong> of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              padding: '7px 14px',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--t2)',
              cursor: page === totalPages ? 'not-allowed' : 'pointer',
              opacity: page === totalPages ? 0.4 : 1,
            }}
          >
            Next {'\u2192'}
          </button>
        </div>
      )}
    </div>
  );
}
