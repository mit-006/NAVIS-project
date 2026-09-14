import React, { useMemo, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FLOOD_YEARS, getPriorityDistribution, getYearWiseExposedCounts, getExposureColor, EXPOSURE_CATEGORIES, PRIORITY_LEVELS } from '../data/floodData';
import CurrentConditions from '../components/CurrentConditions';
import RealTimeFloodCard from '../components/RealTimeFloodCard';

const PIE_COLORS = PRIORITY_LEVELS.map((l) => l.color);

function FitBounds({ features }) {
  const map = useMap();
  useEffect(() => {
    if (features.length > 0) {
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      features.forEach((f) => {
        const geom = f.geometry;
        if (geom.type === 'Polygon') {
          geom.coordinates[0].forEach(([lng, lat]) => {
            if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
          });
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach((poly) => poly[0].forEach(([lng, lat]) => {
            if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
          }));
        }
      });
      if (minLat !== Infinity) map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [20, 20] });
    }
  }, [features, map]);
  return null;
}

function RainEffect() {
  return (
    <>
      <div className="hero-storm-haze" />
      <div className="hero-rain">
        {Array.from({ length: 80 }, (_, i) => <div key={i} className="rain-drop" />)}
      </div>
      <div className="hero-lightning" />
      <div className="hero-lightning-2" />
    </>
  );
}

export default function Overview({ features, allStats, selectedYear, setSelectedYear, currentStats }) {
  const totalPop = useMemo(() => features.reduce((s, f) => s + (f.properties.TOT_P || 0), 0), [features]);
  const priorityDist = useMemo(() => getPriorityDistribution(features), [features]);
  const yearWiseExposed = useMemo(() => getYearWiseExposedCounts(features), [features]);
  const distData = useMemo(() => PRIORITY_LEVELS.map((l) => ({ name: l.level, value: priorityDist[l.level] })), [priorityDist]);

  const totalCriticalHigh = priorityDist.Critical + priorityDist.High;
  let multiYear = 0, highExposure = 0, neverExposed = 0;
  features.forEach((f) => {
    const freq = f.properties.flood_years_exposed || 0;
    const maxExp = f.properties.max_flood_exposure_pct || 0;
    if (freq >= 2) multiYear++;
    if (maxExp >= 50) highExposure++;
    if (freq === 0) neverExposed++;
  });

  const totalExposed = features.filter((f) => (f.properties.flood_years_exposed || 0) > 0).length;

  const geojsonKey = useMemo(() => `overview-${features.length}`, [features.length]);
  const getFeatureStyle = useCallback((feature) => ({
    fillColor: getExposureColor(feature.properties.max_flood_exposure_pct || 0),
    weight: 1, opacity: 1, color: '#475569', fillOpacity: 0.7,
  }), []);

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-5 md:space-y-6">

        {/* ── OVERVIEW INTELLIGENCE HEADER ── */}
        <div className="navis-overview-intro">
          <div className="relative z-10 p-5 md:p-7">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">Disaster Intelligence Platform</span>
                </div>
                <h1 className="text-xl md:text-2xl lg:text-[1.75rem] font-bold tracking-tight leading-tight font-display text-slate-900 dark:text-white">Spatial Risk Overview</h1>
                <p className="text-[13px] md:text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-xl leading-relaxed">
                  Geospatial assessment of hazard exposure, vulnerable habitations and priority areas across Kamrup Metropolitan, Assam.
                </p>
              </div>
              <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-center w-full sm:w-auto">
                {[
                  { label: 'Study Area', value: 'Kamrup Metro', sub: 'Assam, India' },
                  { label: 'Analysed Hazard', value: 'Flood', sub: 'NDEM Inundation' },
                  { label: 'Analysis Period', value: '1998–2013', sub: `${FLOOD_YEARS.length} events` },
                ].map((item, i) => (
                  <div key={item.label} className={`bg-white dark:bg-slate-900 rounded-lg px-3 py-2.5 border border-slate-200 dark:border-slate-700 ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
                    <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-bold mt-0.5 text-slate-900 dark:text-white">{item.value}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── KEY INDICATORS ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Habitations Assessed', value: '228', sub: 'Census 2011 polygons', accent: '#64748b' },
            { label: 'Historically Exposed', value: totalExposed, sub: `${((totalExposed/228)*100).toFixed(0)}% of total`, accent: '#dc2626' },
            { label: 'Critical + High', value: totalCriticalHigh, sub: 'Analytical priority', accent: '#ea580c' },
            { label: 'Relocation Candidates', value: '76', sub: 'Preliminary suitability', accent: '#2563eb' },
            { label: 'Flood Events Analysed', value: FLOOD_YEARS.length, sub: 'NDEM inundation years', accent: '#0891b2' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl p-4 border transition-shadow hover:shadow-sm" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1 h-4 rounded-full" style={{ backgroundColor: kpi.accent }}></span>
                <p className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{kpi.label}</p>
              </div>
              <p className="text-2xl md:text-[1.75rem] font-bold leading-none stat-number" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* ── MAP + DECISION INTELLIGENCE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Map */}
          <div className="lg:col-span-3 rounded-xl border overflow-hidden" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
              <div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Spatial Risk Snapshot</h2>
                <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>Max historical flood exposure — {features.length} habitations</p>
              </div>
              <Link to="/map" className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium whitespace-nowrap">Explore Flood Map →</Link>
            </div>
            <div className="h-[280px] md:h-[360px] relative">
              <MapContainer center={[26.15, 91.65]} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitBounds features={features} />
                <GeoJSON key={geojsonKey} data={{ type: 'FeatureCollection', features }} style={getFeatureStyle} />
              </MapContainer>
              <div className="absolute bottom-3 left-3 rounded-lg shadow-md p-2.5 z-[1000] border" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <p className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Max Exposure</p>
                <div className="space-y-0.5">
                  {EXPOSURE_CATEGORIES.map((cat) => (
                    <div key={cat.label} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color }}></span>
                      <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{cat.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Decision Intelligence */}
          <div className="lg:col-span-2 rounded-xl border p-4 md:p-5 flex flex-col" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <h2 className="text-sm font-bold mb-4 text-gray-900 dark:text-[#a1a1aa]">Decision Intelligence</h2>
            <div className="space-y-2.5 flex-1">
              {[
                { num: totalExposed, text: `of 228 habitations have historical flood exposure across ${FLOOD_YEARS.length} analysed years.`, accent: '#dc2626', link: '/explorer' },
                { num: multiYear, text: 'habitations experienced exposure in 2+ years, indicating repeated vulnerability.', accent: '#d97706', link: '/historical' },
                { num: totalCriticalHigh, text: 'habitations classified as Critical or High under NAVIS Analytical Priority.', accent: '#ea580c', link: '/priority' },
                { num: '76', text: 'locations identified for Preliminary Relocation Suitability assessment.', accent: '#2563eb', link: '/relocation' },
              ].map((item, i) => (
                <Link key={i} to={item.link} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group border border-transparent hover:border-gray-100 dark:hover:border-white/5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-900 dark:text-[#a1a1aa]" style={{ backgroundColor: item.accent }}>{item.num}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-relaxed text-gray-900 dark:text-[#a1a1aa]">
                      <span className="font-bold">{item.num}</span> {item.text}
                    </p>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Explore →</span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t flex items-center gap-1.5 text-[10px] text-gray-900 dark:text-[#a1a1aa]" style={{ borderColor: 'var(--border-primary)' }}>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Analytical decision-support indicators. Not official classifications.
            </div>
          </div>
        </div>

        {/* ── MULTI-HAZARD READINESS ── */}
        <div className="rounded-xl border p-4 md:p-5" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Multi-Hazard Architecture</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { name: 'Flood', status: 'analysed', detail: '5-year NDEM' },
              { name: 'Landslide', status: 'pending' },
              { name: 'Riverbank Erosion', status: 'pending' },
              { name: 'Extreme Rainfall', status: 'pending' },
              { name: 'Cyclone', status: 'pending' },
              { name: 'Drought', status: 'pending' },
              { name: 'Earthquake', status: 'pending' },
              { name: 'Urban Waterlogging', status: 'pending' },
            ].map((h) => (
              <div key={h.name} className={`rounded-lg p-2.5 border ${
                h.status === 'analysed'
                  ? 'border-blue-200 dark:border-blue-800 ring-1 ring-blue-100 dark:ring-blue-900/50'
                  : ''
              }`} style={h.status !== 'analysed' ? { borderColor: 'var(--border-primary)' } : { background: 'rgba(59,130,246,0.06)' }}>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${h.status === 'analysed' ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                  <span className={`text-[11px] font-semibold ${h.status === 'analysed' ? 'text-blue-700 dark:text-blue-300' : ''}`} style={h.status !== 'analysed' ? { color: 'var(--text-tertiary)' } : {}}>{h.name}</span>
                </div>
                <p className={`text-[10px] mt-0.5 ${h.status === 'analysed' ? 'text-blue-600 dark:text-blue-400' : ''}`} style={h.status !== 'analysed' ? { color: 'var(--text-tertiary)' } : {}}>
                  {h.status === 'analysed' ? h.detail : 'Data pending'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CURRENT CONDITIONS ── */}
        <CurrentConditions />

        {/* ── REAL-TIME FLOOD UPDATES ── */}
        <RealTimeFloodCard />

        {/* ── CHARTS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="rounded-xl border p-4 md:p-5" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={175}>
              <PieChart>
                <Pie data={distData} cx="50%" cy="50%" outerRadius={62} dataKey="value">
                  {distData.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-[10px] mt-1 text-center" style={{ color: 'var(--text-tertiary)' }}>NAVIS Analytical Priority</p>
          </div>

          <div className="lg:col-span-2 rounded-xl border p-4 md:p-5" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Historical Exposure Trend</h3>
              <Link to="/historical" className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">View Full Analysis →</Link>
            </div>
            <ResponsiveContainer width="100%" height={175}>
              <BarChart data={yearWiseExposed} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-secondary)" />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                <Bar dataKey="count" name="Exposed Habitations" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-3 mt-2 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              <span>Source: NDEM / NRSC / ISRO</span>
              <span>•</span>
              <span>Binary inundation data</span>
            </div>
          </div>
        </div>

        {/* ── EXPOSURE SUMMARY ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Multi-Year Exposed', value: multiYear, sub: 'habitations exposed in 2+ years', accent: '#dc2626' },
            { label: 'High Max Exposure', value: highExposure, sub: 'habitations with max exposure ≥ 50%', accent: '#ea580c' },
            { label: 'Never Exposed', value: neverExposed, sub: 'habitations with 0% exposure', accent: '#16a34a' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border p-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1 h-4 rounded-full" style={{ backgroundColor: item.accent }}></span>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{item.label}</p>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{item.sub}</p>
            </div>
          ))}
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="rounded-xl border p-4 md:p-5" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Explore NAVIS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { to: '/map', label: 'Flood Map', desc: 'Interactive exposure map with 228 habitation polygons', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
              { to: '/priority', label: 'Priority Analysis', desc: 'Ranked habitations by analytical priority score', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
              { to: '/relocation', label: 'Relocation Sites', desc: '76 preliminary relocation suitability candidates', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
            ].map((action) => (
              <Link key={action.to} to={action.to} className="flex items-start gap-3 p-3.5 rounded-lg border hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={action.icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" style={{ color: 'var(--text-primary)' }}>{action.label} →</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{action.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── POPULATION + DATA SOURCES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border p-4 md:p-5" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Population Context</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total Population (Census 2011)</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{totalPop.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Estimated Exposed ({selectedYear})</span>
                <span className="text-sm font-bold text-red-600">{(currentStats?.totalExposedPop || 0).toLocaleString()}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40">
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  <span className="font-semibold">Data Transparency:</span> Spatial estimate based on area overlap. NOT actual observed affected population.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border p-4 md:p-5" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Data Sources</h3>
            <div className="space-y-2">
              {[
                { name: 'Census 2011 (PCA-TV)', desc: 'Population, households — 228 habitations', color: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' },
                { name: 'AIKOSH / SHRUG PC11', desc: 'Village polygon geometry — 100% join match', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
                { name: 'NDEM / NRSC / ISRO', desc: 'Historical flood inundation (1998–2013)', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400' },
              ].map((src) => (
                <div key={src.name} className="flex items-center gap-2.5 p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className={`w-7 h-7 ${src.color} rounded-md flex items-center justify-center flex-shrink-0`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{src.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{src.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/methodology" className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium">
              View Full Methodology →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
