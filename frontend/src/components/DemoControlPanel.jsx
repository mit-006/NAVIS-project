import React from 'react';
import { useDemoMode } from '../demo/DemoModeContext';

export default function DemoControlPanel() {
  const {
    demoMode, simulating, simulationComplete, alarmMuted,
    startSimulation, stopSimulation, exitDemoMode, toggleAlarmMute,
  } = useDemoMode();

  if (!demoMode) return null;
  if (simulating || simulationComplete) return null;

  return (
    <div className="absolute top-3 left-3 md:top-4 md:left-4 z-[1002] max-w-[260px] md:max-w-[280px]">
      <div className="bg-white dark:bg-[#141414] rounded-xl shadow-2xl border border-gray-200 dark:border-[#27272a] overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/30">
          <div className="flex items-center gap-2">
            <span className="text-sm">🧪</span>
            <div>
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Simulation Mode</p>
              <p className="text-[9px] text-amber-600 dark:text-amber-400">Simulated Flood Emergency</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-3 space-y-2">
          <button
            onClick={startSimulation}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            SIMULATE FLOOD EMERGENCY
          </button>

          <div className="flex gap-2">
            <button
              onClick={toggleAlarmMute}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors"
              style={{
                background: alarmMuted ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                borderColor: 'var(--border-primary)',
                color: 'var(--text-secondary)',
              }}
            >
              {alarmMuted ? '🔇' : '🔊'} {alarmMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
              onClick={exitDemoMode}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              ✕ Exit Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
