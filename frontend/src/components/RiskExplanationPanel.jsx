import React from 'react';
import { getRiskExplanation, FLOOD_YEARS, getExposureCategory } from '../data/floodData';

function FactorBar({ normValue, color }) {
  const width = Math.min(Math.max(normValue, 2), 100);
  return (
    <div className="w-full h-1.5 bg-gray-200 dark:bg-[#27272a] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  );
}

export default function RiskExplanationPanel({ feature, onClose }) {
  const data = getRiskExplanation(feature);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[1010]" onClick={onClose} />

      {/* Mobile: bottom-sheet */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-[1011]" style={{ maxHeight: '70vh' }}>
        <div className="bg-white dark:bg-[#141414] rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-[#27272a] flex flex-col overflow-hidden" style={{ height: '70vh' }}>
          {/* Header */}
          <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b border-gray-100 dark:border-[#27272a]">
            <div className="w-10 h-1 bg-gray-300 dark:bg-[#3f3f46] rounded-full mx-auto mb-3" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-blue-600 dark:text-[#0221B7] uppercase tracking-wider">Why This Habitation?</p>
                <h3 className="font-bold text-gray-900 dark:text-white text-base truncate mt-0.5">{data.habitation}</h3>
                <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa]">NAVIS Priority Assessment</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-[#a1a1aa] hover:text-gray-600 dark:hover:text-white transition-colors flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Priority + Score */}
            <div className="flex items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ backgroundColor: data.scoreBg, color: data.scoreColor, border: `1px solid ${data.scoreBorder}` }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.scoreColor }} />
                {data.priority}
              </span>
              <span className="text-[11px] font-semibold text-gray-600 dark:text-[#a1a1aa]">
                Score: {data.score} / 100
              </span>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            {/* Factor breakdown */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-2">Factor Breakdown</p>
              <div className="space-y-3">
                {data.factors.map((f) => (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 dark:text-[#d4d4d8]">{f.name}</span>
                      <span className="text-[11px] font-semibold" style={{ color: data.scoreColor }}>{f.display}</span>
                    </div>
                    <FactorBar normValue={f.normValue} color={data.scoreColor} />
                    <p className="text-[10px] text-gray-500 dark:text-[#a1a1aa] mt-1">{f.description}</p>
                    <p className="text-[9px] text-gray-400 dark:text-[#71717a]">Weight: {(f.weight * 100).toFixed(0)}% of score</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical flood exposure */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-2">Historical Flood Exposure</p>
              <div className="space-y-1">
                {data.exposureHistory.map((e) => {
                  const cat = getExposureCategory(e.pct);
                  return (
                    <div key={e.year} className="flex items-center gap-2 py-1">
                      <span className="text-[11px] font-mono w-8 text-gray-500 dark:text-[#a1a1aa]">{e.year}</span>
                      <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${e.exposed ? 'text-green-600 dark:text-[#13E83A]' : 'text-gray-300 dark:text-[#3f3f46]'}`}>
                        {e.exposed ? '✓' : '✕'}
                      </span>
                      {e.exposed && (
                        <span className="text-[11px] font-medium" style={{ color: cat.color }}>{e.pct.toFixed(1)}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-[#1c1c1c]">
                <span className="text-[11px] text-gray-500 dark:text-[#a1a1aa]">Years Exposed:</span>
                <span className="text-[11px] font-bold text-gray-900 dark:text-white">{data.exposureYears} <span className="font-normal text-gray-400 dark:text-[#71717a]">/ {FLOOD_YEARS.length}</span></span>
              </div>
            </div>

            {/* Explanation */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-[#0221B7]/10 border border-blue-100 dark:border-[#0221B7]/20">
              <p className="text-[11px] text-blue-800 dark:text-[#93c5fd] leading-relaxed">{data.explanation}</p>
            </div>

            {/* Decision summary */}
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-1">NAVIS Decision</p>
              <p className="text-[11px] text-gray-700 dark:text-[#d4d4d8] leading-relaxed">{data.decisionSummary}</p>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-[#F0B01A]/10 rounded-lg p-2 border border-amber-100 dark:border-[#F0B01A]/20">
              <p className="text-[10px] text-amber-700 dark:text-[#F0B01A]">
                This explanation is derived from existing NAVIS analytical data. It does NOT constitute an official risk classification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: modal panel */}
      <div className="hidden sm:flex fixed inset-0 items-center justify-center z-[1011] p-4">
        <div className="bg-white dark:bg-[#141414] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#27272a] w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100 dark:border-[#27272a]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold text-blue-600 dark:text-[#0221B7] uppercase tracking-wider">Why This Habitation?</p>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mt-0.5">{data.habitation}</h3>
                <p className="text-xs text-gray-500 dark:text-[#a1a1aa]">NAVIS Priority Assessment</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-[#a1a1aa] hover:text-gray-600 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Priority + Score */}
            <div className="flex items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: data.scoreBg, color: data.scoreColor, border: `1px solid ${data.scoreBorder}` }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.scoreColor }} />
                {data.priority}
              </span>
              <span className="text-xs font-semibold text-gray-600 dark:text-[#a1a1aa]">Score: {data.score} / 100</span>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {/* Factor breakdown */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-3">Factor Breakdown</p>
              <div className="space-y-4">
                {data.factors.map((f) => (
                  <div key={f.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-[#d4d4d8]">{f.name}</span>
                      <span className="text-xs font-bold" style={{ color: data.scoreColor }}>{f.display}</span>
                    </div>
                    <FactorBar normValue={f.normValue} color={data.scoreColor} />
                    <p className="text-[11px] text-gray-500 dark:text-[#a1a1aa] mt-1.5">{f.description}</p>
                    <p className="text-[10px] text-gray-400 dark:text-[#71717a]">Weight: {(f.weight * 100).toFixed(0)}% of score</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical flood exposure */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-3">Historical Flood Exposure</p>
              <div className="space-y-1.5">
                {data.exposureHistory.map((e) => {
                  const cat = getExposureCategory(e.pct);
                  return (
                    <div key={e.year} className="flex items-center gap-3 py-1.5">
                      <span className="text-xs font-mono w-8 text-gray-500 dark:text-[#a1a1aa]">{e.year}</span>
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-xs ${e.exposed ? 'text-green-600 dark:text-[#13E83A]' : 'text-gray-300 dark:text-[#3f3f46]'}`}>
                        {e.exposed ? '✓' : '✕'}
                      </span>
                      {e.exposed && (
                        <span className="text-xs font-medium" style={{ color: cat.color }}>{e.pct.toFixed(1)}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 dark:bg-[#1c1c1c]">
                <span className="text-xs text-gray-500 dark:text-[#a1a1aa]">Years Exposed:</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{data.exposureYears} <span className="font-normal text-gray-400 dark:text-[#71717a]">/ {FLOOD_YEARS.length}</span></span>
              </div>
            </div>

            {/* Explanation */}
            <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-[#0221B7]/10 border border-blue-100 dark:border-[#0221B7]/20">
              <p className="text-xs text-blue-800 dark:text-[#93c5fd] leading-relaxed">{data.explanation}</p>
            </div>

            {/* Decision summary */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#1c1c1c] border border-gray-200 dark:border-[#27272a]">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-1.5">NAVIS Decision</p>
              <p className="text-xs text-gray-700 dark:text-[#d4d4d8] leading-relaxed">{data.decisionSummary}</p>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 dark:bg-[#F0B01A]/10 rounded-xl p-3 border border-amber-100 dark:border-[#F0B01A]/20">
              <p className="text-[11px] text-amber-700 dark:text-[#F0B01A]">
                This explanation is derived from existing NAVIS analytical data. It does NOT constitute an official risk classification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
