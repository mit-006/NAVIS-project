import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { loadRelocationData, getSuitabilityLevel, getSuitabilityDistribution, getScoreBreakdown, filterCandidates, SCORING_WEIGHTS } from '../data/relocationData';

function FitBounds({ features }) {
  const map = useMap();
  useEffect(() => {
    if (features.length === 0) return;
    const coords = features.flatMap((f) => {
      const geom = f.geometry;
      if (geom.type === 'Point') return [[geom.coordinates[1], geom.coordinates[0]]];
      if (geom.type === 'Polygon') return geom.coordinates[0].map((c) => [c[1], c[0]]);
      return [];
    });
    if (coords.length > 0) {
      const lats = coords.map((c) => c[0]);
      const lngs = coords.map((c) => c[1]);
      map.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [20, 20] });
    }
  }, [features, map]);
  return null;
}

function getGeometryCentroid(geometry) {
  const coords = [];
  if (geometry.type === 'Point') {
    return [geometry.coordinates[1], geometry.coordinates[0]];
  }
  if (geometry.type === 'Polygon') {
    geometry.coordinates[0].forEach((c) => coords.push(c));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((poly) => poly[0].forEach((c) => coords.push(c)));
  }
  if (coords.length === 0) return [0, 0];
  const avgLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  return [avgLat, avgLng];
}

function CandidateMarker({ feature, isSelected, onClick }) {
  const p = feature.properties;
  const lvl = getSuitabilityLevel(p.suitability_score);
  const radius = isSelected ? 10 : 7;
  const center = useMemo(() => getGeometryCentroid(feature.geometry), [feature]);
  return (
    <CircleMarker
      center={center}
      radius={radius}
      pathOptions={{
        color: isSelected ? '#1e40af' : lvl.color,
        fillColor: lvl.color,
        fillOpacity: isSelected ? 0.9 : 0.7,
        weight: isSelected ? 3 : 2,
      }}
      eventHandlers={{ click: () => onClick(feature) }}
    >
      <Popup>
        <div className="text-sm">
          <p className="font-bold">{p.candidate_id}: {p.tv_name}</p>
          <p>Score: {p.suitability_score} ({p.suitability_class})</p>
          <p>Elevation: {p.elevation_m}m | Slope: {p.slope_deg.toFixed(1)} deg</p>
          <p>Road: {p.distance_to_major_road_km.toFixed(1)}km</p>
        </div>
      </Popup>
    </CircleMarker>
  );
}

function DetailPanel({ feature, onClose }) {
  const p = feature.properties;
  const lvl = getSuitabilityLevel(p.suitability_score);
  const breakdown = getScoreBreakdown(feature);

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-[1000] flex flex-col border-l border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-5 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-300 uppercase tracking-wider">Candidate Site</p>
            <h3 className="text-lg font-bold mt-0.5">{p.candidate_id}: {p.tv_name}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="px-3 py-1 rounded-full text-sm font-bold" style={{ backgroundColor: `${lvl.color}22`, color: lvl.color, border: `1px solid ${lvl.color}44` }}>
            {p.suitability_score} — {p.suitability_class}
          </span>
          <span className="text-xs text-slate-400">Preliminary Score</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <InfoCard label="Elevation" value={`${p.elevation_m}m`} sub={p.elevation_band} />
          <InfoCard label="Slope" value={`${p.slope_deg.toFixed(1)} deg`} />
          <InfoCard label="Road Access" value={`${p.distance_to_major_road_km.toFixed(1)} km`} sub={p.road_access_band} />
          <InfoCard label="Population" value={p.TOT_P.toLocaleString()} sub={`${p.P_06 || 0} children`} />
          <InfoCard label="SC Population" value={(p.P_SC || 0).toLocaleString()} />
          <InfoCard label="ST Population" value={(p.P_ST || 0).toLocaleString()} />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Flood History</p>
          <p className="text-sm text-amber-900">
            Exposed in <span className="font-bold">{p.exposed_years}</span> of 5 historical years
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Max exposure: {p.max_exposure_pct.toFixed(1)}% | Frequency: {(p.frequency_pct * 100).toFixed(0)}%
          </p>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-2">Habitation Proximity</h4>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Nearest Exposed" value={`${p.distance_to_nearest_exposed_km.toFixed(1)} km`} />
            <InfoCard label="Nearby Vulnerable Pop" value={p.nearby_vulnerable_pop.toLocaleString()} sub={`${p.nearby_exposed_habs} habitations within 5km`} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-2">Amenities Score</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">Village amenities availability</span>
              <span className="text-sm font-bold text-gray-900">{p.amenities_score.toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${p.amenities_score}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">Based on Census 2011: schools, health, water, transport, banking</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-2">Score Breakdown</h4>
          <div className="space-y-2">
            {breakdown.map((row) => (
              <div key={row.factor} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-28 flex-shrink-0">{row.factor} ({row.weight})</span>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${(row.normalized / row.max) * 100}%`, backgroundColor: getSuitabilityLevel(row.normalized / row.max * 100).color }} />
                  </div>
                </div>
                <span className="text-xs font-mono text-gray-700 w-12 text-right">{row.normalized}</span>
                <span className="text-xs text-gray-400">/ {row.max}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900">Total Score</span>
            <span className="text-lg font-bold" style={{ color: lvl.color }}>{p.suitability_score}</span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-bold text-gray-900 mb-2">Why This Candidate?</h4>
          <ul className="text-xs text-gray-600 space-y-1.5">
            {p.elevation_m >= 100 && <li>Elevation of {p.elevation_m}m is above the primary floodplain zone.</li>}
            {p.elevation_m < 100 && <li>Elevation of {p.elevation_m}m is low — may still face some flood risk in extreme events.</li>}
            {p.slope_deg <= 10 && <li>Relatively flat terrain ({p.slope_deg.toFixed(1)} deg) suitable for construction.</li>}
            {p.slope_deg > 10 && <li>Steeper slope ({p.slope_deg.toFixed(1)} deg) — construction may require terracing.</li>}
            {p.distance_to_major_road_km <= 2 && <li>Within {p.distance_to_major_road_km.toFixed(1)}km of a major road — good evacuation access.</li>}
            {p.distance_to_major_road_km > 2 && <li>{p.distance_to_major_road_km.toFixed(1)}km from nearest major road — moderate accessibility.</li>}
            {p.amenities_score > 30 && <li>Existing amenities score of {p.amenities_score.toFixed(0)} indicates some facilities are available.</li>}
            {p.amenities_score <= 30 && <li>Low amenities score ({p.amenities_score.toFixed(0)}) — new infrastructure would be needed.</li>}
            {p.nearby_vulnerable_pop > 5000 && <li>{p.nearby_vulnerable_pop.toLocaleString()} vulnerable people within 5km — high relocation utility.</li>}
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">Pending Validation</p>
          <ul className="text-xs text-red-700 space-y-1">
            <li>- NRSC LULC 1:50K (land-use classification)</li>
            <li>- Water Bodies GIS (exclusion zones)</li>
            <li>- GMDA planning GIS (zone restrictions)</li>
            <li>- Land ownership/availability (confirmation)</li>
          </ul>
          <p className="text-xs text-red-600 mt-2">These missing datasets prevent final land-suitability and availability confirmation.</p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value, sub }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function RelocationSites() {
  const [allFeatures, setAllFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [sortField, setSortField] = useState('suitability_score');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const [filters, setFilters] = useState({
    search: '', suitabilityClass: 'all', minScore: '', maxScore: '',
    minElevation: '', maxElevation: '', minSlope: '', maxSlope: '',
    minRoad: '', maxRoad: '', floodHistory: 'all',
  });

  useEffect(() => {
    loadRelocationData().then((data) => {
      setAllFeatures(data.features);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!allFeatures) return [];
    return filterCandidates(allFeatures, filters);
  }, [allFeatures, filters]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'tv_name') { aVal = a.properties.tv_name || ''; bVal = b.properties.tv_name || ''; }
      else if (sortField === 'candidate_id') { aVal = a.properties.candidate_id || ''; bVal = b.properties.candidate_id || ''; }
      else { aVal = a.properties[sortField] || 0; bVal = b.properties[sortField] || 0; }
      if (typeof aVal === 'string') return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const dist = useMemo(() => allFeatures ? getSuitabilityDistribution(allFeatures) : { High: 0, Medium: 0, Low: 0 }, [allFeatures]);
  const pieData = useMemo(() => [
    { name: 'High', value: dist.High, color: '#16a34a' },
    { name: 'Medium', value: dist.Medium, color: '#ca8a04' },
    { name: 'Low', value: dist.Low, color: '#ea580c' },
  ], [dist]);

  const handleSort = (field) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading preliminary candidate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Limitations Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 md:px-5 py-2.5 md:py-3 flex-shrink-0">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs md:text-sm font-bold text-amber-900">Preliminary Relocation Suitability</p>
          <p className="text-xs text-amber-700 mt-0.5">This analysis is an explainable GIS-based analytical assessment. It is NOT an official government classification or declaration of a safe relocation site.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Total Preliminary Candidates" value={allFeatures?.length || 0} color="blue" />
            <KPICard label="High Suitability" value={dist.High} color="green" sub=">= 70" />
            <KPICard label="Medium Suitability" value={dist.Medium} color="yellow" sub="50 - 69" />
            <KPICard label="Low Suitability" value={dist.Low} color="orange" sub="30 - 49" />
          </div>

          {/* Map + Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Candidate Site Map</h3>
              <p className="text-xs text-gray-500 mt-0.5">{filtered.length} candidates shown — click a marker for details</p>
            </div>
            <div className="h-[420px] md:h-[560px] lg:h-[640px] relative">
              <MapContainer center={[26.15, 91.85]} zoom={11} className="h-full w-full" zoomControl={false}>
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <FitBounds features={filtered} />
                {filtered.map((f) => (
                  <CandidateMarker
                    key={f.properties.candidate_id}
                    feature={f}
                    isSelected={selectedFeature?.properties.candidate_id === f.properties.candidate_id}
                    onClick={(feat) => { setSelectedFeature(feat); setShowPanel(true); }}
                  />
                ))}
              </MapContainer>
              <div className="absolute bottom-3 left-3 bg-white rounded-lg shadow-md p-2 z-[1000]">
                <p className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Legend</p>
                <div className="space-y-1">
                  {Object.entries({ High: '#16a34a', Medium: '#ca8a04', Low: '#ea580c' }).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs text-gray-600">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Filters</h3>
            <div className="flex flex-wrap items-end gap-2 md:gap-3">
              <FilterInput label="Search" type="text" placeholder="Name or ID..." value={filters.search} onChange={(v) => updateFilter('search', v)} />
              <FilterSelect label="Suitability" value={filters.suitabilityClass} onChange={(v) => updateFilter('suitabilityClass', v)} options={[{ value: 'all', label: 'All' }, { value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]} />
              <FilterInput label="Min Score" type="number" placeholder="0" value={filters.minScore} onChange={(v) => updateFilter('minScore', v)} width="w-20" />
              <FilterInput label="Max Score" type="number" placeholder="100" value={filters.maxScore} onChange={(v) => updateFilter('maxScore', v)} width="w-20" />
              <FilterInput label="Min Elev (m)" type="number" placeholder="0" value={filters.minElevation} onChange={(v) => updateFilter('minElevation', v)} width="w-24" />
              <FilterInput label="Max Elev (m)" type="number" placeholder="500" value={filters.maxElevation} onChange={(v) => updateFilter('maxElevation', v)} width="w-24" />
              <FilterInput label="Max Slope (deg)" type="number" placeholder="30" value={filters.maxSlope} onChange={(v) => updateFilter('maxSlope', v)} width="w-24" />
              <FilterInput label="Max Road (km)" type="number" placeholder="10" value={filters.maxRoad} onChange={(v) => updateFilter('maxRoad', v)} width="w-24" />
              <FilterSelect label="Flood History" value={filters.floodHistory} onChange={(v) => updateFilter('floodHistory', v)} options={[{ value: 'all', label: 'All' }, { value: 'never', label: 'Never Exposed' }, { value: '1-2', label: '1-2 Years' }, { value: '3+', label: '3+ Years' }]} />
              <button onClick={() => setFilters({ search: '', suitabilityClass: 'all', minScore: '', maxScore: '', minElevation: '', maxElevation: '', minSlope: '', maxSlope: '', minRoad: '', maxRoad: '', floodHistory: 'all' })} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 min-h-[32px]">Clear All</button>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Suitability Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Score Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sorted.map((f) => ({ name: f.properties.candidate_id, score: f.properties.suitability_score, class: f.properties.suitability_class }))}>
                  <XAxis dataKey="name" tick={false} />
                  <YAxis domain={[40, 75]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name, props) => [`${value} (${props.payload.class})`, 'Score']} />
                  <Bar dataKey="score" radius={[2, 2, 0, 0]}>
                    {sorted.map((f, i) => <Cell key={i} fill={getSuitabilityLevel(f.properties.suitability_score).color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ranked Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Ranked Candidate Sites</h3>
                <p className="text-xs text-gray-500 mt-0.5">{sorted.length} candidates — click row for details</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <Th label="Rank" field="rank" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <Th label="ID" field="candidate_id" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <Th label="Name" field="tv_name" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <Th label="Score" field="suitability_score" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                    <Th label="Level" field="suitability_class" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
                    <Th label="Elev (m)" field="elevation_m" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                    <Th label="Slope (deg)" field="slope_deg" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                    <Th label="Road (km)" field="distance_to_major_road_km" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                    <Th label="Amenities" field="amenities_score" sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((f, idx) => {
                    const p = f.properties;
                    const lvl = getSuitabilityLevel(p.suitability_score);
                    const rank = (page - 1) * perPage + idx + 1;
                    return (
                      <tr key={p.candidate_id} className="border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => { setSelectedFeature(f); setShowPanel(true); }}>
                        <td className="py-2.5 px-3 text-gray-500 font-mono text-xs">{rank}</td>
                        <td className="py-2.5 px-3 font-mono text-xs text-gray-700">{p.candidate_id}</td>
                        <td className="py-2.5 px-3 font-medium text-gray-900">{p.tv_name}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="font-bold" style={{ color: lvl.color }}>{p.suitability_score}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: lvl.bg, color: lvl.color, border: `1px solid ${lvl.border}` }}>
                            {p.suitability_class}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs text-gray-600">{p.elevation_m}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs text-gray-600">{p.slope_deg.toFixed(1)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs text-gray-600">{p.distance_to_major_road_km.toFixed(1)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-xs text-gray-600">{p.amenities_score.toFixed(0)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, sorted.length)} of {sorted.length}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 min-h-[32px]">Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-xs rounded-lg border min-h-[32px] ${page === p ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 hover:bg-gray-100'}`}>{p}</button>
                    );
                  })}
                  <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 min-h-[32px]">Next</button>
                </div>
              </div>
            )}
          </div>

          {/* Scoring Methodology */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Scoring Methodology</h3>
            <p className="text-xs text-gray-600 mb-4">The preliminary suitability score is a weighted composite of five analytical factors. All factors are normalised to 0-1 and multiplied by their weight to produce a final score out of 100.</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4 font-mono text-xs text-gray-700">
              Score = (Elevation x 0.25) + (Slope x 0.15) + (Road Access x 0.20) + (Amenities x 0.25) + (Proximity x 0.15)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {SCORING_WEIGHTS.map((w) => (
                <div key={w.label} className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <p className="text-xs font-bold text-blue-800">{w.label} ({(w.weight * 100).toFixed(0)}%)</p>
                  <p className="text-xs text-blue-600 mt-1">{w.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Data Sources</p>
              <ul className="text-xs text-amber-700 space-y-0.5">
                <li>Census + AIKOSH geometry: 228 habitation polygons</li>
                <li>NDEM flood exposure: 5-year historical flood data (1998-2013)</li>
                <li>SRTM DEM 30m: Elevation and slope analysis</li>
                <li>OSM Roads: Major road network accessibility</li>
                <li>Census Village Amenities: 2011 village-level facilities</li>
              </ul>
            </div>
          </div>

          {/* Pending Validation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Pending Validation — Missing Datasets</h3>
            <p className="text-xs text-gray-600 mb-3">The following datasets are required before final land-suitability and availability can be confirmed:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <PendingCard title="NRSC LULC 1:50K" status="pending" description="Land-use classification. Cannot identify actual open/available land without this." />
              <PendingCard title="Water Bodies GIS" status="pending" description="Exclusion zones around rivers, ponds, and wetlands. Candidates may be adjacent to water bodies." />
              <PendingCard title="GMDA Planning GIS" status="unavailable" description="Planning zone restrictions and Eco-Sensitive Zone. Web viewer only, no GIS download." />
              <PendingCard title="Land Ownership/Availability" status="pending" description="Cannot confirm whether land is government-owned, privately held, or available for relocation." />
            </div>
          </div>

          {/* Methodology Flow */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Analysis Pipeline</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {['Census + AIKOSH Geometry', 'Flood Exposure (NDEM)', 'DEM Elevation/Slope', 'Road Accessibility (OSM)', 'Amenities (Census 2011)', 'Habitation Proximity', 'Preliminary Weighted Suitability'].map((step, i) => (
                <React.Fragment key={step}>
                  <span className="bg-blue-50 text-blue-800 px-3 py-1.5 rounded-full border border-blue-200 font-medium">{step}</span>
                  {i < 6 && <span className="text-gray-400">&rarr;</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Detail Panel */}
      {showPanel && selectedFeature && (
        <DetailPanel feature={selectedFeature} onClose={() => { setShowPanel(false); setSelectedFeature(null); }} />
      )}
    </div>
  );
}

function KPICard({ label, value, color, sub }) {
  const colorMap = { blue: 'bg-blue-50 border-blue-100 text-blue-700', green: 'bg-green-50 border-green-100 text-green-700', yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700', orange: 'bg-orange-50 border-orange-100 text-orange-700' };
  return (
    <div className={`rounded-xl shadow-sm border p-4 ${colorMap[color] || colorMap.blue}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-0.5 opacity-60">{sub}</p>}
    </div>
  );
}

function Th({ label, field, sortField, sortDir, onSort, align = 'left' }) {
  return (
    <th onClick={() => onSort(field)} className={`py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {label} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </th>
  );
}

function FilterInput({ label, type, placeholder, value, onChange, width = 'w-28' }) {
  return (
    <div className="min-w-0">
      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className={`text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 ${width} max-w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500`} />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function PendingCard({ title, status, description }) {
  const colors = { pending: 'bg-gray-100 dark:bg-[#1c1c1c] border-gray-200 dark:border-[#27272a]', unavailable: 'bg-gray-100 dark:bg-[#1c1c1c] border-gray-200 dark:border-[#27272a]' };
  const badges = { pending: 'bg-gray-200 dark:bg-[#27272a] text-gray-700 dark:text-[#a1a1aa]', unavailable: 'bg-gray-200 dark:bg-[#27272a] text-gray-700 dark:text-[#a1a1aa]' };
  return (
    <div className={`rounded-lg border p-3 ${colors[status]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-bold text-gray-900 dark:text-[#a1a1aa]">{title}</p>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badges[status]}`}>{status}</span>
      </div>
      <p className="text-xs text-gray-600 dark:text-[#71717a]">{description}</p>
    </div>
  );
}
