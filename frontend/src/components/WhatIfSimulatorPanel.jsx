import React, { useState, useMemo } from 'react';
import { FLOOD_YEARS, computeHabitationPriority, computeScenarioScore, getWhatIfExplanation } from '../data/floodData';

export default function WhatIfSimulatorPanel({ feature, onClose }) {
  const p = feature.properties;
  const current = computeHabitationPriority(feature);

  const currentYearsExposed = FLOOD_YEARS.filter(y => (p[`flood_pct_${y}`] || 0) > 0).length;
  const currentMaxExposure = p.max_flood_exposure_pct || 0;
  const currentFrequency = p.flood_frequency || 0;
  const currentTotPop = p.TOT_P || 0;
  const currentMaxExposedPop = current.maxExposedPop;

  const [scenarioYears, setScenarioYears] = useState(currentYearsExposed);
  const [scenarioMaxExposure, setScenarioMaxExposure] = useState(Math.round(currentMaxExposure));
  const [scenarioPopRatio, setScenarioPopRatio] = useState(
    currentTotPop > 0 ? Math.round((currentMaxExposedPop / currentTotPop) * 100) : 0
  );
  const [hasRun, setHasRun] = useState(false);

  const scenarioFrequency = scenarioYears / FLOOD_YEARS.length;
  const scenarioMaxExposedPop = Math.round((scenarioPopRatio / 100) * currentTotPop);

  const scenarioResult = useMemo(() => {
    return computeScenarioScore({
      maxExposure: scenarioMaxExposure,
      frequency: scenarioFrequency,
      totPop: currentTotPop,
      maxExposedPop: scenarioMaxExposedPop,
    });
  }, [scenarioMaxExposure, scenarioFrequency, currentTotPop, scenarioMaxExposedPop]);

  const explanation = useMemo(() => {
    if (!hasRun) return null;
    return getWhatIfExplanation(current, scenarioResult, current, scenarioResult);
  }, [hasRun, current, scenarioResult]);

  const handleReset = () => {
    setScenarioYears(currentYearsExposed);
    setScenarioMaxExposure(Math.round(currentMaxExposure));
    setScenarioPopRatio(currentTotPop > 0 ? Math.round((currentMaxExposedPop / currentTotPop) * 100) : 0);
    setHasRun(false);
  };

  const scoreDiff = hasRun ? scenarioResult.score - current.score : 0;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[1020]" onClick={onClose} />

      {/* Mobile: bottom-sheet */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-[1021]" style={{ maxHeight: '70vh' }}>
        <div className="bg-white dark:bg-[#141414] rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-[#27272a] flex flex-col overflow-hidden" style={{ height: '70vh' }}>
          {/* Header */}
          <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-gray-100 dark:border-[#27272a]">
            <div className="w-10 h-1 bg-gray-300 dark:bg-[#3f3f46] rounded-full mx-auto mb-3" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-purple-600 dark:text-[#B7027B] uppercase tracking-wider">What-If Risk Simulator</p>
                <h3 className="font-bold text-gray-900 dark:text-white text-base truncate mt-0.5">{p.Name}</h3>
                <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa]">Explore hypothetical risk scenarios</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-[#a1a1aa] hover:text-gray-600 dark:hover:text-white transition-colors flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Current vs Scenario comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-1">Actual</p>
                <p className="text-2xl font-bold" style={{ color: current.color }}>{current.score}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: current.color }}>{current.level}</p>
              </div>
              <div className="p-3 rounded-xl border-2" style={{ backgroundColor: hasRun ? `${scenarioResult.color}11` : '#f9fafb', borderColor: hasRun ? `${scenarioResult.color}44` : '#e5e7eb' }}>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-1">Scenario</p>
                <p className="text-2xl font-bold" style={{ color: hasRun ? scenarioResult.color : '#9ca3af' }}>{hasRun ? scenarioResult.score : '—'}</p>
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: hasRun ? scenarioResult.color : '#9ca3af' }}>{hasRun ? scenarioResult.level : '—'}</p>
              </div>
            </div>

            {/* Impact indicator */}
            {hasRun && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg" style={{ backgroundColor: scoreDiff > 0 ? '#fef2f2' : scoreDiff < 0 ? '#f0fdf4' : '#f9fafb' }}>
                <span className="text-sm font-bold" style={{ color: scoreDiff > 0 ? '#dc2626' : scoreDiff < 0 ? '#16a34a' : '#6b7280' }}>
                  {scoreDiff > 0 ? '↑' : scoreDiff < 0 ? '↓' : '—'} {explanation?.impact}
                </span>
                {current.level !== scenarioResult.level && (
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-[#a1a1aa]">
                    {current.level} → {scenarioResult.level}
                  </span>
                )}
              </div>
            )}

            {/* Scenario controls */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider">Scenario Controls</p>

              {/* Flood Exposure Years */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-[#d4d4d8]">Flood Exposure</span>
                  <span className="text-[11px] text-gray-500 dark:text-[#a1a1aa]">Actual: {currentYearsExposed} / {FLOOD_YEARS.length}</span>
                </div>
                <div className="flex gap-1.5">
                  {FLOOD_YEARS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setScenarioYears(i + 1)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                        scenarioYears === i + 1
                          ? 'bg-blue-600 dark:bg-[#0221B7] text-white'
                          : 'bg-white dark:bg-[#0a0a0a] text-gray-500 dark:text-[#a1a1aa] border border-gray-200 dark:border-[#27272a] hover:border-blue-300 dark:hover:border-[#0221B7]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 dark:text-[#71717a] mt-1.5">{scenarioYears} / {FLOOD_YEARS.length} years</p>
              </div>

              {/* Max Exposure */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-[#d4d4d8]">Max Flood Exposure</span>
                  <span className="text-[11px] text-gray-500 dark:text-[#a1a1aa]">Actual: {currentMaxExposure.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scenarioMaxExposure}
                  onChange={(e) => setScenarioMaxExposure(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-[#27272a] rounded-full appearance-none cursor-pointer accent-blue-600 dark:accent-[#0221B7]"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400 dark:text-[#71717a]">0%</span>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-[#d4d4d8]">{scenarioMaxExposure}%</span>
                  <span className="text-[10px] text-gray-400 dark:text-[#71717a]">100%</span>
                </div>
              </div>

              {/* Population Vulnerability */}
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700 dark:text-[#d4d4d8]">Population Vulnerability</span>
                  <span className="text-[11px] text-gray-500 dark:text-[#a1a1aa]">Actual: {currentTotPop > 0 ? Math.round((currentMaxExposedPop / currentTotPop) * 100) : 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scenarioPopRatio}
                  onChange={(e) => setScenarioPopRatio(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-[#27272a] rounded-full appearance-none cursor-pointer accent-blue-600 dark:accent-[#0221B7]"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-gray-400 dark:text-[#71717a]">0%</span>
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-[#d4d4d8]">{scenarioPopRatio}%</span>
                  <span className="text-[10px] text-gray-400 dark:text-[#71717a]">100%</span>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="flex gap-2">
              <button onClick={() => { setScenarioYears(Math.min(currentYearsExposed + 1, 5)); setScenarioMaxExposure(Math.min(Math.round(currentMaxExposure + 15), 100)); setScenarioPopRatio(Math.min(scenarioPopRatio + 15, 100)); }} className="flex-1 py-2 rounded-lg text-[11px] font-semibold bg-red-50 dark:bg-[#E11D48]/10 text-red-700 dark:text-[#E11D48] border border-red-200 dark:border-[#E11D48]/20 hover:bg-red-100 dark:hover:bg-[#E11D48]/20 transition-colors">
                Worse Scenario
              </button>
              <button onClick={() => { setScenarioYears(Math.max(currentYearsExposed - 1, 0)); setScenarioMaxExposure(Math.max(Math.round(currentMaxExposure - 15), 0)); setScenarioPopRatio(Math.max(scenarioPopRatio - 15, 0)); }} className="flex-1 py-2 rounded-lg text-[11px] font-semibold bg-green-50 dark:bg-[#13E83A]/10 text-green-700 dark:text-[#13E83A] border border-green-200 dark:border-[#13E83A]/20 hover:bg-green-100 dark:hover:bg-[#13E83A]/20 transition-colors">
                Better Scenario
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-[#1c1c1c] text-gray-600 dark:text-[#a1a1aa] border border-gray-200 dark:border-[#27272a] hover:bg-gray-200 dark:hover:bg-[#27272a] transition-colors">
                Reset
              </button>
              <button onClick={() => setHasRun(true)} className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-blue-600 dark:bg-[#0221B7] text-white hover:bg-blue-700 dark:hover:bg-[#0221B7]/80 transition-colors shadow-sm">
                Run Scenario
              </button>
            </div>

            {/* Explanation */}
            {hasRun && explanation && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-[#0221B7]/10 border border-blue-100 dark:border-[#0221B7]/20">
                <p className="text-[11px] text-blue-800 dark:text-[#93c5fd] leading-relaxed">{explanation.explanation}</p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-[#F0B01A]/10 rounded-lg p-2 border border-amber-100 dark:border-[#F0B01A]/20">
              <p className="text-[10px] text-amber-700 dark:text-[#F0B01A]">
                Hypothetical scenarios are temporary and do NOT modify actual NAVIS data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: modal */}
      <div className="hidden sm:flex fixed inset-0 items-center justify-center z-[1021] p-4">
        <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#27272a] w-full max-w-[520px] max-h-[70vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100 dark:border-[#27272a]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold text-purple-600 dark:text-[#B7027B] uppercase tracking-wider">What-If Risk Simulator</p>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mt-0.5">{p.Name}</h3>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">Explore hypothetical risk scenarios</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-[#a1a1aa] hover:text-gray-600 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Current vs Scenario comparison */}
            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a] text-center">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-1">Actual</p>
                <p className="text-3xl font-bold" style={{ color: current.color }}>{current.score}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: current.color }}>{current.level}</p>
              </div>
              <div className="text-gray-300 dark:text-[#3f3f46] text-lg">→</div>
              <div className="p-4 rounded-xl border-2 text-center" style={{ backgroundColor: hasRun ? `${scenarioResult.color}11` : '#f9fafb', borderColor: hasRun ? `${scenarioResult.color}44` : '#e5e7eb' }}>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-1">Scenario</p>
                <p className="text-3xl font-bold" style={{ color: hasRun ? scenarioResult.color : '#9ca3af' }}>{hasRun ? scenarioResult.score : '—'}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: hasRun ? scenarioResult.color : '#9ca3af' }}>{hasRun ? scenarioResult.level : '—'}</p>
              </div>
            </div>

            {/* Impact indicator */}
            {hasRun && (
              <div className="flex items-center justify-center gap-3 p-3 rounded-xl" style={{ backgroundColor: scoreDiff > 0 ? '#fef2f2' : scoreDiff < 0 ? '#f0fdf4' : '#f9fafb' }}>
                <span className="text-base font-bold" style={{ color: scoreDiff > 0 ? '#dc2626' : scoreDiff < 0 ? '#16a34a' : '#6b7280' }}>
                  {scoreDiff > 0 ? '↑' : scoreDiff < 0 ? '↓' : '—'} {explanation?.impact}
                </span>
                {current.level !== scenarioResult.level && (
                  <span className="text-sm font-semibold text-gray-600 dark:text-[#a1a1aa]">
                    {current.level} → {scenarioResult.level}
                  </span>
                )}
              </div>
            )}

            {/* Scenario controls */}
            <div className="space-y-4">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider">Scenario Controls</p>

              {/* Flood Exposure Years */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-[#d4d4d8]">Flood Exposure</span>
                  <span className="text-xs text-gray-500 dark:text-[#a1a1aa]">Actual: {currentYearsExposed} / {FLOOD_YEARS.length}</span>
                </div>
                <div className="flex gap-2">
                  {FLOOD_YEARS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setScenarioYears(i + 1)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        scenarioYears === i + 1
                          ? 'bg-blue-600 dark:bg-[#0221B7] text-white'
                          : 'bg-white dark:bg-[#0a0a0a] text-gray-500 dark:text-[#a1a1aa] border border-gray-200 dark:border-[#27272a] hover:border-blue-300 dark:hover:border-[#0221B7]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-[#71717a] mt-2">{scenarioYears} / {FLOOD_YEARS.length} years</p>
              </div>

              {/* Max Exposure */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-[#d4d4d8]">Max Flood Exposure</span>
                  <span className="text-xs text-gray-500 dark:text-[#a1a1aa]">Actual: {currentMaxExposure.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scenarioMaxExposure}
                  onChange={(e) => setScenarioMaxExposure(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-[#27272a] rounded-full appearance-none cursor-pointer accent-blue-600 dark:accent-[#0221B7]"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[11px] text-gray-400 dark:text-[#71717a]">0%</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-[#d4d4d8]">{scenarioMaxExposure}%</span>
                  <span className="text-[11px] text-gray-400 dark:text-[#71717a]">100%</span>
                </div>
              </div>

              {/* Population Vulnerability */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-[#d4d4d8]">Population Vulnerability</span>
                  <span className="text-xs text-gray-500 dark:text-[#a1a1aa]">Actual: {currentTotPop > 0 ? Math.round((currentMaxExposedPop / currentTotPop) * 100) : 0}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scenarioPopRatio}
                  onChange={(e) => setScenarioPopRatio(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-[#27272a] rounded-full appearance-none cursor-pointer accent-blue-600 dark:accent-[#0221B7]"
                />
                <div className="flex justify-between mt-2">
                  <span className="text-[11px] text-gray-400 dark:text-[#71717a]">0%</span>
                  <span className="text-sm font-semibold text-gray-700 dark:text-[#d4d4d8]">{scenarioPopRatio}%</span>
                  <span className="text-[11px] text-gray-400 dark:text-[#71717a]">100%</span>
                </div>
              </div>
            </div>

            {/* Presets */}
            <div className="flex gap-3">
              <button onClick={() => { setScenarioYears(Math.min(currentYearsExposed + 1, 5)); setScenarioMaxExposure(Math.min(Math.round(currentMaxExposure + 15), 100)); setScenarioPopRatio(Math.min(scenarioPopRatio + 15, 100)); }} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-red-50 dark:bg-[#E11D48]/10 text-red-700 dark:text-[#E11D48] border border-red-200 dark:border-[#E11D48]/20 hover:bg-red-100 dark:hover:bg-[#E11D48]/20 transition-colors">
                Worse Scenario
              </button>
              <button onClick={() => { setScenarioYears(Math.max(currentYearsExposed - 1, 0)); setScenarioMaxExposure(Math.max(Math.round(currentMaxExposure - 15), 0)); setScenarioPopRatio(Math.max(scenarioPopRatio - 15, 0)); }} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-green-50 dark:bg-[#13E83A]/10 text-green-700 dark:text-[#13E83A] border border-green-200 dark:border-[#13E83A]/20 hover:bg-green-100 dark:hover:bg-[#13E83A]/20 transition-colors">
                Better Scenario
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={handleReset} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-[#1c1c1c] text-gray-600 dark:text-[#a1a1aa] border border-gray-200 dark:border-[#27272a] hover:bg-gray-200 dark:hover:bg-[#27272a] transition-colors">
                Reset
              </button>
              <button onClick={() => setHasRun(true)} className="flex-1 py-3 rounded-xl text-sm font-bold bg-blue-600 dark:bg-[#0221B7] text-white hover:bg-blue-700 dark:hover:bg-[#0221B7]/80 transition-colors shadow-sm">
                Run Scenario
              </button>
            </div>

            {/* Explanation */}
            {hasRun && explanation && (
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-[#0221B7]/10 border border-blue-100 dark:border-[#0221B7]/20">
                <p className="text-xs text-blue-800 dark:text-[#93c5fd] leading-relaxed">{explanation.explanation}</p>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-[#F0B01A]/10 rounded-xl p-3 border border-amber-100 dark:border-[#F0B01A]/20">
              <p className="text-[11px] text-amber-700 dark:text-[#F0B01A]">
                Hypothetical scenarios are temporary and do NOT modify actual NAVIS data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
