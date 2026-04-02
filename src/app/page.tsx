'use client';

import { useState, useCallback, useEffect } from 'react';
import { Source, StatsData } from '@/lib/types';
import { SourcesPanel } from '@/components/SourcesPanel';
import { CommentsTable } from '@/components/CommentsTable';
import { AlertPanel } from '@/components/AlertPanel';
import { StatsBar } from '@/components/StatsBar';
import { CloseIcon, MenuIcon } from '@/components/icons';

type Tab = 'comments' | 'alerts';

export default function Dashboard() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [alertRefreshKey, setAlertRefreshKey] = useState(0);
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('comments');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) setSources(await res.json());
    } catch {
      // ignore
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sourcesRes, statsRes] = await Promise.all([
          fetch('/api/sources'),
          fetch('/api/stats'),
        ]);
        if (!cancelled) {
          if (sourcesRes.ok) setSources(await sourcesRes.json());
          if (statsRes.ok) setStats(await statsRes.json());
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function handleSourcesChanged() {
    fetchSources();
    fetchStats();
    setCommentsRefreshKey((k) => k + 1);
  }

  function handleAnalyzeDone() {
    fetchStats();
    setAlertRefreshKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-page)' }}>
      {/* Header */}
      <header style={{ background: 'var(--surface-card)', borderBottom: '1px solid var(--border-default)' }} className="px-4 sm:px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden rounded p-2"
            style={{ color: 'var(--text-secondary)' }}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? (
              <CloseIcon />
            ) : (
              <MenuIcon />
            )}
          </button>
          <h1 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Comment Monitor</h1>
          <span className="text-xs sm:text-sm" style={{ color: 'var(--text-tertiary)' }}>powered by Apify + OpenRouter</span>
        </div>
      </header>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Main layout */}
        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* Sidebar: Sources */}
          <aside
            className={`
              fixed lg:static inset-y-0 left-0 z-50 w-72
              transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              lg:transform-none lg:w-72 lg:shrink-0 lg:z-auto
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              pt-20 lg:pt-0 px-4 lg:px-0
            `}
            style={{
              background: 'var(--surface-card)',
              borderRight: '1px solid var(--border-default)',
              boxShadow: sidebarOpen ? 'var(--shadow-lg)' : 'none',
            }}
            aria-label="Sources sidebar"
          >
            <SourcesPanel
              sources={sources}
              selectedSourceId={selectedSourceId}
              onSelectSource={setSelectedSourceId}
              onSourcesChanged={handleSourcesChanged}
            />
          </aside>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <div role="tablist" className="flex border-b mb-4" style={{ borderColor: 'var(--border-default)' }}>
              <button
                role="tab"
                aria-selected={activeTab === 'comments'}
                aria-controls="panel-comments"
                id="tab-comments"
                tabIndex={activeTab === 'comments' ? 0 : -1}
                onClick={() => setActiveTab('comments')}
                className="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: activeTab === 'comments' ? 'var(--color-brand-600)' : 'transparent',
                  color: activeTab === 'comments' ? 'var(--color-brand-600)' : 'var(--text-secondary)',
                }}
              >
                Comments
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'alerts'}
                aria-controls="panel-alerts"
                id="tab-alerts"
                tabIndex={activeTab === 'alerts' ? 0 : -1}
                onClick={() => setActiveTab('alerts')}
                className="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
                style={{
                  borderColor: activeTab === 'alerts' ? 'var(--color-brand-600)' : 'transparent',
                  color: activeTab === 'alerts' ? 'var(--color-brand-600)' : 'var(--text-secondary)',
                }}
              >
                Alerts
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'comments' ? (
              <div role="tabpanel" id="panel-comments" aria-labelledby="tab-comments">
                <CommentsTable
                  key={commentsRefreshKey}
                  sourceId={selectedSourceId}
                  onAnalyzeRequest={handleAnalyzeDone}
                />
              </div>
            ) : (
              <div role="tabpanel" id="panel-alerts" aria-labelledby="tab-alerts">
                <AlertPanel refreshKey={alertRefreshKey} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
