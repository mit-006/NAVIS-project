import React from 'react';
import { FLOOD_YEARS, getExposureCategory, computeHabitationPriority } from '../data/floodData';
import { getConditionSeverity, getWindDirectionLabel, getWeatherDecisionSupport } from '../services/weatherService';

export default function HabitationDetailPanel({ feature, selectedYear, weather, weatherLoading, actionLevel, onClose, onExplainRisk, onRunWhatIf }) {
  const p = feature.properties;
  const pctKey = `flood_pct_${selectedYear}`;
  const popKey = `exposed_pop_${selectedYear}`;
  const areaKey = `flood_area_${selectedYear}`;

  const currentPct = p[pctKey] || 0;
  const currentPop = p[popKey] || 0;
  const currentArea = p[areaKey] || 0;
  const cat = getExposureCategory(currentPct);
  const priority = computeHabitationPriority(feature);
  const yearsExposedCount = FLOOD_YEARS.filter(y => (p[`flood_pct_${y}`] || 0) > 0).length;

  const weatherSeverity = weather ? getConditionSeverity(weather.weatherCode) : null;
  const weatherAccent = weatherSeverity === 'danger' ? '#E11D48' : weatherSeverity === 'warning' ? '#F0B01A' : weatherSeverity === 'info' ? '#3b82f6' : '#0221B7';
  const decisionSupport = weather ? getWeatherDecisionSupport(weather, priority.level) : null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-[1000] sm:hidden" onClick={onClose}></div>

      {/* Mobile: bottom-sheet */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-[1001]" style={{ maxHeight: '60vh' }}>
        <div className="bg-white dark:bg-[#141414] rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-[#27272a] flex flex-col overflow-hidden" style={{ height: '60vh' }}>
          {/* Drag handle + header */}
          <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-gray-100 dark:border-[#27272a]">
            <div className="w-10 h-1 bg-gray-300 dark:bg-[#3f3f46] rounded-full mx-auto mb-3"></div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white text-base truncate">{p.Name}</h3>
                <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa]">Census ID: {p.pc11_tv_id}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-[#a1a1aa] hover:text-gray-600 dark:hover:text-white transition-colors flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Compact priority + exposure inline */}
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: priority.bg, color: priority.color, border: `1px solid ${priority.border}` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priority.color }}></span>
                {priority.level} ({priority.score})
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: `${cat.color}22`, color: cat.color }}>
                {currentPct.toFixed(1)}% — {cat.label}
              </span>
            </div>
            {actionLevel && (
              <div className="mt-2 rounded-lg p-2.5 border" style={{ background: actionLevel.bg, borderColor: actionLevel.border }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{actionLevel.icon}</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: actionLevel.color }}>{actionLevel.level}</span>
                  </div>
                </div>
                {actionLevel.factors && (
                  <div className="mt-2 space-y-1">
                    {actionLevel.factors.map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px]">
                        <span className="text-gray-500 dark:text-[#71717a]">{f.name}</span>
                        <span className="font-medium" style={{ color: f.value === 'Not Confirmed' ? '#F0B01A' : 'var(--text-primary)' }}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[9px] text-gray-400 dark:text-[#71717a] mt-1.5 italic">Analytical indicator — NOT an official directive</p>
              </div>
            )}
            {onExplainRisk && (
              <button
                onClick={onExplainRisk}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-[#0221B7]/15 text-blue-700 dark:text-[#6d9cf5] border border-blue-200 dark:border-[#0221B7]/30 hover:bg-blue-100 dark:hover:bg-[#0221B7]/25 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Explain Risk
              </button>
            )}
            {onRunWhatIf && (
              <button
                onClick={onRunWhatIf}
                className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-purple-50 dark:bg-[#B7027B]/15 text-purple-700 dark:text-[#e879a8] border border-purple-200 dark:border-[#B7027B]/30 hover:bg-purple-100 dark:hover:bg-[#B7027B]/25 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run What-If
              </button>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Key stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Population</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{(p.TOT_P || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Households</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{(p.No_HH || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Est. Exposed</p>
                <p className="text-sm font-bold text-red-600 dark:text-[#E11D48]">{currentPop.toLocaleString()}</p>
              </div>
            </div>

            {/* Flood exposure compact */}
            <div className="rounded-lg p-3" style={{ backgroundColor: `${cat.color}11`, border: `1px solid ${cat.color}33` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cat.color }}>{selectedYear} Flood Exposure</p>
                  <p className="text-2xl font-bold mt-0.5" style={{ color: cat.color }}>{currentPct.toFixed(1)}%</p>
                </div>
                <div className="text-right text-xs text-gray-600 dark:text-[#a1a1aa]">
                  <p>Area: {(currentArea / 10000).toFixed(2)} ha</p>
                </div>
              </div>
            </div>

            {/* Vulnerability compact */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Children</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{(p.P_06 || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">SC Pop</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{(p.P_SC || 0).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-lg p-2 text-center">
                <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">ST Pop</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{(p.P_ST || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Historical timeline compact */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-2">Timeline</p>
              <div className="space-y-1.5">
                {FLOOD_YEARS.map((year) => {
                  const yPct = p[`flood_pct_${year}`] || 0;
                  const yCat = getExposureCategory(yPct);
                  return (
                    <div key={year} className={`flex items-center gap-2 p-1.5 rounded ${year === selectedYear ? 'bg-white dark:bg-[#1c1c1c] shadow-sm border border-gray-200 dark:border-[#27272a]' : ''}`}>
                      <span className={`text-[11px] font-mono w-8 ${year === selectedYear ? 'font-bold text-blue-600 dark:text-[#0221B7]' : 'text-gray-500 dark:text-[#a1a1aa]'}`}>{year}</span>
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#27272a] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(yPct, 1)}%`, backgroundColor: yCat.color }} />
                      </div>
                      <span className="text-[11px] font-medium w-12 text-right" style={{ color: yCat.color }}>
                        {yPct > 0 ? `${yPct.toFixed(1)}%` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Frequency compact */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-lg p-2">
                <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Years Exposed</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{yearsExposedCount} <span className="text-xs font-normal text-gray-400 dark:text-[#71717a]">/ 5</span></p>
              </div>
              <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-lg p-2">
                <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Max Exposure</p>
                <p className="text-sm font-bold text-red-600 dark:text-[#E11D48]">{(p.max_flood_exposure_pct || 0).toFixed(1)}%</p>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-[#F0B01A]/10 rounded-lg p-2 border border-amber-100 dark:border-[#F0B01A]/20">
              <p className="text-[10px] text-amber-700 dark:text-[#F0B01A]">
                Data Transparency: Estimated exposed population is a spatial estimate. NOT actual affected population.
              </p>
            </div>

            {/* Current Conditions */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-2">Current Conditions</p>
              {weatherLoading && !weather ? (
                <div className="rounded-lg p-3 bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                    <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa]">Loading current weather...</p>
                  </div>
                </div>
              ) : weather ? (
                <div className="rounded-lg border p-3" style={{ background: weatherSeverity === 'danger' ? 'rgba(225,29,72,0.06)' : weatherSeverity === 'warning' ? 'rgba(240,176,26,0.06)' : 'var(--bg-primary)', borderColor: weatherSeverity === 'danger' ? 'rgba(225,29,72,0.20)' : weatherSeverity === 'warning' ? 'rgba(240,176,26,0.20)' : 'var(--border-secondary)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{weather.conditionIcon}</span>
                      <span className="text-xs font-semibold" style={{ color: weatherAccent }}>{weather.conditionLabel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="text-[9px] font-semibold text-green-600 dark:text-green-400 uppercase">Live</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md p-2 bg-gray-50 dark:bg-[#1c1c1c]">
                      <p className="text-[9px] text-gray-500 dark:text-[#71717a] uppercase">Temp</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{weather.temperature}°C</p>
                    </div>
                    <div className="rounded-md p-2 bg-gray-50 dark:bg-[#1c1c1c]">
                      <p className="text-[9px] text-gray-500 dark:text-[#71717a] uppercase">Rain</p>
                      <p className="text-sm font-bold" style={{ color: weather.rain > 10 ? '#E11D48' : 'var(--text-primary)' }}>{weather.rain} mm</p>
                    </div>
                    <div className="rounded-md p-2 bg-gray-50 dark:bg-[#1c1c1c]">
                      <p className="text-[9px] text-gray-500 dark:text-[#71717a] uppercase">Humidity</p>
                      <p className="text-sm font-bold" style={{ color: weather.humidity > 85 ? '#F0B01A' : 'var(--text-primary)' }}>{weather.humidity}%</p>
                    </div>
                    <div className="rounded-md p-2 bg-gray-50 dark:bg-[#1c1c1c]">
                      <p className="text-[9px] text-gray-500 dark:text-[#71717a] uppercase">Wind</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{weather.windSpeed} km/h</p>
                      <p className="text-[9px] text-gray-500 dark:text-[#71717a]">{getWindDirectionLabel(weather.windDirection)}</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-gray-400 dark:text-[#71717a] mt-2">Updated: {weather.updatedAgo || 'Unknown'}</p>
                </div>
              ) : (
                <div className="rounded-lg p-3 bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
                  <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa]">Current weather data unavailable</p>
                </div>
              )}
            </div>

            {/* Decision Support */}
            {decisionSupport && (
              <div className="rounded-lg p-2.5 border" style={{ background: decisionSupport.level === 'danger' ? 'rgba(225,29,72,0.06)' : decisionSupport.level === 'warning' ? 'rgba(240,176,26,0.06)' : decisionSupport.level === 'caution' ? 'rgba(59,130,246,0.06)' : 'rgba(22,163,74,0.06)', borderColor: decisionSupport.level === 'danger' ? 'rgba(225,29,72,0.15)' : decisionSupport.level === 'warning' ? 'rgba(240,176,26,0.15)' : decisionSupport.level === 'caution' ? 'rgba(59,130,246,0.15)' : 'rgba(22,163,74,0.15)' }}>
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">{decisionSupport.icon}</span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: decisionSupport.level === 'danger' ? '#E11D48' : decisionSupport.level === 'warning' ? '#F0B01A' : decisionSupport.level === 'caution' ? '#3b82f6' : '#16a34a' }}>Recommended Action</p>
                    <p className="text-[11px] text-gray-700 dark:text-[#d4d4d8] mt-0.5 leading-relaxed">{decisionSupport.text}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop: side panel */}
      <div className="hidden sm:flex absolute top-0 right-0 h-full w-96 bg-white dark:bg-[#141414] shadow-2xl border-l border-gray-200 dark:border-[#27272a] z-[1001] flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-white dark:bg-[#141414] border-b border-gray-100 dark:border-[#27272a] px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{p.Name}</h3>
            <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Census ID: {p.pc11_tv_id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-[#a1a1aa] hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ backgroundColor: priority.bg, border: `1px solid ${priority.border}` }}
            >
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: priority.color }}>
                  NAVIS Analytical Priority
                </p>
                <p className="text-lg font-bold mt-1" style={{ color: priority.color }}>{priority.level}</p>
                <p className="text-[10px] text-gray-500 dark:text-[#71717a] mt-0.5">Score: {priority.score}</p>
              </div>
              <div className="text-right">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: priority.color }}
                >
                  {priority.score}
                </div>
              </div>
            </div>
            {actionLevel && (
              <div className="rounded-xl p-4 border" style={{ background: actionLevel.bg, borderColor: actionLevel.border }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{actionLevel.icon}</span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: actionLevel.color }}>Action Level</p>
                    <p className="text-base font-bold" style={{ color: actionLevel.color }}>{actionLevel.level}</p>
                  </div>
                </div>
                {actionLevel.factors && actionLevel.factors.length > 0 && (
                  <div className="space-y-2">
                    {actionLevel.factors.map((f, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-[10px] text-gray-500 dark:text-[#71717a] w-24 truncate">{f.name}</span>
                          {f.max > 0 && (
                            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-[#27272a] rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${(f.score / f.max) * 100}%`, backgroundColor: actionLevel.color }} />
                            </div>
                          )}
                        </div>
                        <span className={`text-[10px] font-medium ml-2 ${f.value === 'Not Confirmed' ? 'text-amber-600 dark:text-[#F0B01A] italic' : 'text-gray-700 dark:text-[#d4d4d8]'}`}>{f.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[9px] text-gray-400 dark:text-[#71717a] mt-3 italic">Analytical indicator — NOT an official directive. Current flooding not confirmed.</p>
              </div>
            )}
            {onExplainRisk && (
              <button
                onClick={onExplainRisk}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-[#0221B7]/15 text-blue-700 dark:text-[#6d9cf5] border border-blue-200 dark:border-[#0221B7]/30 hover:bg-blue-100 dark:hover:bg-[#0221B7]/25 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Explain Risk
              </button>
            )}
            {onRunWhatIf && (
              <button
                onClick={onRunWhatIf}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-50 dark:bg-[#B7027B]/15 text-purple-700 dark:text-[#e879a8] border border-purple-200 dark:border-[#B7027B]/30 hover:bg-purple-100 dark:hover:bg-[#B7027B]/25 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run What-If
              </button>
            )}

          <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-3">Basic Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Population</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{(p.TOT_P || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Households</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{(p.No_HH || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Male</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-[#d4d4d8]">{(p.TOT_M || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Female</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-[#d4d4d8]">{(p.TOT_F || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#27272a]">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-2">Vulnerability Indicators</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-2 border border-gray-200 dark:border-[#27272a]">
                  <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Children (0-6)</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{(p.P_06 || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-2 border border-gray-200 dark:border-[#27272a]">
                  <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">SC Population</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{(p.P_SC || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-2 border border-gray-200 dark:border-[#27272a]">
                  <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">ST Population</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{(p.P_ST || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-[#27272a]">
              <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Area</p>
              <p className="text-sm font-semibold text-gray-700 dark:text-[#d4d4d8]">{(p.total_area_ha || 0).toFixed(2)} hectares</p>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ backgroundColor: `${cat.color}11`, border: `1px solid ${cat.color}33` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: cat.color }}>
              {selectedYear} Flood Exposure
            </p>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-bold" style={{ color: cat.color }}>{currentPct.toFixed(1)}%</span>
              <span className="text-sm font-medium mb-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${cat.color}22`, color: cat.color }}>
                {cat.label}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Flooded Area</p>
                <p className="font-semibold dark:text-[#d4d4d8]">{(currentArea / 10000).toFixed(2)} ha</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Est. Exposed Pop</p>
                <p className="font-semibold text-red-600 dark:text-[#E11D48]">{currentPop.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-3">Historical Timeline</p>
            <div className="space-y-2">
              {FLOOD_YEARS.map((year) => {
                const yPct = p[`flood_pct_${year}`] || 0;
                const yPop = p[`exposed_pop_${year}`] || 0;
                const yCat = getExposureCategory(yPct);
                return (
                  <div key={year} className={`flex items-center gap-3 p-2 rounded-lg ${year === selectedYear ? 'bg-white dark:bg-[#0a0a0a] shadow-sm border border-gray-200 dark:border-[#27272a]' : ''}`}>
                    <span className={`text-xs font-mono w-8 ${year === selectedYear ? 'font-bold text-blue-600 dark:text-[#0221B7]' : 'text-gray-500 dark:text-[#a1a1aa]'}`}>{year}</span>
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-[#27272a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(yPct, 1)}%`, backgroundColor: yCat.color }}
                      />
                    </div>
                    <span className="text-xs font-medium w-14 text-right" style={{ color: yCat.color }}>
                      {yPct > 0 ? `${yPct.toFixed(1)}%` : '—'}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-[#71717a] w-12 text-right">
                      {yPop > 0 ? yPop.toLocaleString() : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-3">Flood Frequency Analysis</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Years Exposed</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{yearsExposedCount} <span className="text-sm font-normal text-gray-400 dark:text-[#71717a]">/ 5</span></p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Flood Frequency</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{((p.flood_frequency || 0) * 100).toFixed(0)}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Maximum Historical Exposure</p>
                <p className="text-lg font-bold text-red-600 dark:text-[#E11D48]">{(p.max_flood_exposure_pct || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-[#F0B01A]/10 rounded-xl p-4 border border-amber-100 dark:border-[#F0B01A]/20">
            <p className="text-xs text-amber-700 dark:text-[#F0B01A] font-medium">Data Transparency</p>
            <p className="text-[11px] text-amber-600 dark:text-[#F0B01A]/70 mt-1">
              Estimated exposed population is a spatial estimate derived from population × inundated-area percentage. It does NOT represent observed numbers of people affected during a disaster.
            </p>
          </div>

          {/* Current Conditions */}
          <div className="bg-gray-50 dark:bg-[#1c1c1c] rounded-xl p-4">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-3">Current Conditions</p>
            {weatherLoading && !weather ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#27272a]">
                <div className="w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin"></div>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Loading current weather...</p>
              </div>
            ) : weather ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{weather.conditionIcon}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: weatherAccent }}>{weather.conditionLabel}</p>
                      <p className="text-[10px] text-gray-500 dark:text-[#71717a]">Kamrup Metropolitan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[9px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Live</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-3 border border-gray-200 dark:border-[#27272a]">
                    <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Temperature</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{weather.temperature}°C</p>
                  </div>
                  <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-3 border border-gray-200 dark:border-[#27272a]">
                    <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Rainfall</p>
                    <p className="text-lg font-bold" style={{ color: weather.rain > 10 ? '#E11D48' : 'var(--text-primary)' }}>{weather.rain} mm</p>
                  </div>
                  <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-3 border border-gray-200 dark:border-[#27272a]">
                    <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Humidity</p>
                    <p className="text-lg font-bold" style={{ color: weather.humidity > 85 ? '#F0B01A' : 'var(--text-primary)' }}>{weather.humidity}%</p>
                  </div>
                  <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-3 border border-gray-200 dark:border-[#27272a]">
                    <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">Wind</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{weather.windSpeed} km/h</p>
                    <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa]">{getWindDirectionLabel(weather.windDirection)}</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-[#71717a] mt-3">Updated: {weather.updatedAgo || 'Unknown'}</p>
              </>
            ) : (
              <div className="p-3 rounded-lg bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#27272a]">
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Current weather data unavailable</p>
              </div>
            )}
          </div>

          {/* Decision Support */}
          {decisionSupport && (
            <div className="rounded-xl p-4 border" style={{ background: decisionSupport.level === 'danger' ? 'rgba(225,29,72,0.06)' : decisionSupport.level === 'warning' ? 'rgba(240,176,26,0.06)' : decisionSupport.level === 'caution' ? 'rgba(59,130,246,0.06)' : 'rgba(22,163,74,0.06)', borderColor: decisionSupport.level === 'danger' ? 'rgba(225,29,72,0.15)' : decisionSupport.level === 'warning' ? 'rgba(240,176,26,0.15)' : decisionSupport.level === 'caution' ? 'rgba(59,130,246,0.15)' : 'rgba(22,163,74,0.15)' }}>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{decisionSupport.icon}</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: decisionSupport.level === 'danger' ? '#E11D48' : decisionSupport.level === 'warning' ? '#F0B01A' : decisionSupport.level === 'caution' ? '#3b82f6' : '#16a34a' }}>Recommended Action</p>
                  <p className="text-xs text-gray-700 dark:text-[#d4d4d8] mt-1 leading-relaxed">{decisionSupport.text}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
