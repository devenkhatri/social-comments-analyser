'use client';

import { useState, useEffect } from 'react';
import { Source } from '@/lib/types';
import { PlatformBadge } from './PlatformBadge';
import { RefreshIcon, TrashIcon, SpinnerIcon } from './icons';

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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (deletingId === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDeletingId(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deletingId]);

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
    setDeletingId(id);
  }

  async function confirmDelete() {
    if (deletingId === null) return;
    try {
      await fetch(`/api/sources/${deletingId}`, { method: 'DELETE' });
      if (selectedSourceId === deletingId) onSelectSource(null);
      onSourcesChanged();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
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
      <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Sources</h2>

      {/* Add source form */}
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="source-url" className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Social media URL
          </label>
          <input
            id="source-url"
            type="url"
            placeholder="https://instagram.com/p/... or youtube.com/watch?v=..."
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            required
            className="w-full rounded px-3 py-2 text-sm"
            style={{
              border: '1px solid var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="source-label" className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Label <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
          </label>
          <input
            id="source-label"
            type="text"
            placeholder="e.g., Competitor page"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full rounded px-3 py-2 text-sm"
            style={{
              border: '1px solid var(--border-default)',
              background: 'var(--surface-card)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={adding}
          className="rounded px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: 'var(--color-brand-600)' }}
        >
          {adding ? 'Adding\u2026' : 'Add Source'}
        </button>
      </form>

      {error && (
        <p
          className="rounded px-3 py-2 text-sm"
          style={{ background: 'var(--color-danger-50)', color: 'var(--color-danger-700)' }}
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Source list */}
      <ul className="flex flex-col gap-2" aria-label="Sources">
        {sources.length === 0 && (
          <li className="text-sm italic" style={{ color: 'var(--text-tertiary)' }}>No sources yet. Add one above.</li>
        )}
        {sources.map((source) => (
          <li
            key={source.id}
            className={`rounded-lg p-3 cursor-pointer transition-colors`}
            style={{
              border: `1px solid ${selectedSourceId === source.id ? 'var(--color-brand-300)' : 'var(--border-default)'}`,
              background: selectedSourceId === source.id ? 'var(--color-brand-50)' : 'var(--surface-card)',
            }}
            onClick={() =>
              onSelectSource(selectedSourceId === source.id ? null : source.id)
            }
            role="button"
            tabIndex={0}
            aria-pressed={selectedSourceId === source.id}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectSource(selectedSourceId === source.id ? null : source.id);
              }
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {source.label || source.url}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <PlatformBadge platform={source.platform} />
                  {source.last_fetched_at && (
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
                  aria-label={`Fetch new comments for ${source.label || source.url}`}
                  className="rounded p-2.5 transition-colors disabled:opacity-40"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {fetchingId === source.id ? (
                    <SpinnerIcon />
                  ) : (
                    <RefreshIcon />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(source.id);
                  }}
                  title="Delete source"
                  aria-label={`Delete ${source.label || source.url}`}
                  className="rounded p-2.5 transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* In-app confirmation dialog */}
      {deletingId !== null && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setDeletingId(null)}
            aria-hidden="true"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-desc"
            className="fixed inset-x-4 top-[50%] z-50 mx-auto max-w-sm -translate-y-[50%] rounded-lg p-6"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
          >
            <h3 id="confirm-delete-title" className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Delete source?
            </h3>
            <p id="confirm-delete-desc" className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              This will permanently remove this source and all its comments.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="rounded px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded px-4 py-2 text-sm font-medium text-white transition-colors"
                style={{ background: 'var(--color-danger-600)' }}
                autoFocus
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
