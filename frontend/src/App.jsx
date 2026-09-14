import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { loadFloodData, computeAllYearStats } from './data/floodData';
import { loadRelocationData } from './data/relocationData';
import { initAssistant } from './services/navisAssistant';
import { DemoModeProvider } from './demo/DemoModeContext';
import DemoModeToggle from './components/DemoModeToggle';
import DemoBanner from './components/DemoBanner';
import DemoAlertNotification from './components/DemoAlertNotification';
import NavisAssistant from './components/NavisAssistant';
import Overview from './pages/Overview';
import FloodMap from './pages/FloodMap';
import HistoricalAnalysis from './pages/HistoricalAnalysis';
import HabitationExplorer from './pages/HabitationExplorer';
import Methodology from './pages/Methodology';
import PriorityAnalysis from './pages/PriorityAnalysis';
import RelocationSites from './pages/RelocationSites';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/map', label: 'Flood Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { path: '/priority', label: 'Priority Analysis', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  { path: '/historical', label: 'Historical Analysis', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { path: '/explorer', label: 'Habitation Explorer', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
  { path: '/relocation', label: 'Relocation Sites', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
  { path: '/methodology', label: 'Methodology', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
];

const HAZARDS = [
  { id: 'flood', label: 'Flood', status: 'active' },
  { id: 'landslide', label: 'Landslide', status: 'coming-soon' },
  { id: 'erosion', label: 'Riverbank Erosion', status: 'coming-soon' },
  { id: 'rainfall', label: 'Extreme Rainfall', status: 'coming-soon' },
  { id: 'cyclone', label: 'Cyclone', status: 'coming-soon' },
  { id: 'drought', label: 'Drought', status: 'coming-soon' },
  { id: 'earthquake', label: 'Earthquake', status: 'coming-soon' },
  { id: 'waterlogging', label: 'Urban Waterlogging', status: 'coming-soon' },
];

function ThemeToggle({ dark, setDark }) {
  return (
    <button
      onClick={() => setDark(!dark)}
      className="min-h-10 min-w-10 p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-300 hover:text-white inline-flex items-center justify-center"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
    >
      {dark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

function AppLayout() {
  const [geojson, setGeojson] = useState(null);
  const [allStats, setAllStats] = useState(null);
  const [selectedYear, setSelectedYear] = useState(1998);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('navis-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const location = useLocation();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    localStorage.setItem('navis-theme', dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    loadFloodData().then((data) => {
      setGeojson(data);
      setAllStats(computeAllYearStats(data.features));
      loadRelocationData().then((rData) => {
        initAssistant(data.features, rData.features);
      }).catch(() => {
        initAssistant(data.features, []);
      });
    });
  }, []);

  const features = geojson?.features || [];
  const currentStats = allStats?.[selectedYear] || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header className="text-white px-4 md:px-5 py-2 shadow-lg z-[9999] flex-shrink-0 flex items-center gap-3" style={{ background: 'linear-gradient(to right, #0A2530, #123642, #0A2530)' }}>
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden min-h-10 min-w-10 p-2 rounded hover:bg-white/10 transition-colors inline-flex items-center justify-center"
          aria-label="Toggle navigation"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>

        {/* Desktop sidebar toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:inline-flex min-h-10 min-w-10 p-2 rounded hover:bg-white/10 transition-colors items-center justify-center"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {collapsed
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            }
          </svg>
        </button>

        <img src="/assets/navis-logo.png" alt="NAVIS" className="h-8 w-auto flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-sm md:text-base font-bold tracking-tight leading-none font-display">NAVIS</h1>
          <p className="text-[9px] md:text-[10px] text-slate-400 tracking-wide uppercase hidden sm:block">Natural-hazard Assessment & Vulnerability Intelligence System</p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-xs mr-2">
          <span className="text-slate-400">Study Area:</span>
          <span className="font-medium text-white bg-white/10 px-2 py-0.5 rounded">Kamrup Metropolitan, Assam</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs mr-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-green-300 font-medium">Flood</span>
        </div>
        <ThemeToggle dark={dark} setDark={setDark} />
        <DemoModeToggle />
      </header>

      <DemoBanner />
      <DemoAlertNotification />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-[9998] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-[9999]
            lg:z-auto
            ${isMobile
              ? (mobileOpen ? 'translate-x-0' : '-translate-x-full')
              : (collapsed ? 'w-[60px]' : 'w-60')
            }
            ${isMobile ? 'w-[min(80vw,300px)]' : ''}
            flex flex-col border-r transition-all duration-200 ease-in-out
          `}
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', top: isMobile ? 0 : undefined }}
        >
          <nav className="flex-1 overflow-y-auto p-2 pt-2 lg:pt-2 space-y-0.5">
            {!collapsed && <p className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: 'var(--text-tertiary)' }}>Navigation</p>}
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center rounded-lg text-sm font-medium transition-all border ${
                    collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}
                  style={!isActive ? { color: 'var(--text-secondary)' } : {}}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}

            {!collapsed && (
              <div className="pt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: 'var(--text-tertiary)' }}>Hazards</p>
                {HAZARDS.map((h) => (
                  <div
                    key={h.id}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                      h.status === 'active'
                        ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300'
                        : 'cursor-default'
                    }`}
                    style={h.status !== 'active' ? { color: 'var(--text-tertiary)' } : {}}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${h.status === 'active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                    <span className="flex-1">{h.label}</span>
                    {h.status === 'coming-soon' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}>Soon</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {collapsed && (
              <div className="pt-3 flex flex-col items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" title="Flood - Active"></div>
                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600" title="Other hazards - Coming soon"></div>
              </div>
            )}
          </nav>

          {!collapsed && (
            <div className="p-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="rounded-lg p-3 border border-blue-200 dark:border-blue-800" style={{ background: dark ? 'rgba(59,130,246,0.08)' : 'linear-gradient(to bottom right, #eff6ff, #ecfeff)' }}>
                <p className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-1">Flood Data</p>
                <div className="space-y-0.5 text-xs text-blue-700 dark:text-blue-400">
                  <p>Years: 1998, 1999, 2004, 2012, 2013</p>
                  <p>Source: NDEM / NRSC / ISRO</p>
                  <p>228 Habitations</p>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<Overview features={features} allStats={allStats} selectedYear={selectedYear} setSelectedYear={setSelectedYear} currentStats={currentStats} />} />
            <Route path="/map" element={<FloodMap features={features} selectedYear={selectedYear} setSelectedYear={setSelectedYear} currentStats={currentStats} />} />
            <Route path="/historical" element={<HistoricalAnalysis features={features} allStats={allStats} />} />
            <Route path="/explorer" element={<HabitationExplorer features={features} selectedYear={selectedYear} setSelectedYear={setSelectedYear} />} />
            <Route path="/priority" element={<PriorityAnalysis features={features} selectedYear={selectedYear} />} />
            <Route path="/relocation" element={<RelocationSites />} />
            <Route path="/methodology" element={<Methodology />} />
          </Routes>
        </main>
      </div>
      <NavisAssistant />
    </div>
  );
}

function App() {
  return (
    <Router>
      <DemoModeProvider>
        <AppLayout />
      </DemoModeProvider>
    </Router>
  );
}

export default App;
