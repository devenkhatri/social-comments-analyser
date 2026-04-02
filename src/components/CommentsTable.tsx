'use client';

import { useState, useCallback, useEffect } from 'react';
import { Comment, CommentsResponse } from '@/lib/types';
import { PlatformBadge } from './PlatformBadge';
import { SentimentBadge } from './SentimentBadge';

const URGENCY_COLOR: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 font-semibold',
  high: 'bg-orange-100 text-orange-800 font-semibold',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-700',
  spam: 'bg-purple-100 text-purple-800',
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
        >
          <input
            type="text"
            placeholder="Search comments…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          )}
        </form>

        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={attentionOnly}
            onChange={(e) => setAttentionOnly(e.target.checked)}
            className="rounded"
          />
          Needs attention only
        </label>

        <div className="ml-auto flex items-center gap-2">
          {data && (
            <span className="text-sm text-gray-500">
              {data.total.toLocaleString()} comment{data.total !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {analyzing ? 'Analyzing…' : 'Analyze with AI'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Author</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Comment</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Platform</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Sentiment</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Urgency</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Likes</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Loading…
                </td>
              </tr>
            ) : data?.comments.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No comments found.
                </td>
              </tr>
            ) : (
              data?.comments.map((comment: Comment) => (
                <tr
                  key={comment.id}
                  className={`hover:bg-gray-50 ${comment.needs_attention ? 'bg-orange-50' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                    @{comment.author}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="line-clamp-2 text-gray-700">{comment.text}</p>
                    {comment.ai_reason && (
                      <p className="mt-1 text-xs text-orange-600 italic">{comment.ai_reason}</p>
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
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${URGENCY_COLOR[comment.urgency] ?? 'bg-gray-100 text-gray-700'}`}>
                        {comment.urgency}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {comment.likes > 0 ? comment.likes.toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {comment.published_at
                      ? new Date(comment.published_at).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
