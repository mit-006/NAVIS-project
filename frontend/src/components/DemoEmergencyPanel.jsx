import React from 'react';
import { useDemoMode } from '../demo/DemoModeContext';

function ProgressBar({ step, total }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <div className="w-full h-1.5 bg-gray-200 dark:bg-[#27272a] rounded-full overflow-hidden">
      <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

function StepItem({ step, index, currentStep }) {
  const done = index < currentStep;
  const active = index === currentStep;
  return (
    <div className={`flex items-center gap-2 py-1 transition-all ${done ? 'opacity-100' : active ? 'opacity-100' : 'opacity-40'}`}>
      <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold ${
        done ? 'bg-green-500 text-white' : active ? 'bg-amber-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-[#27272a] text-gray-400'
      }`}>
        {done ? '✓' : index + 1}
      </span>
      <span className={`text-[10px] ${done ? 'text-green-700 dark:text-green-400 font-semibold' : active ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-gray-400 dark:text-[#71717a]'}`}>
        {step.label}
      </span>
    </div>
  );
}

function AffectedHabCard({ hab, site }) {
  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-3 border border-gray-200 dark:border-[#27272a]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-900 dark:text-white">{hab.name}</p>
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">{hab.actionLevel}</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div><span className="text-gray-500 dark:text-[#71717a]">Population at risk:</span> <span className="font-bold text-gray-900 dark:text-white">{hab.population.toLocaleString()}</span></div>
        <div><span className="text-gray-500 dark:text-[#71717a]">Flood impact:</span> <span className="font-bold text-amber-600 dark:text-amber-400">{hab.floodImpact}</span></div>
        <div><span className="text-gray-500 dark:text-[#71717a]">Current flooding:</span> <span className="font-bold text-amber-600 dark:text-amber-400 italic">NOT CONFIRMED</span></div>
        <div><span className="text-gray-500 dark:text-[#71717a]">Priority:</span> <span className="font-bold text-gray-900 dark:text-white">{hab.priority} ({hab.priorityScore})</span></div>
      </div>
      {site && (
        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-[#27272a]">
          <p className="text-[10px] text-green-700 dark:text-green-400 font-semibold">
            → Recommended: {site.name} ({site.distanceKm} km, {site.travelTimeMin} min)
          </p>
        </div>
      )}
    </div>
  );
}

function RelocationPlanCard({ hab, site }) {
  const remaining = site.capacity - hab.population;
  return (
    <div className="bg-white dark:bg-[#0a0a0a] rounded-lg p-3 border border-gray-200 dark:border-[#27272a]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">🏠</span>
        <p className="text-xs font-bold text-gray-900 dark:text-white">{hab.name}</p>
      </div>
      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-gray-500 dark:text-[#71717a]">Population planned:</span><span className="font-bold text-gray-900 dark:text-white">{hab.population.toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-[#71717a]">Site:</span><span className="font-bold text-gray-900 dark:text-white">{site.name}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-[#71717a]">Capacity:</span><span className="font-bold text-gray-900 dark:text-white">{site.capacity.toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-[#71717a]">Remaining:</span><span className="font-bold text-green-600 dark:text-green-400">{remaining.toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-[#71717a]">Distance:</span><span className="font-bold text-gray-900 dark:text-white">{site.distanceKm} km ({site.travelTimeMin} min)</span></div>
        <div className="flex justify-between"><span className="text-gray-500 dark:text-[#71717a]">Capacity status:</span><span className={`font-bold ${remaining > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{remaining > 0 ? 'SUFFICIENT' : 'INSUFFICIENT'}</span></div>
      </div>
    </div>
  );
}

export default function DemoEmergencyPanel() {
  const {
    demoMode, simulating, simulationStep, simulationComplete, showResults,
    steps, complete, affectedHabitations, relocationSites, routes,
  } = useDemoMode();

  if (!demoMode) return null;
  if (!simulating && !simulationComplete && !showResults) return null;

  const getSiteForHab = (habId) => {
    const route = routes.find(r => r.habitationId === habId);
    return route ? relocationSites.find(s => s.id === route.siteId) : null;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 sm:left-auto sm:right-3 sm:bottom-3 sm:w-[340px] md:w-[380px] z-[1002] max-h-[70vh] sm:max-h-[80vh]">
      <div className="bg-white dark:bg-[#141414] sm:rounded-xl shadow-2xl border border-gray-200 dark:border-[#27272a] overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>
        {/* Header */}
        <div className={`px-4 py-3 flex-shrink-0 ${
          simulationComplete ? 'bg-red-700 text-white' : 'bg-amber-600 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{simulationComplete ? '🚨' : '⚠️'}</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                {simulationComplete ? 'Pre-Disaster Plan Ready' : 'Simulated Flood Warning'}
              </p>
              <p className="text-[9px] opacity-80">SIMULATED — Not a real emergency</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Progress Steps */}
          {simulating && (
            <div>
              <ProgressBar step={simulationStep} total={steps.length} />
              <div className="mt-2 space-y-0.5">
                {steps.map((step, i) => (
                  <StepItem key={step.key} step={step} index={i} currentStep={simulationStep} />
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {showResults && (
            <>
              {/* Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">✅</span>
                  <p className="text-[11px] font-bold text-green-800 dark:text-green-300 uppercase tracking-wider">Plan Ready</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div><span className="text-green-700 dark:text-green-400">Affected:</span> <span className="font-bold text-green-900 dark:text-green-200">{complete.summary.affectedHabitations}</span></div>
                  <div><span className="text-green-700 dark:text-green-400">Pop at risk:</span> <span className="font-bold text-green-900 dark:text-green-200">{complete.summary.populationAtRisk.toLocaleString()}</span></div>
                  <div><span className="text-green-700 dark:text-green-400">Sites:</span> <span className="font-bold text-green-900 dark:text-green-200">{complete.summary.recommendedSites}</span></div>
                  <div><span className="text-green-700 dark:text-green-400">Routes:</span> <span className="font-bold text-green-900 dark:text-green-200">{complete.summary.routesGenerated}</span></div>
                </div>
              </div>

              {/* Affected Habitations */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-2">Potentially Affected Habitations</p>
                <div className="space-y-2">
                  {affectedHabitations.map(hab => (
                    <AffectedHabCard key={hab.id} hab={hab} site={getSiteForHab(hab.id)} />
                  ))}
                </div>
              </div>

              {/* Relocation Plans */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-2">Relocation Plans</p>
                <div className="space-y-2">
                  {affectedHabitations.map(hab => {
                    const site = getSiteForHab(hab.id);
                    return site ? <RelocationPlanCard key={hab.id} hab={hab} site={site} /> : null;
                  })}
                </div>
              </div>

              {/* Relocation Sites Ranking */}
              <div>
                <p className="text-[10px] font-semibold text-gray-400 dark:text-[#71717a] uppercase tracking-wider mb-2">Simulated Relocation Sites</p>
                <div className="space-y-1.5">
                  {relocationSites.sort((a, b) => b.suitability - a.suitability).map((site, i) => (
                    <div key={site.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-[#1c1c1c] border border-gray-100 dark:border-[#27272a]">
                      <span className="text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📍'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-gray-900 dark:text-white truncate">{site.name}</p>
                        <p className="text-[9px] text-gray-500 dark:text-[#71717a]">{site.suitability}/100 · {site.capacity} cap · {site.distanceKm} km</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        site.status === 'Sufficient' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>{site.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800/30">
                <p className="text-[9px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Analytical decision-support demonstration — not an official evacuation directive. All values are simulated for presentation purposes.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
