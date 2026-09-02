import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { FLOOD_YEARS, getExposureColor, getExposureCategory, EXPOSURE_CATEGORIES, computeHabitationPriority, PRIORITY_LEVELS } from '../data/floodData';
import useHabitationWeather from '../hooks/useHabitationWeather';
import useOfficialAlerts from '../hooks/useOfficialAlerts';
import { getConditionSeverity } from '../services/weatherService';
import { computeActionLevel } from '../services/actionLevelEngine';
import { useDemoMode } from '../demo/DemoModeContext';
import HabitationDetailPanel from '../components/HabitationDetailPanel';
import RiskExplanationPanel from '../components/RiskExplanationPanel';
import WhatIfSimulatorPanel from '../components/WhatIfSimulatorPanel';
import HabitationComparisonPanel from '../components/HabitationComparisonPanel';
import DemoControlPanel from '../components/DemoControlPanel';
import DemoMapOverlay from '../components/DemoMapOverlay';
import EmergencyResponseScreen from '../components/EmergencyResponseScreen';

function FitBounds({ features }) {
  const map = useMap();
  useEffect(() => {
    if (features.length > 0) {
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      features.forEach((f) => {
        const geom = f.geometry;
        if (geom.type === 'Polygon') {
          geom.coordinates[0].forEach(([lng, lat]) => {
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
          });
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach((poly) => poly[0].forEach(([lng, lat]) => {
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
          }));
        }
      });
      if (minLat !== Infinity) {
        map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [30, 30] });
      }
    }
  }, [features, map]);
  return null;
}

function MapControls({ features, onReset }) {
  const map = useMap();
  const handleZoomIn = () => map.zoomIn();
  const handleZoomOut = () => map.zoomOut();
  const handleReset = () => {
    if (features.length > 0) {
      let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
      features.forEach((f) => {
        const geom = f.geometry;
        const coords = geom.type === 'Polygon' ? geom.coordinates[0]
          : geom.type === 'MultiPolygon' ? geom.coordinates[0][0] : [];
        coords.forEach(([lng, lat]) => {
          if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
        });
      });
      if (minLat !== Infinity) map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [30, 30] });
    }
    onReset();
  };

  return (
    <div className="absolute top-3 left-3 md:top-4 md:left-4 z-[1000] flex flex-col items-center gap-1.5">
      <button
        onClick={handleReset}
        className="w-8 h-8 flex items-center justify-center rounded bg-white/90 dark:bg-slate-800/90 shadow border border-gray-300 dark:border-slate-500 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-[10px] font-semibold leading-none"
        title="Reset map view"
      >↺</button>
      <button
        onClick={handleZoomIn}
        className="w-8 h-8 flex items-center justify-center rounded bg-white/90 dark:bg-slate-800/90 shadow border border-gray-300 dark:border-slate-500 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-lg font-bold leading-none"
        title="Zoom in"
      >+</button>
      <button
        onClick={handleZoomOut}
        className="w-8 h-8 flex items-center justify-center rounded bg-white/90 dark:bg-slate-800/90 shadow border border-gray-300 dark:border-slate-500 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-lg font-bold leading-none"
        title="Zoom out"
      >−</button>
    </div>
  );
}

export default function FloodMap({ features, selectedYear, setSelectedYear, currentStats }) {
  const [selectedHabitation, setSelectedHabitation] = useState(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [mapMode, setMapMode] = useState('exposure');

  const { weatherMap, loading: weatherLoading, getWeatherForHabitation, refresh: refreshWeather } = useHabitationWeather(features);
  const { summary: alertSummary, loading: alertLoading, refresh: refreshAlerts, lastUpdated: alertLastUpdated } = useOfficialAlerts();
  const { demoMode } = useDemoMode();

  const pctKey = `flood_pct_${selectedYear}`;
  const popKey = `exposed_pop_${selectedYear}`;

  const onEachFeature = useCallback((feature, layer) => {
    const p = feature.properties;
    const pct = p[pctKey] || 0;
    const pop = p[popKey] || 0;
    const cat = getExposureCategory(pct);
    const priority = computeHabitationPriority(feature);
    const yearsExposedCount = FLOOD_YEARS.filter(y => (p[`flood_pct_${y}`] || 0) > 0).length;

    const weather = weatherMap?.[p.pc11_tv_id];
    let weatherHtml = '';
    if (weather) {
      const severity = getConditionSeverity(weather.weatherCode);
      const severityColor = severity === 'danger' ? '#E11D48' : severity === 'warning' ? '#F0B01A' : severity === 'info' ? '#3b82f6' : '#16a34a';
      weatherHtml = `
        <div style="margin-top:6px;padding:4px 6px;border-radius:4px;background:${severityColor}11;border:1px solid ${severityColor}33">
          <span style="font-size:10px;color:${severityColor};font-weight:600">${weather.conditionIcon} ${weather.conditionLabel}</span>
          <span style="font-size:9px;color:#94a3b8;margin-left:4px">${weather.temperature}°C</span>
        </div>
      `;
    } else if (weatherLoading) {
      weatherHtml = `<div style="margin-top:6px;font-size:9px;color:#94a3b8;font-style:italic">Loading weather...</div>`;
    }

    layer.bindPopup(`
      <div style="min-width:200px;font-family:system-ui,sans-serif">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px;color:#1e293b">${p.Name}</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:8px">Census ID: ${p.pc11_tv_id}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px">
          <div style="background:#f8fafc;padding:4px 6px;border-radius:4px">
            <div style="color:#94a3b8;font-size:10px">Population</div>
            <div style="font-weight:600">${(p.TOT_P || 0).toLocaleString()}</div>
          </div>
          <div style="background:#f8fafc;padding:4px 6px;border-radius:4px">
            <div style="color:#94a3b8;font-size:10px">Households</div>
            <div style="font-weight:600">${(p.No_HH || 0).toLocaleString()}</div>
          </div>
          <div style="background:${cat.color}22;padding:4px 6px;border-radius:4px;border:1px solid ${cat.color}44">
            <div style="color:#94a3b8;font-size:10px">${selectedYear} Exposure</div>
            <div style="font-weight:700;color:${cat.color}">${pct.toFixed(1)}%</div>
          </div>
          <div style="background:#fef2f2;padding:4px 6px;border-radius:4px">
            <div style="color:#94a3b8;font-size:10px">Est. Exposed Pop</div>
            <div style="font-weight:600;color:#dc2626">${pop.toLocaleString()}</div>
          </div>
        </div>
        <div style="margin-top:6px;font-size:11px;color:#64748b">
          Flood Frequency: ${yearsExposedCount}/5 years | Max: ${(p.max_flood_exposure_pct || 0).toFixed(1)}%
        </div>
        <div style="margin-top:4px;padding:4px 6px;border-radius:4px;background:${priority.bg};border:1px solid ${priority.border}">
          <span style="font-size:10px;color:${priority.color};font-weight:600">Priority: ${priority.level} (${priority.score})</span>
        </div>
        ${weatherHtml}
        <div style="margin-top:4px;font-size:9px;color:#94a3b8;font-style:italic">
          ESTIMATE: spatial overlap only. NOT actual people affected.
        </div>
      </div>
    `, { maxWidth: 280 });

    layer.on({
      click: () => {
        setSelectedHabitation(feature);
        setShowPanel(true);
      },
      mouseover: (e) => {
        e.target.setStyle({ weight: 3, fillOpacity: 0.85 });
        e.target.bringToFront();
      },
      mouseout: (e) => {
        e.target.setStyle({ weight: 1, fillOpacity: 0.7 });
      },
    });
  }, [pctKey, selectedYear, weatherMap, weatherLoading]);

  const getFeatureStyle = useCallback((feature) => {
    if (mapMode === 'priority') {
      const priority = computeHabitationPriority(feature);
      return {
        fillColor: priority.color,
        weight: 1,
        opacity: 1,
        color: '#475569',
        fillOpacity: 0.7,
      };
    }
    return {
      fillColor: getExposureColor(feature.properties[pctKey] || 0),
      weight: 1,
      opacity: 1,
      color: '#475569',
      fillOpacity: 0.7,
    };
  }, [mapMode, pctKey]);

  const geojsonKey = useMemo(() => `flood-${selectedYear}-${features.length}-${mapMode}`, [selectedYear, features.length, mapMode]);

  const selectedWeather = useMemo(() => {
    if (!selectedHabitation || !weatherMap) return null;
    return weatherMap[selectedHabitation.properties.pc11_tv_id] || null;
  }, [selectedHabitation, weatherMap]);

  const selectedActionLevel = useMemo(() => {
    if (!selectedHabitation) return null;
    const priority = computeHabitationPriority(selectedHabitation);
    return computeActionLevel(selectedHabitation, selectedWeather, alertSummary, priority.level);
  }, [selectedHabitation, selectedWeather, alertSummary]);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 md:px-5 py-2.5 md:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-shrink-0 z-10">
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-900">Flood Exposure Map</h2>
          <p className="text-[10px] md:text-xs text-gray-500">Kamrup Metropolitan District — {selectedYear} Historical Flood Inundation</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setMapMode('exposure')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                mapMode === 'exposure' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Exposure
            </button>
            <button
              onClick={() => setMapMode('priority')}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                mapMode === 'priority' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Priority
            </button>
          </div>
          <button
            onClick={() => setShowComparison(true)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors dark:bg-[#B7027B]/15 dark:text-[#e879a8] dark:border-[#B7027B]/30 dark:hover:bg-[#B7027B]/25"
          >
            ⇄ Compare
          </button>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Flood Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {FLOOD_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[26.15, 91.65]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds features={features} />
          <GeoJSON
            key={geojsonKey}
            data={{ type: 'FeatureCollection', features }}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
          />
          <MapControls features={features} onReset={() => {}} />
          {demoMode && <DemoMapOverlay />}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 p-2 md:p-3 z-[1000] max-w-[160px] md:max-w-[200px]">
          {mapMode === 'exposure' ? (
            <>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Flood Exposure</p>
              <div className="space-y-1">
                {EXPOSURE_CATEGORIES.map((cat) => (
                  <div key={cat.label} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color }}></span>
                    <span className="text-gray-600">{cat.label}</span>
                    <span className="text-gray-400 ml-auto text-[10px]">
                      {cat.max === 0 ? '0%' : cat.min === 0 ? '1-25%' : `${cat.min}-${cat.max}%`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 mt-2 border-t border-gray-100 pt-1">Visualization categories only</p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">NAVIS Analytical Priority</p>
              <div className="space-y-1">
                {PRIORITY_LEVELS.map((l) => (
                  <div key={l.level} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: l.color }}></span>
                    <span className="text-gray-600">{l.level}</span>
                    <span className="text-gray-400 ml-auto text-[10px]">Score ≥ {l.minScore}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-gray-400 mt-2 border-t border-gray-100 pt-1">Analytical indicator — NOT official risk classification</p>
            </>
          )}
        </div>

        {/* Year summary + Weather + Alerts — stacked vertically */}
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-[1000] flex flex-col items-end gap-2">
          {alertSummary && alertSummary.hasActiveAlerts && (
            <div className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 p-2 md:p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: alertSummary.maxSeverity?.color || '#F0B01A' }}></span>
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: alertSummary.maxSeverity?.color || '#F0B01A' }}>
                  IMD Alert ({alertSummary.count})
                </span>
              </div>
            </div>
          )}
          {weatherMap ? (
            <div className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 p-2 md:p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider">Live Weather</span>
                <button
                  onClick={refreshWeather}
                  className="ml-1 p-0.5 rounded hover:bg-gray-100 transition-colors"
                  title="Refresh weather"
                >
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          ) : weatherLoading ? (
            <div className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 p-2 md:p-2.5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Loading Weather...</span>
              </div>
            </div>
          ) : null}
          {currentStats && (
            <div className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 p-2 md:p-3 max-w-[180px] md:max-w-none">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{selectedYear} Summary</p>
              <div className="space-y-0.5 md:space-y-1 text-xs">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Exposed:</span>
                  <span className="font-bold text-red-600">{currentStats.exposedHabitations} / {currentStats.totalHabitations}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Avg Exposure:</span>
                  <span className="font-medium">{currentStats.avgExposure.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Est. Pop:</span>
                  <span className="font-medium text-red-600">{currentStats.totalExposedPop.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {showPanel && selectedHabitation && (
        <HabitationDetailPanel
          feature={selectedHabitation}
          selectedYear={selectedYear}
          weather={selectedWeather}
          weatherLoading={weatherLoading}
          actionLevel={selectedActionLevel}
          onClose={() => { setShowPanel(false); setSelectedHabitation(null); setShowExplanation(false); setShowWhatIf(false); }}
          onExplainRisk={() => setShowExplanation(true)}
          onRunWhatIf={() => setShowWhatIf(true)}
        />
      )}

      {/* Risk explanation panel */}
      {showExplanation && selectedHabitation && (
        <RiskExplanationPanel
          feature={selectedHabitation}
          onClose={() => setShowExplanation(false)}
        />
      )}

      {/* What-If simulator panel */}
      {showWhatIf && selectedHabitation && (
        <WhatIfSimulatorPanel
          feature={selectedHabitation}
          onClose={() => setShowWhatIf(false)}
        />
      )}

      {/* Habitation comparison panel */}
      {showComparison && (
        <HabitationComparisonPanel
          features={features}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Demo Mode overlays */}
      {demoMode && <DemoControlPanel />}
      {demoMode && <EmergencyResponseScreen />}
    </div>
  );
}
