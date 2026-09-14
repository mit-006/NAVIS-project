import React, { useState, useMemo } from 'react';
import { FLOOD_YEARS, getExposureCategory, compareHabitations } from '../data/floodData';

function HabitationSelector({ label, features, selected, onSelect, excludeId, colors: c }) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    return features.filter(f => {
      if (f.properties.pc11_tv_id === excludeId) return false;
      if (!search) return true;
      return f.properties.Name.toLowerCase().includes(search.toLowerCase());
    });
  }, [features, search, excludeId]);

  return (
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: c.secondaryText }}>{label}</label>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search habitation..."
        className="w-full px-3 py-2 rounded-lg text-xs border outline-none transition-colors mb-1.5"
        style={{ background: c.inputBg, borderColor: c.border, color: c.primaryText }}
      />
      <div className="max-h-32 overflow-y-auto rounded-lg border" style={{ borderColor: c.border, background: c.surface }}>
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-[11px]" style={{ color: c.secondaryText }}>No results</p>
        )}
        {filtered.slice(0, 30).map(f => {
          const isSelected = selected && f.properties.pc11_tv_id === selected.properties.pc11_tv_id;
          return (
            <button
              key={f.properties.pc11_tv_id}
              onClick={() => onSelect(f)}
              className="w-full text-left px-3 py-2 text-xs border-b last:border-b-0 transition-colors"
              style={{
                background: isSelected ? c.selectedBg : 'transparent',
                borderColor: c.border,
                color: isSelected ? c.primaryText : c.secondaryText,
                fontWeight: isSelected ? 600 : 400,
              }}
            >
              {f.properties.Name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MetricRow({ label, valueA, valueB, higherIsBetter, colors: c }) {
  const aWins = higherIsBetter ? valueA > valueB : valueA < valueB;
  const bWins = higherIsBetter ? valueB > valueA : valueB < valueA;
  const tie = valueA === valueB;

  return (
    <div className="grid grid-cols-[1fr_80px_80px] gap-2 items-center py-2 border-b" style={{ borderColor: c.border }}>
      <span className="text-xs font-medium" style={{ color: c.secondaryText }}>{label}</span>
      <span className="text-xs font-semibold text-center px-1 py-0.5 rounded" style={{
        color: aWins ? c.danger : tie ? c.secondaryText : c.primaryText,
        background: aWins ? `${c.danger}15` : 'transparent',
      }}>{valueA}</span>
      <span className="text-xs font-semibold text-center px-1 py-0.5 rounded" style={{
        color: bWins ? c.danger : tie ? c.secondaryText : c.primaryText,
        background: bWins ? `${c.danger}15` : 'transparent',
      }}>{valueB}</span>
    </div>
  );
}

export default function HabitationComparisonPanel({ features, onClose, onSelectHabitation }) {
  const [featureA, setFeatureA] = useState(null);
  const [featureB, setFeatureB] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const comparison = useMemo(() => {
    if (!featureA || !featureB) return null;
    return compareHabitations(featureA, featureB);
  }, [featureA, featureB]);

  const canCompare = featureA && featureB && featureA.properties.pc11_tv_id !== featureB.properties.pc11_tv_id;

  const handleSwap = () => {
    const temp = featureA;
    setFeatureA(featureB);
    setFeatureB(temp);
  };

  const handleClear = () => {
    setFeatureA(null);
    setFeatureB(null);
    setShowResults(false);
  };

  const dark = document.documentElement.classList.contains('dark');
  const c = dark ? {
    bg: '#141414', surface: '#1c1c1c', border: '#27272a', primaryText: '#ffffff', secondaryText: '#a1a1aa',
    inputBg: '#0a0a0a', selectedBg: '#0221B720', blue: '#0221B7', pink: '#B7027B',
    success: '#13E83A', warning: '#F0B01A', danger: '#E11D48',
  } : {
    bg: '#ffffff', surface: '#f4f4f5', border: '#e4e4e7', primaryText: '#18181b', secondaryText: '#71717a',
    inputBg: '#ffffff', selectedBg: '#0221B710', blue: '#0221B7', pink: '#B7027B',
    success: '#16a34a', warning: '#ca8a04', danger: '#dc2626',
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[1030]" onClick={onClose} />

      {/* Mobile */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-[1031]" style={{ maxHeight: '80vh' }}>
        <div className="rounded-t-2xl shadow-2xl flex flex-col overflow-hidden" style={{ height: '80vh', background: c.bg, borderTop: `1px solid ${c.border}` }}>
          <div className="flex-shrink-0 px-4 pt-3 pb-3 border-b" style={{ borderColor: c.border }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: c.border }} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.blue }}>Habitation Comparison</p>
                <h3 className="font-bold text-base mt-0.5" style={{ color: c.primaryText }}>Compare Side-by-Side</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg transition-colors flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center" style={{ color: c.secondaryText }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {!showResults ? (
              <>
                <div className="flex gap-2 items-end">
                  <HabitationSelector label="Habitation A" features={features} selected={featureA} onSelect={setFeatureA} excludeId={featureB?.properties?.pc11_tv_id} colors={c} />
                  <button onClick={handleSwap} className="px-2 py-2 rounded-lg text-xs font-semibold mb-0.5" style={{ background: c.surface, color: c.secondaryText, border: `1px solid ${c.border}` }}>⇄</button>
                  <HabitationSelector label="Habitation B" features={features} selected={featureB} onSelect={setFeatureB} excludeId={featureA?.properties?.pc11_tv_id} colors={c} />
                </div>
                {featureA && featureB && featureA.properties.pc11_tv_id === featureB.properties.pc11_tv_id && (
                  <p className="text-[11px] text-center py-1" style={{ color: c.warning }}>Please select two different habitations.</p>
                )}
                <button onClick={() => setShowResults(true)} disabled={!canCompare} className="w-full py-2.5 rounded-xl text-xs font-bold transition-colors" style={{
                  background: canCompare ? c.blue : c.surface, color: canCompare ? '#ffffff' : c.secondaryText, cursor: canCompare ? 'pointer' : 'not-allowed',
                }}>Compare</button>
              </>
            ) : comparison ? (
              <>
                {/* Header comparison */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center text-center">
                  <div className="p-3 rounded-xl" style={{ background: comparison.higherRisk === 'A' ? `${c.danger}10` : c.surface, border: `1px solid ${comparison.higherRisk === 'A' ? `${c.danger}30` : c.border}` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.secondaryText }}>{comparison.nameA}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: comparison.priorityA.color }}>{comparison.priorityA.level}</p>
                    <p className="text-[11px] font-semibold" style={{ color: comparison.priorityA.color }}>{comparison.priorityA.score} / 100</p>
                  </div>
                  <div className="text-sm font-bold" style={{ color: c.secondaryText }}>VS</div>
                  <div className="p-3 rounded-xl" style={{ background: comparison.higherRisk === 'B' ? `${c.danger}10` : c.surface, border: `1px solid ${comparison.higherRisk === 'B' ? `${c.danger}30` : c.border}` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.secondaryText }}>{comparison.nameB}</p>
                    <p className="text-xl font-bold mt-1" style={{ color: comparison.priorityB.color }}>{comparison.priorityB.level}</p>
                    <p className="text-[11px] font-semibold" style={{ color: comparison.priorityB.color }}>{comparison.priorityB.score} / 100</p>
                  </div>
                </div>

                {/* Higher risk indicator */}
                {comparison.higherRisk !== 'tie' && (
                  <div className="p-2.5 rounded-lg text-center" style={{ background: `${c.danger}10`, border: `1px solid ${c.danger}25` }}>
                    <p className="text-[11px] font-semibold" style={{ color: c.danger }}>
                      Higher Priority: {comparison.higherRisk === 'A' ? comparison.nameA : comparison.nameB} · {comparison.higherRisk === 'A' ? comparison.priorityA.score : comparison.priorityB.score}
                    </p>
                  </div>
                )}

                {/* Metrics */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
                  <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-3 py-2 border-b" style={{ background: c.surface, borderColor: c.border }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.secondaryText }}>Metric</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: c.secondaryText }}>A</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: c.secondaryText }}>B</span>
                  </div>
                  <MetricRow label="Priority" valueA={comparison.priorityA.level} valueB={comparison.priorityB.level} higherIsBetter={false} colors={c} />
                  <MetricRow label="Score" valueA={String(comparison.priorityA.score)} valueB={String(comparison.priorityB.score)} higherIsBetter={false} colors={c} />
                  <MetricRow label="Years Exposed" valueA={`${comparison.yearsExposedA}/5`} valueB={`${comparison.yearsExposedB}/5`} higherIsBetter={false} colors={c} />
                  <MetricRow label="Max Exposure" valueA={`${comparison.maxExposureA.toFixed(1)}%`} valueB={`${comparison.maxExposureB.toFixed(1)}%`} higherIsBetter={false} colors={c} />
                  <MetricRow label="Population" valueA={comparison.populationA.toLocaleString()} valueB={comparison.populationB.toLocaleString()} higherIsBetter={false} colors={c} />
                  <MetricRow label="Households" valueA={comparison.householdsA.toLocaleString()} valueB={comparison.householdsB.toLocaleString()} higherIsBetter={false} colors={c} />
                  <MetricRow label="Children" valueA={comparison.childrenA.toLocaleString()} valueB={comparison.childrenB.toLocaleString()} higherIsBetter={false} colors={c} />
                </div>

                {/* Historical comparison */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
                  <div className="px-3 py-2 border-b" style={{ background: c.surface, borderColor: c.border }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.secondaryText }}>Historical Flood Exposure</p>
                  </div>
                  <div className="grid grid-cols-[1fr_60px_60px] gap-2 px-3 py-1.5 border-b" style={{ background: c.surface, borderColor: c.border }}>
                    <span className="text-[10px] font-semibold" style={{ color: c.secondaryText }}>Year</span>
                    <span className="text-[10px] font-semibold text-center" style={{ color: c.secondaryText }}>A</span>
                    <span className="text-[10px] font-semibold text-center" style={{ color: c.secondaryText }}>B</span>
                  </div>
                  {comparison.exposureHistory.map(e => {
                    const catA = getExposureCategory(e.pctA);
                    const catB = getExposureCategory(e.pctB);
                    return (
                      <div key={e.year} className="grid grid-cols-[1fr_60px_60px] gap-2 px-3 py-1.5 border-b last:border-b-0" style={{ borderColor: c.border }}>
                        <span className="text-[11px] font-mono" style={{ color: c.secondaryText }}>{e.year}</span>
                        <span className="text-[11px] text-center font-medium" style={{ color: e.exposedA ? catA.color : c.secondaryText }}>
                          {e.exposedA ? `${e.pctA.toFixed(1)}%` : '—'}
                        </span>
                        <span className="text-[11px] text-center font-medium" style={{ color: e.exposedB ? catB.color : c.secondaryText }}>
                          {e.exposedB ? `${e.pctB.toFixed(1)}%` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Interpretation */}
                <div className="p-3 rounded-xl" style={{ background: `${c.blue}10`, border: `1px solid ${c.blue}20` }}>
                  <p className="text-[11px] leading-relaxed" style={{ color: c.primaryText }}>{comparison.interpretation}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={handleClear} className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-colors" style={{ background: c.surface, color: c.secondaryText, border: `1px solid ${c.border}` }}>Clear</button>
                  <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-colors" style={{ background: c.blue, color: '#ffffff' }}>Done</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden sm:flex fixed inset-0 items-center justify-center z-[1031] p-4">
        <div className="rounded-2xl shadow-2xl w-full max-w-[760px] max-h-[80vh] flex flex-col overflow-hidden" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
          <div className="flex-shrink-0 px-5 py-4 border-b" style={{ borderColor: c.border }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.blue }}>Habitation Comparison</p>
                <h3 className="font-bold text-lg mt-0.5" style={{ color: c.primaryText }}>Compare Side-by-Side</h3>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ color: c.secondaryText }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {!showResults ? (
              <>
                <div className="flex gap-3 items-end">
                  <HabitationSelector label="Habitation A" features={features} selected={featureA} onSelect={setFeatureA} excludeId={featureB?.properties?.pc11_tv_id} colors={c} />
                  <button onClick={handleSwap} className="px-3 py-2 rounded-lg text-sm font-semibold mb-0.5 transition-colors" style={{ background: c.surface, color: c.secondaryText, border: `1px solid ${c.border}` }}>⇄ Swap</button>
                  <HabitationSelector label="Habitation B" features={features} selected={featureB} onSelect={setFeatureB} excludeId={featureA?.properties?.pc11_tv_id} colors={c} />
                </div>
                {featureA && featureB && featureA.properties.pc11_tv_id === featureB.properties.pc11_tv_id && (
                  <p className="text-xs text-center py-1" style={{ color: c.warning }}>Please select two different habitations.</p>
                )}
                <div className="flex gap-3 justify-end">
                  <button onClick={handleClear} className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors" style={{ background: c.surface, color: c.secondaryText, border: `1px solid ${c.border}` }}>Clear</button>
                  <button onClick={() => setShowResults(true)} disabled={!canCompare} className="px-6 py-2.5 rounded-xl text-xs font-bold transition-colors" style={{
                    background: canCompare ? c.blue : c.surface, color: canCompare ? '#ffffff' : c.secondaryText, cursor: canCompare ? 'pointer' : 'not-allowed',
                  }}>Compare</button>
                </div>
              </>
            ) : comparison ? (
              <>
                {/* Header comparison */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center text-center">
                  <div className="p-4 rounded-xl" style={{ background: comparison.higherRisk === 'A' ? `${c.danger}10` : c.surface, border: `1px solid ${comparison.higherRisk === 'A' ? `${c.danger}30` : c.border}` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.secondaryText }}>{comparison.nameA}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: comparison.priorityA.color }}>{comparison.priorityA.level}</p>
                    <p className="text-sm font-semibold" style={{ color: comparison.priorityA.color }}>{comparison.priorityA.score} / 100</p>
                  </div>
                  <div className="text-lg font-bold" style={{ color: c.secondaryText }}>VS</div>
                  <div className="p-4 rounded-xl" style={{ background: comparison.higherRisk === 'B' ? `${c.danger}10` : c.surface, border: `1px solid ${comparison.higherRisk === 'B' ? `${c.danger}30` : c.border}` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.secondaryText }}>{comparison.nameB}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: comparison.priorityB.color }}>{comparison.priorityB.level}</p>
                    <p className="text-sm font-semibold" style={{ color: comparison.priorityB.color }}>{comparison.priorityB.score} / 100</p>
                  </div>
                </div>

                {/* Higher risk indicator */}
                {comparison.higherRisk !== 'tie' && (
                  <div className="p-3 rounded-xl text-center" style={{ background: `${c.danger}10`, border: `1px solid ${c.danger}25` }}>
                    <p className="text-xs font-semibold" style={{ color: c.danger }}>
                      Higher Priority: {comparison.higherRisk === 'A' ? comparison.nameA : comparison.nameB} · {comparison.higherRisk === 'A' ? comparison.priorityA.score : comparison.priorityB.score}
                    </p>
                  </div>
                )}

                {/* Metrics */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
                  <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-4 py-2.5 border-b" style={{ background: c.surface, borderColor: c.border }}>
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.secondaryText }}>Metric</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: c.secondaryText }}>A</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: c.secondaryText }}>B</span>
                  </div>
                  <div className="px-4">
                    <MetricRow label="Priority" valueA={comparison.priorityA.level} valueB={comparison.priorityB.level} higherIsBetter={false} colors={c} />
                    <MetricRow label="Score" valueA={String(comparison.priorityA.score)} valueB={String(comparison.priorityB.score)} higherIsBetter={false} colors={c} />
                    <MetricRow label="Years Exposed" valueA={`${comparison.yearsExposedA}/5`} valueB={`${comparison.yearsExposedB}/5`} higherIsBetter={false} colors={c} />
                    <MetricRow label="Max Exposure" valueA={`${comparison.maxExposureA.toFixed(1)}%`} valueB={`${comparison.maxExposureB.toFixed(1)}%`} higherIsBetter={false} colors={c} />
                    <MetricRow label="Population" valueA={comparison.populationA.toLocaleString()} valueB={comparison.populationB.toLocaleString()} higherIsBetter={false} colors={c} />
                    <MetricRow label="Households" valueA={comparison.householdsA.toLocaleString()} valueB={comparison.householdsB.toLocaleString()} higherIsBetter={false} colors={c} />
                    <MetricRow label="Children" valueA={comparison.childrenA.toLocaleString()} valueB={comparison.childrenB.toLocaleString()} higherIsBetter={false} colors={c} />
                  </div>
                </div>

                {/* Historical comparison */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
                  <div className="px-4 py-2.5 border-b" style={{ background: c.surface, borderColor: c.border }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.secondaryText }}>Historical Flood Exposure</p>
                  </div>
                  <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-2 border-b" style={{ background: c.surface, borderColor: c.border }}>
                    <span className="text-[10px] font-semibold" style={{ color: c.secondaryText }}>Year</span>
                    <span className="text-[10px] font-semibold text-center" style={{ color: c.secondaryText }}>A</span>
                    <span className="text-[10px] font-semibold text-center" style={{ color: c.secondaryText }}>B</span>
                  </div>
                  <div className="px-4">
                    {comparison.exposureHistory.map(e => {
                      const catA = getExposureCategory(e.pctA);
                      const catB = getExposureCategory(e.pctB);
                      return (
                        <div key={e.year} className="grid grid-cols-[1fr_80px_80px] gap-2 py-2 border-b last:border-b-0" style={{ borderColor: c.border }}>
                          <span className="text-xs font-mono" style={{ color: c.secondaryText }}>{e.year}</span>
                          <span className="text-xs text-center font-medium" style={{ color: e.exposedA ? catA.color : c.secondaryText }}>
                            {e.exposedA ? `${e.pctA.toFixed(1)}%` : '—'}
                          </span>
                          <span className="text-xs text-center font-medium" style={{ color: e.exposedB ? catB.color : c.secondaryText }}>
                            {e.exposedB ? `${e.pctB.toFixed(1)}%` : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Interpretation */}
                <div className="p-4 rounded-xl" style={{ background: `${c.blue}10`, border: `1px solid ${c.blue}20` }}>
                  <p className="text-xs leading-relaxed" style={{ color: c.primaryText }}>{comparison.interpretation}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <button onClick={handleClear} className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors" style={{ background: c.surface, color: c.secondaryText, border: `1px solid ${c.border}` }}>Clear</button>
                  <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-xs font-bold transition-colors" style={{ background: c.blue, color: '#ffffff' }}>Done</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
