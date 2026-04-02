'use client';

import { useState, useCallback, useEffect } from 'react';
import { Source, StatsData } from '@/lib/types';
import { SourcesPanel } from '@/components/SourcesPanel';
import { CommentsTable } from '@/components/CommentsTable';
import { AlertPanel } from '@/components/AlertPanel';
import { StatsBar } from '@/components/StatsBar';

type Tab = 'comments' | 'alerts';

export default function Dashboard() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [alertRefreshKey, setAlertRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('comments');

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
    setAlertRefreshKey((k) => k + 1);
  }

  function handleAnalyzeDone() {
    fetchStats();
    setAlertRefreshKey((k) => k + 1);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Comment Monitor</h1>
          <span className="text-sm text-gray-400">powered by Apify + OpenRouter</span>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Main layout */}
        <div className="flex gap-6">
          {/* Sidebar: Sources */}
          <aside className="w-72 shrink-0">
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
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('comments')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'comments'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Comments
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'alerts'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
              >
                Alerts
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'comments' ? (
              <CommentsTable
                sourceId={selectedSourceId}
                onAnalyzeRequest={handleAnalyzeDone}
              />
            ) : (
              <AlertPanel refreshKey={alertRefreshKey} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
