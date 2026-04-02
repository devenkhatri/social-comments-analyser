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

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function truncateUrl(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname.replace(/\/$/, '');
    return (u.hostname + path).slice(0, 32) + ((u.hostname + path).length > 32 ? '\u2026' : '');
  } catch {
    return url.slice(0, 32) + (url.length > 32 ? '\u2026' : '');
  }
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--t1)',
  outline: 'none',
  transition: `border-color var(--dur-base) var(--ease-out)`,
  lineHeight: 1.4,
};

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

  async function confirmDelete() {
    if (deletingId === null) return;
    try {
      await fetch(`/api/sources/${deletingId}`, { method: 'DELETE' });
      if (selectedSourceId === deletingId) onSelectSource(null);
      onSourcesChanged();
    } catch { /* ignore */ } finally {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      {/* Section: Add source */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Add Source
        </p>
        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label htmlFor="source-url" style={{ fontSize: 11, fontWeight: 500, color: 'var(--t2)' }}>
              URL
            </label>
            <input
              id="source-url"
              type="url"
              placeholder="youtube.com/watch?v=..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
              style={INPUT_STYLE}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label htmlFor="source-label" style={{ fontSize: 11, fontWeight: 500, color: 'var(--t2)' }}>
              Label <span style={{ color: 'var(--t4)', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="source-label"
              type="text"
              placeholder="e.g. Brand campaign video"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              style={INPUT_STYLE}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            style={{
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 'var(--r-md)',
              border: 'none',
              background: 'var(--brand)',
              color: 'var(--t-brand)',
              cursor: adding ? 'not-allowed' : 'pointer',
              opacity: adding ? 0.6 : 1,
              transition: `opacity var(--dur-base), background var(--dur-base)`,
              letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { if (!adding) (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--brand)'; }}
          >
            {adding ? 'Adding\u2026' : '+ Add Source'}
          </button>
        </form>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 8,
              padding: '8px 10px',
              borderRadius: 'var(--r-md)',
              background: 'var(--danger-subtle)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger-text)',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)' }} />

      {/* Section: Sources list */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Sources {sources.length > 0 && `(${sources.length})`}
        </p>

        {sources.length === 0 ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--r-lg)',
          }}>
            <p style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
              No sources yet.<br />Add one above to get started.
            </p>
          </div>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 2 }} aria-label="Sources">
            {sources.map((source) => {
              const isSelected = selectedSourceId === source.id;
              return (
                <li
                  key={source.id}
                  className="group"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--brand-subtle)' : 'transparent',
                    border: `1px solid ${isSelected ? 'var(--brand-muted)' : 'transparent'}`,
                    transition: `background var(--dur-fast), border-color var(--dur-fast)`,
                  }}
                  onClick={() => onSelectSource(isSelected ? null : source.id)}
                  onMouseEnter={e => {
                    if (!isSelected) (e.currentTarget as HTMLLIElement).style.background = 'var(--surface)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) (e.currentTarget as HTMLLIElement).style.background = 'transparent';
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSource(isSelected ? null : source.id);
                    }
                  }}
                >
                  {/* Platform dot */}
                  <PlatformBadge platform={source.platform} dotOnly />

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: isSelected ? 'var(--brand-text)' : 'var(--t1)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {source.label || truncateUrl(source.url)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t4)', marginTop: 1 }}>
                      {source.last_fetched_at
                        ? `Synced ${formatRelativeDate(source.last_fetched_at)}`
                        : 'Not synced'}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFetch(source.id); }}
                      disabled={fetchingId === source.id}
                      title="Sync comments"
                      aria-label={`Sync ${source.label || source.url}`}
                      style={{
                        width: 26, height: 26,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 'var(--r-sm)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--t3)',
                        cursor: fetchingId === source.id ? 'not-allowed' : 'pointer',
                        opacity: fetchingId === source.id ? 0.5 : 1,
                        transition: 'color var(--dur-fast), background var(--dur-fast)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--t1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--t3)'; }}
                    >
                      {fetchingId === source.id ? <SpinnerIcon className="h-3.5 w-3.5" /> : <RefreshIcon className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingId(source.id); }}
                      title="Delete source"
                      aria-label={`Delete ${source.label || source.url}`}
                      style={{
                        width: 26, height: 26,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 'var(--r-sm)',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--t3)',
                        cursor: 'pointer',
                        transition: 'color var(--dur-fast), background var(--dur-fast)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--danger-subtle)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger-text)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--t3)'; }}
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Delete confirmation */}
      {deletingId !== null && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ background: 'oklch(0% 0 0 / 0.45)' }}
            onClick={() => setDeletingId(null)}
            aria-hidden="true"
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            aria-describedby="confirm-delete-desc"
            className="fixed inset-x-4 z-50 mx-auto max-w-xs"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: 20,
            }}
          >
            <h3 id="confirm-delete-title" style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 6 }}>
              Delete source?
            </h3>
            <p id="confirm-delete-desc" style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>
              This permanently removes this source and all its comments.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => setDeletingId(null)}
                style={{
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--t2)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                autoFocus
                style={{
                  padding: '7px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 'var(--r-md)',
                  border: 'none',
                  background: 'var(--danger)',
                  color: 'white',
                  cursor: 'pointer',
                }}
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
