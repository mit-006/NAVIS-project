import React from 'react';
import { useDemoMode } from '../demo/DemoModeContext';
import { SCENARIO_TITLE, SCENARIO_DISCLAIMER } from '../demo/demoEmergencyScenario';

function StepIndicator({ step, index, currentStep, completedSteps }) {
  const done = completedSteps.includes(index);
  const active = index === currentStep;
  return (
    <div className={`flex items-center gap-2 transition-all duration-500 ${done || active ? 'opacity-100' : 'opacity-30'}`}>
      <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold transition-all duration-300 ${
        done ? 'bg-[#13E83A] text-black' : active ? 'bg-[#F0B01A] text-black animate-pulse' : 'bg-[#27272a] text-[#71717a]'
      }`}>
        {done ? '✓' : step.icon}
      </span>
      <div className="min-w-0">
        <p className={`text-[11px] font-semibold truncate ${
          done ? 'text-[#13E83A]' : active ? 'text-[#F0B01A]' : 'text-[#71717a]'
        }`}>{step.label}</p>
        {active && (
          <p className="text-[9px] text-[#a1a1aa] truncate animate-pulse">{step.description}</p>
        )}
      </div>
    </div>
  );
}

function VillageCard({ village, site, route, index }) {
  const remaining = site ? site.capacity - village.population : 0;
  return (
    <div className="bg-[#141414]/95 backdrop-blur-sm border border-[#27272a] rounded-lg p-3 animate-[fadeSlideIn_0.5s_ease-out] shadow-2xl">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold bg-[#E11D48]/20 text-[#E11D48] px-1.5 py-0.5 rounded">VILLAGE {String.fromCharCode(65 + index)}</span>
        <span className="text-[10px] font-bold text-white">{village.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
        <div className="flex justify-between"><span className="text-[#71717a]">Population at risk:</span><span className="font-bold text-white">{village.population.toLocaleString()}</span></div>
        <div className="flex justify-between"><span className="text-[#71717a]">Impact:</span><span className="font-bold text-[#F0B01A]">{village.floodImpact}</span></div>
        <div className="flex justify-between"><span className="text-[#71717a]">Priority:</span><span className="font-bold text-white">{village.priority}</span></div>
        <div className="flex justify-between"><span className="text-[#71717a]">Flooding:</span><span className="font-bold text-[#F0B01A] italic">NOT CONFIRMED</span></div>
      </div>
      {site && (
        <div className="mt-2 pt-2 border-t border-[#27272a]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px]">🏠</span>
            <span className="text-[10px] font-bold text-[#13E83A]">{site.name}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <div className="flex justify-between"><span className="text-[#71717a]">Capacity:</span><span className="font-bold text-white">{site.capacity.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[#71717a]">Remaining:</span><span className="font-bold text-[#13E83A]">{remaining.toLocaleString()}</span></div>
            {route && (
              <>
                <div className="flex justify-between"><span className="text-[#71717a]">Distance:</span><span className="font-bold text-white">~{route.distanceKm} km</span></div>
                <div className="flex justify-between"><span className="text-[#71717a]">Travel time:</span><span className="font-bold text-white">~{route.travelTimeMin} min</span></div>
              </>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${remaining > 0 ? 'bg-[#13E83A]/20 text-[#13E83A]' : 'bg-[#E11D48]/20 text-[#E11D48]'}`}>
              {remaining > 0 ? '✓ SUFFICIENT CAPACITY' : '✕ INSUFFICIENT'}
            </span>
            {route && <span className="text-[9px] text-[#71717a]">via {route.roadName}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function FinalPlanCard({ villages, sites, routes }) {
  const totalPop = villages.reduce((s, v) => s + v.population, 0);
  return (
    <div className="bg-[#141414]/95 backdrop-blur-sm border border-[#0221B7]/40 rounded-xl p-4 animate-[fadeSlideIn_0.6s_ease-out] shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🚨</span>
        <div>
          <p className="text-xs font-bold text-white uppercase tracking-wider">Pre-Disaster Relocation Plan</p>
          <p className="text-[9px] text-[#a1a1aa]">Analytical demonstration — not an official evacuation directive</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-[#0a0a0a] rounded-lg p-2.5 border border-[#27272a] text-center">
          <p className="text-lg font-bold text-[#E11D48]">{villages.length}</p>
          <p className="text-[9px] text-[#71717a] uppercase">Affected</p>
        </div>
        <div className="bg-[#0a0a0a] rounded-lg p-2.5 border border-[#27272a] text-center">
          <p className="text-lg font-bold text-[#F0B01A]">{totalPop.toLocaleString()}</p>
          <p className="text-[9px] text-[#71717a] uppercase">People at Risk</p>
        </div>
        <div className="bg-[#0a0a0a] rounded-lg p-2.5 border border-[#27272a] text-center">
          <p className="text-lg font-bold text-[#13E83A]">{routes.length}</p>
          <p className="text-[9px] text-[#71717a] uppercase">Routes Ready</p>
        </div>
      </div>

      <div className="space-y-2">
        {villages.map((v, i) => {
          const route = routes.find(r => r.villageId === v.id);
          const site = route ? sites.find(s => s.id === route.siteId) : null;
          if (!site || !route) return null;
          const remaining = site.capacity - v.population;
          return (
            <div key={v.id} className="bg-[#0a0a0a] rounded-lg p-2.5 border border-[#27272a] flex items-center gap-3">
              <span className="text-[10px] font-bold bg-[#E11D48]/20 text-[#E11D48] px-1.5 py-0.5 rounded flex-shrink-0">FROM</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate">{v.name}</p>
                <p className="text-[9px] text-[#71717a]">{v.population.toLocaleString()} people</p>
              </div>
              <span className="text-[#0221B7] text-sm">→</span>
              <span className="text-[10px] font-bold bg-[#13E83A]/20 text-[#13E83A] px-1.5 py-0.5 rounded flex-shrink-0">TO</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white truncate">{site.name}</p>
                <p className="text-[9px] text-[#71717a]">~{route.distanceKm} km · ~{route.travelTimeMin} min</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${remaining > 0 ? 'bg-[#13E83A]/20 text-[#13E83A]' : 'bg-[#E11D48]/20 text-[#E11D48]'}`}>
                {remaining > 0 ? 'OK' : 'FULL'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[9px] text-[#a1a1aa] italic">STATUS: READY FOR AUTHORITY REVIEW</span>
        <span className="text-[9px] text-[#71717a]">SIMULATED</span>
      </div>
    </div>
  );
}

export default function EmergencyResponseScreen() {
  const {
    demoMode, simulating, currentStep, completedSteps,
    activeVillageIndex, showFinalPlan,
    exitDemoMode, stopSimulation, toggleAlarmMute, alarmMuted,
    villages, sites, routes, steps,
  } = useDemoMode();

  if (!demoMode) return null;

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Top Bar */}
      <div className="pointer-events-auto absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-[#141414]/95 backdrop-blur-sm border-b border-[#27272a] shadow-lg z-[10001]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm animate-pulse flex-shrink-0">🚨</span>
          <span className="text-[10px] font-bold text-[#E11D48] uppercase tracking-wider flex-shrink-0">Simulation</span>
          <span className="text-[9px] text-[#71717a] hidden sm:inline flex-shrink-0">|</span>
          <span className="text-[9px] text-[#71717a] hidden sm:inline truncate">{SCENARIO_TITLE}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={toggleAlarmMute}
            className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border border-[#27272a] text-[#a1a1aa] hover:bg-[#1c1c1c] transition-colors"
          >
            {alarmMuted ? '🔇' : '🔊'} {alarmMuted ? 'Unmute' : 'Mute'}
          </button>
          <button
            onClick={() => { stopSimulation(); exitDemoMode(); }}
            className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border border-[#E11D48]/40 text-[#E11D48] hover:bg-[#E11D48]/10 transition-colors"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Step progress — top-left on map */}
      {simulating && currentStep >= 0 && currentStep < steps.length && (
        <div className="pointer-events-auto absolute top-14 left-3 z-[10001] max-w-[300px] sm:max-w-[340px]">
          <div className="bg-[#141414]/95 backdrop-blur-sm border border-[#27272a] rounded-lg p-3 shadow-2xl animate-[fadeSlideIn_0.3s_ease-out]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{steps[currentStep].icon}</span>
              <p className="text-[11px] font-bold text-white">{steps[currentStep].label}</p>
            </div>
            <p className="text-[9px] text-[#a1a1aa] mb-2">{steps[currentStep].description}</p>
            <div className="space-y-1">
              {steps.map((s, i) => (
                <StepIndicator key={s.key} step={s} index={i} currentStep={currentStep} completedSteps={completedSteps} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Village cards — bottom-left on map */}
      {activeVillageIndex >= 0 && !showFinalPlan && (
        <div className="pointer-events-auto absolute bottom-14 left-3 right-3 sm:right-auto sm:max-w-[380px] z-[10001] overflow-y-auto max-h-[35vh] sm:max-h-[45vh] space-y-2">
          {villages.slice(0, activeVillageIndex + 1).map((v, i) => {
            const route = routes.find(r => r.villageId === v.id);
            const site = route ? sites.find(s => s.id === route.siteId) : null;
            return (
              <VillageCard key={v.id} village={v} site={site} route={route} index={i} />
            );
          })}
        </div>
      )}

      {/* Final plan — bottom of map */}
      {showFinalPlan && (
        <div className="pointer-events-auto absolute bottom-14 left-3 right-3 sm:right-auto sm:max-w-[520px] z-[10001] overflow-y-auto max-h-[45vh] sm:max-h-[55vh]">
          <FinalPlanCard villages={villages} sites={sites} routes={routes} />
        </div>
      )}

      {/* Bottom status */}
      <div className="pointer-events-auto absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-1.5 bg-[#141414]/95 backdrop-blur-sm border-t border-[#27272a] z-[10001]">
        <span className="text-[9px] text-[#71717a] italic truncate">{SCENARIO_DISCLAIMER}</span>
        <span className="text-[9px] text-[#71717a] flex-shrink-0 ml-2">NAVIS Demo</span>
      </div>
    </div>
  );
}
