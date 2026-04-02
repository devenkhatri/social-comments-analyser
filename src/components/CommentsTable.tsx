'use client';

import { useState, useCallback, useEffect } from 'react';
import { Comment, CommentsResponse } from '@/lib/types';
import { PlatformBadge } from './PlatformBadge';
import { SentimentBadge } from './SentimentBadge';

const URGENCY_COLOR: Record<string, string> = {
  critical: 'bg-[var(--color-danger-100)] text-[var(--color-danger-700)] font-semibold',
  high: 'bg-[var(--color-warning-100)] text-[var(--color-warning-700)] font-semibold',
  medium: 'bg-[var(--color-warning-50)] text-[var(--color-warning-600)]',
  low: 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
  spam: 'bg-[var(--color-info-100)] text-[var(--color-info-600)]',
};

interface CommentsTableProps {
  sourceId?: number | null;
  onAnalyzeRequest?: () => void;
}

export function CommentsTable({ sourceId, onAnalyzeRequest }: CommentsTableProps) {
  const [data, setData] = useState<CommentsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const pageSize = 50;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (sourceId) params.set('source_id', String(sourceId));
      if (attentionOnly) params.set('needs_attention', 'true');
      if (search) params.set('search', search);

      const res = await fetch(`/api/comments?${params}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [page, sourceId, attentionOnly, search]);

  useEffect(() => {
    setPage(1);
  }, [sourceId, attentionOnly, search]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const body: Record<string, unknown> = {};
      if (sourceId) body.source_id = sourceId;
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (res.ok) {
        await fetchComments();
        onAnalyzeRequest?.();
      } else {
        alert(result.error ?? 'Analysis failed');
      }
    } finally {
      setAnalyzing(false);
    }
  }

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
          }}
          className="flex items-center gap-2"
          role="search"
        >
          <label htmlFor="comment-search" className="sr-only">Search comments</label>
          <input
            id="comment-search"
            type="text"
            placeholder="Search comments\u2026"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded px-3 py-1.5 text-sm"
            style={{
              border: '1px solid var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            className="rounded px-3 py-1.5 text-sm transition-colors"
            style={{
              background: 'var(--surface-muted)',
              color: 'var(--text-secondary)',
            }}
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="text-sm transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Clear
            </button>
          )}
        </form>

        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={attentionOnly}
            onChange={(e) => setAttentionOnly(e.target.checked)}
            className="rounded accent-[var(--color-brand-600)]"
          />
          Needs attention only
        </label>

        <div className="ml-auto flex items-center gap-2">
          {data && (
            <span className="text-sm tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
              {data.total.toLocaleString()} comment{data.total !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="rounded px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            style={{ background: 'var(--color-info-600)' }}
          >
            {analyzing ? 'Analyzing\u2026' : 'Analyze with AI'}
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-lg" style={{ border: '1px solid var(--border-default)' }}>
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--surface-muted)' }}>
            <tr>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Author</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Comment</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Platform</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Sentiment</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Urgency</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Likes</th>
              <th className="px-4 py-3 text-left font-medium" style={{ color: 'var(--text-secondary)' }}>Date</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                  Fetching comments\u2026
                </td>
              </tr>
            ) : data?.comments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
                  No comments yet. Add a source above and fetch comments to get started.
                </td>
              </tr>
            ) : (
              data?.comments.map((comment: Comment) => (
                <tr
                  key={comment.id}
                  style={{
                    background: comment.needs_attention ? 'var(--color-warning-50)' : undefined,
                  }}
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    @{comment.author}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-2" style={{ color: 'var(--text-primary)' }}>{comment.text}</p>
                    {comment.ai_reason && (
                      <p className="mt-1 text-xs italic" style={{ color: 'var(--color-warning-600)' }}>{comment.ai_reason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {comment.platform && <PlatformBadge platform={comment.platform} />}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <SentimentBadge sentiment={comment.sentiment} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {comment.urgency && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${URGENCY_COLOR[comment.urgency] ?? 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'}`}>
                        {comment.urgency}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {comment.likes > 0 ? comment.likes.toLocaleString() : '\u2014'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {comment.published_at
                      ? new Date(comment.published_at).toLocaleDateString()
                      : '\u2014'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden flex flex-col gap-3">
        {loading ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Fetching comments\u2026
          </div>
        ) : data?.comments.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
            No comments yet. Add a source above and fetch comments to get started.
          </div>
        ) : (
          data?.comments.map((comment: Comment) => (
            <div
              key={comment.id}
              className="rounded-lg p-3 flex flex-col gap-2"
              style={{
                background: comment.needs_attention ? 'var(--color-warning-50)' : 'var(--surface-card)',
                border: `1px solid var(--border-default)`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  @{comment.author}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {comment.platform && <PlatformBadge platform={comment.platform} />}
                  <SentimentBadge sentiment={comment.sentiment} />
                </div>
              </div>
              <p className="text-sm line-clamp-3" style={{ color: 'var(--text-primary)' }}>{comment.text}</p>
              {comment.ai_reason && (
                <p className="text-xs italic" style={{ color: 'var(--color-warning-600)' }}>{comment.ai_reason}</p>
              )}
              <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {comment.urgency && (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${URGENCY_COLOR[comment.urgency] ?? 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'}`}>
                    {comment.urgency}
                  </span>
                )}
                {comment.likes > 0 && <span>{comment.likes.toLocaleString()} likes</span>}
                {comment.published_at && <span>{new Date(comment.published_at).toLocaleDateString()}</span>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
            style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Previous
          </button>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded px-3 py-1.5 text-sm transition-colors disabled:opacity-40"
            style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
