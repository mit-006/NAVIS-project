import React from 'react';
import { useDemoMode } from '../demo/DemoModeContext';
import { DEMO_DISCLAIMER } from '../demo/demoData';

export default function DemoBanner() {
  const { demoMode, simulating, simulationComplete } = useDemoMode();
  if (!demoMode) return null;

  return (
    <div className={`px-4 py-2 text-center text-xs font-semibold z-[9998] flex-shrink-0 transition-colors ${
      simulating
        ? 'bg-amber-600 text-white'
        : simulationComplete
          ? 'bg-red-700 text-white'
          : 'bg-amber-500/90 text-white'
    }`}>
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm">{simulating ? '⚠️' : simulationComplete ? '🚨' : '🧪'}</span>
        <span className="uppercase tracking-wider">
          {simulating ? 'Simulation In Progress' : simulationComplete ? 'Simulation Complete' : 'Simulation Mode'}
        </span>
        <span className="hidden md:inline text-[10px] opacity-80 normal-case tracking-normal">|</span>
        <span className="hidden md:inline text-[10px] opacity-80 normal-case tracking-normal font-normal">{DEMO_DISCLAIMER}</span>
      </div>
    </div>
  );
}
