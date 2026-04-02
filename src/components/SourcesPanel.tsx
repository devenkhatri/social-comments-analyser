'use client';

import { useState } from 'react';
import { Source } from '@/lib/types';
import { PlatformBadge } from './PlatformBadge';

interface SourcesPanelProps {
  sources: Source[];
  selectedSourceId: number | null;
  onSelectSource: (id: number | null) => void;
  onSourcesChanged: () => void;
}

export function SourcesPanel({
  sources,
  selectedSourceId,
  onSelectSource,
  onSourcesChanged,
}: SourcesPanelProps) {
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [fetchingId, setFetchingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim(), label: newLabel.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to add source');
      } else {
        setNewUrl('');
        setNewLabel('');
        onSourcesChanged();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this source and all its comments?')) return;
    try {
      await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      if (selectedSourceId === id) onSelectSource(null);
      onSourcesChanged();
    } catch {
      // ignore
    }
  }

  async function handleFetch(id: number) {
    setFetchingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/sources/${id}/fetch`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Fetch failed');
      } else {
        onSourcesChanged();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setFetchingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800">Sources</h2>

      {/* Add source form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <input
          type="url"
          placeholder="Paste Instagram / YouTube / X URL..."
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          required
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Label (optional)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={adding}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {adding ? 'Adding…' : 'Add Source'}
        </button>
      </form>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* Source list */}
      <ul className="flex flex-col gap-2">
        {sources.length === 0 && (
          <li className="text-sm text-gray-500 italic">No sources yet. Add one above.</li>
        )}
        {sources.map((source) => (
          <li
            key={source.id}
            className={`rounded-lg border p-3 cursor-pointer transition-colors ${
              selectedSourceId === source.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
            onClick={() =>
              onSelectSource(selectedSourceId === source.id ? null : source.id)
            }
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 truncate">
                  {source.label || source.url}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <PlatformBadge platform={source.platform} />
                  {source.last_fetched_at && (
                    <span className="text-xs text-gray-400">
                      Fetched {new Date(source.last_fetched_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFetch(source.id);
                  }}
                  disabled={fetchingId === source.id}
                  title="Fetch new comments"
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-600 disabled:opacity-40"
                >
                  {fetchingId === source.id ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(source.id);
                  }}
                  title="Delete source"
                  className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
