'use client';

import { useState, useCallback, useEffect } from 'react';
import { Source, StatsData } from '@/lib/types';
import { SourcesPanel } from '@/components/SourcesPanel';
import { CommentsTable } from '@/components/CommentsTable';
import { AlertPanel } from '@/components/AlertPanel';
import { StatsBar } from '@/components/StatsBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CloseIcon, MenuIcon } from '@/components/icons';

type Tab = 'comments' | 'alerts';

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect width="28" height="28" rx="7" fill="var(--brand)" />
      <path d="M8 15.5 C8 11, 10.5 8, 14 8 C17.5 8, 20 11, 20 14.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="19" r="2.2" fill="white" />
    </svg>
  );
}

export default function Dashboard() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<number | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [alertRefreshKey, setAlertRefreshKey] = useState(0);
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('comments');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unresolvedAlerts, setUnresolvedAlerts] = useState(0);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/sources');
      if (res.ok) setSources(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchAlertCount = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (res.ok) {
        const data = await res.json();
        setUnresolvedAlerts(data.filter((a: { resolved: boolean }) => !a.resolved).length);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sourcesRes, statsRes, alertsRes] = await Promise.all([
          fetch('/api/sources'),
          fetch('/api/stats'),
          fetch('/api/alerts'),
        ]);
        if (!cancelled) {
          if (sourcesRes.ok) setSources(await sourcesRes.json());
          if (statsRes.ok) setStats(await statsRes.json());
          if (alertsRes.ok) {
            const alerts = await alertsRes.json();
            setUnresolvedAlerts(alerts.filter((a: { resolved: boolean }) => !a.resolved).length);
          }
        }
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetchAlertCount();
  }, [alertRefreshKey, fetchAlertCount]);

  function handleSourcesChanged() {
    fetchSources();
    fetchStats();
    setCommentsRefreshKey((k) => k + 1);
  }

  function handleAnalyzeDone() {
    fetchStats();
    setAlertRefreshKey((k) => k + 1);
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 14px',
    height: 36,
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 'var(--r-md)',
    border: 'none',
    cursor: 'pointer',
    transition: `background var(--dur-base) var(--ease-out), color var(--dur-base) var(--ease-out)`,
    background: active ? 'var(--brand-subtle)' : 'transparent',
    color: active ? 'var(--brand-text)' : 'var(--t2)',
    letterSpacing: '-0.01em',
  });

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 'var(--header-h)',
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-xs)',
        flexShrink: 0,
      }}>
        <div style={{
          maxWidth: 1600,
          margin: '0 auto',
          padding: '0 20px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--t2)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {sidebarOpen ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
          </button>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0, userSelect: 'none' }}>
            <LogoMark />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', letterSpacing: '-0.02em' }}>
              Comment Monitor
            </span>
          </div>

          {/* Tabs — centered */}
          <nav style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setActiveTab('comments')}
                style={tabStyle(activeTab === 'comments')}
                aria-current={activeTab === 'comments' ? 'page' : undefined}
              >
                Feed
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                style={tabStyle(activeTab === 'alerts')}
                aria-current={activeTab === 'alerts' ? 'page' : undefined}
              >
                Alerts
                {unresolvedAlerts > 0 && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 'var(--r-full)',
                    background: activeTab === 'alerts' ? 'var(--danger)' : 'var(--danger-muted)',
                    color: activeTab === 'alerts' ? 'white' : 'var(--danger-text)',
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: 1,
                  }}>
                    {unresolvedAlerts > 99 ? '99+' : unresolvedAlerts}
                  </span>
                )}
              </button>
            </div>
          </nav>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--t4)', letterSpacing: '0.01em' }} className="hidden sm:block">
              Apify · OpenRouter
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'oklch(0% 0 0 / 0.45)' }}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Desktop sidebar spacer — controls layout space without duplicating content */}
        <div
          className="hidden lg:block flex-shrink-0 overflow-hidden"
          style={{
            width: sidebarOpen ? 'var(--sidebar-w)' : 0,
            transition: 'width 260ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />

        {/* Sidebar — fixed on mobile overlay, fixed on desktop aligned to spacer */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            transition-transform duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]
          `}
          style={{
            width: 'var(--sidebar-w)',
            background: 'var(--sidebar-bg)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflowY: 'auto',
            paddingTop: 'var(--header-h)',
          }}
          aria-label="Sources sidebar"
        >
          <div style={{ padding: '20px 16px', flex: 1 }}>
            <SourcesPanel
              sources={sources}
              selectedSourceId={selectedSourceId}
              onSelectSource={setSelectedSourceId}
              onSourcesChanged={handleSourcesChanged}
            />
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Stats strip */}
          <div style={{
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            flexShrink: 0,
          }}>
            <div style={{ maxWidth: 1340, margin: '0 auto', padding: '0 24px' }}>
              <StatsBar stats={stats} />
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, maxWidth: 1340, margin: '0 auto', width: '100%', padding: '24px' }}>
            {activeTab === 'comments' ? (
              <CommentsTable
                key={commentsRefreshKey}
                sourceId={selectedSourceId}
                onAnalyzeRequest={handleAnalyzeDone}
              />
            ) : (
              <AlertPanel refreshKey={alertRefreshKey} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
