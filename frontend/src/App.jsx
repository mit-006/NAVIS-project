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
  return <button onClick={() => setDark(!dark)} className="navis-icon-btn" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
    {dark ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
  </button>;
}

function useAppData() {
  const [geojson, setGeojson] = useState(null);
  const [allStats, setAllStats] = useState(null);
  const [selectedYear, setSelectedYear] = useState(1998);
  useEffect(() => { loadFloodData().then((data) => { setGeojson(data); setAllStats(computeAllYearStats(data.features)); loadRelocationData().then((rData) => initAssistant(data.features, rData.features)).catch(() => initAssistant(data.features, [])); }); }, []);
  return { features: geojson?.features || [], allStats, selectedYear, setSelectedYear, currentStats: allStats?.[selectedYear] || null };
}

function AppShell({ children, variant }) {
  const [dark, setDark] = useState(() => { const saved = localStorage.getItem('navis-theme'); return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches; });
  useEffect(() => { localStorage.setItem('navis-theme', dark ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', dark); }, [dark]);
  return <div className={`navis-shell navis-${variant}`} style={{background:'var(--bg-primary)'}}>{children(dark,setDark)}</div>;
}

function RoutesView({ features, allStats, selectedYear, setSelectedYear, currentStats }) {
  return <Routes>
    <Route path="/" element={<Overview features={features} allStats={allStats} selectedYear={selectedYear} setSelectedYear={setSelectedYear} currentStats={currentStats} />} />
    <Route path="/map" element={<FloodMap features={features} selectedYear={selectedYear} setSelectedYear={setSelectedYear} currentStats={currentStats} />} />
    <Route path="/historical" element={<HistoricalAnalysis features={features} allStats={allStats} />} />
    <Route path="/explorer" element={<HabitationExplorer features={features} selectedYear={selectedYear} setSelectedYear={setSelectedYear} />} />
    <Route path="/priority" element={<PriorityAnalysis features={features} selectedYear={selectedYear} />} />
    <Route path="/relocation" element={<RelocationSites />} />
    <Route path="/methodology" element={<Methodology />} />
  </Routes>;
}

function NavIcon({d}) { return <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d}/></svg>; }
function App() { const data=useAppData(); return <Router><DemoModeProvider><AppShell variant="map">{(dark,setDark)=><MapLayout {...data} dark={dark} setDark={setDark}/>}</AppShell></DemoModeProvider></Router>; }

function GovHeader({ dark, setDark, mobileOpen, setMobileOpen }) {
  const primary = NAV_ITEMS.slice(0, 6);
  return <>
    <div className="navis-utility-bar">
      <div className="navis-utility-inner">
        <div className="flex items-center gap-4">
          <span className="navis-utility-brand">NAVIS</span>
          <span className="hidden sm:inline">Natural Hazard Assessment & Vulnerability Intelligence System</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:inline">Kamrup Metropolitan, Assam</span>
          <span className="navis-utility-live"><i /> GIS intelligence online</span>
        </div>
      </div>
    </div>
    <header className="navis-public-header">
      <div className="navis-public-inner">
        <NavLink to="/" className="navis-brand-lockup" aria-label="NAVIS home">
          <img src="/assets/navis-logo.png" alt="NAVIS" className="h-10 w-auto" />
          <span className="navis-brand-copy"><strong>NAVIS</strong><small>DISASTER INTELLIGENCE</small></span>
        </NavLink>
        <nav className="navis-public-nav hidden lg:flex" aria-label="Primary navigation">
          {primary.map(i => <NavLink key={i.path} to={i.path} className={({isActive}) => isActive ? 'active' : ''}>{i.label}</NavLink>)}
        </nav>
        <div className="navis-public-actions">
          <ThemeToggle dark={dark} setDark={setDark} />
          <DemoModeToggle />
          <NavLink to="/map" className="navis-header-cta hidden sm:inline-flex">Open GIS Workspace <span>→</span></NavLink>
          <button className="navis-icon-btn lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">☰</button>
        </div>
      </div>
    </header>
    {mobileOpen && <div className="navis-public-mobile lg:hidden">
      {NAV_ITEMS.map(i => <NavLink key={i.path} to={i.path} onClick={() => setMobileOpen(false)}>{i.label}<span>→</span></NavLink>)}
      <NavLink to="/map" onClick={() => setMobileOpen(false)} className="navis-mobile-cta">Open GIS Workspace →</NavLink>
    </div>}
  </>;
}

function LandingHero({ features }) {
  const exposed = features.filter(f => (f.properties?.flood_years_exposed || 0) > 0).length;
  return <section className="navis-landing-hero">
    <div className="navis-hero-grid" />
    <div className="navis-hero-glow navis-hero-glow-a" />
    <div className="navis-hero-glow navis-hero-glow-b" />
    <div className="navis-hero-contours" />
    <div className="navis-hero-inner">
      <div className="navis-hero-copy navis-reveal">
        <div className="navis-eyebrow"><span /> GEOSPATIAL DISASTER INTELLIGENCE</div>
        <h1>Understand risk.<br /><em>Prepare with evidence.</em></h1>
        <p>Spatial assessment of flood exposure, vulnerable habitations and preliminary relocation suitability across Kamrup Metropolitan, Assam.</p>
        <div className="navis-hero-actions">
          <NavLink to="/map" className="navis-primary-btn">Explore Flood Intelligence <span>→</span></NavLink>
          <NavLink to="/methodology" className="navis-secondary-btn">How NAVIS works</NavLink>
        </div>
        <div className="navis-hero-note"><span className="navis-live-dot" /> Five historical flood years analysed · 228 habitation polygons assessed</div>
      </div>
      <div className="navis-hero-visual navis-reveal navis-reveal-delay">
        <div className="navis-map-preview">
          <div className="navis-map-preview-top"><span>LIVE GIS VIEW</span><b>MAX HISTORICAL EXPOSURE</b></div>
          <div className="navis-map-surface">
            <div className="navis-map-river" />
            <div className="navis-map-boundary" />
            <span className="navis-map-pin pin-a" /><span className="navis-map-pin pin-b" /><span className="navis-map-pin pin-c" />
            <div className="navis-map-label label-a">KAMRUP METRO</div>
            <div className="navis-map-label label-b">PRIORITY ZONE</div>
            <div className="navis-map-crosshair" />
          </div>
          <div className="navis-map-preview-footer">
            <div><small>HABITATIONS</small><strong>{features.length || 228}</strong></div>
            <div><small>HISTORICALLY EXPOSED</small><strong>{exposed || 152}</strong></div>
            <div><small>STUDY AREA</small><strong>ASSAM</strong></div>
          </div>
        </div>
      </div>
    </div>
    <div className="navis-scroll-cue"><span /> Scroll to explore</div>
  </section>;
}

function SectionBanner({ pathname }) {
  const item = NAV_ITEMS.find(x => x.path === pathname);
  if (!item || pathname === '/') return null;
  const descriptions = {
    '/map': 'Explore historical flood exposure, live conditions and habitation-level intelligence.',
    '/priority': 'Identify analytical priority areas using transparent historical exposure indicators.',
    '/historical': 'Compare flood exposure patterns across the analysed historical years.',
    '/explorer': 'Inspect habitation-level exposure, population and risk context.',
    '/relocation': 'Review preliminary relocation suitability candidates and their scoring context.',
    '/methodology': 'Understand the datasets, calculations, assumptions and current limitations behind NAVIS.'
  };
  return <section className="navis-section-banner">
    <div className="navis-section-banner-grid" />
    <div className="navis-section-banner-inner">
      <div><span className="navis-eyebrow"><span /> NAVIS INTELLIGENCE WORKSPACE</span><h1>{item.label}</h1><p>{descriptions[pathname]}</p></div>
      <NavLink to="/map" className="navis-banner-cta">Open GIS Workspace <span>→</span></NavLink>
    </div>
  </section>;
}

function SiteFooter() {
  return <footer className="navis-site-footer">
    <div className="navis-footer-main">
      <div className="navis-footer-brand"><img src="/assets/navis-logo.png" alt="NAVIS" /><p>Natural Hazard Assessment & Vulnerability Intelligence System for spatial disaster-risk analysis.</p></div>
      <div><h3>Explore</h3>{NAV_ITEMS.slice(0,4).map(i=><NavLink key={i.path} to={i.path}>{i.label}</NavLink>)}</div>
      <div><h3>Decision Support</h3><NavLink to="/relocation">Relocation Sites</NavLink><NavLink to="/priority">Priority Analysis</NavLink><NavLink to="/methodology">Methodology</NavLink></div>
      <div><h3>Scope</h3><p>Kamrup Metropolitan, Assam</p><p>Flood analysis · 1998–2013</p><p>228 habitation polygons</p></div>
    </div>
    <div className="navis-footer-bottom"><span>© NAVIS · SIH project build</span><span>Analytical decision-support system · Not an official emergency directive</span></div>
  </footer>;
}

function MapLayout({features,allStats,selectedYear,setSelectedYear,currentStats,dark,setDark}) {
  const loc=useLocation();
  const [open,setOpen]=useState(false);
  const isOverview = loc.pathname === '/';
  const isMap = loc.pathname === '/map';
  return <div className="navis-public-shell">
    <GovHeader dark={dark} setDark={setDark} mobileOpen={open} setMobileOpen={setOpen}/>
    <DemoBanner/><DemoAlertNotification/>
    {isOverview && <LandingHero features={features}/>} 
    {!isOverview && <SectionBanner pathname={loc.pathname}/>} 
    <div className={`navis-route-area ${isMap ? 'navis-route-map' : ''}`}>
      <RoutesView {...{features,allStats,selectedYear,setSelectedYear,currentStats}}/>
    </div>
    {!isMap && <SiteFooter/>}
    <NavisAssistant/>
  </div>;
}
export default App;
