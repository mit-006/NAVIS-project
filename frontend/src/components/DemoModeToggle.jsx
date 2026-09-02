import React from 'react';
import { useDemoMode } from '../demo/DemoModeContext';

export default function DemoModeToggle() {
  const { demoMode, enterDemoMode, exitDemoMode } = useDemoMode();

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => demoMode ? exitDemoMode() : enterDemoMode()}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] md:text-[11px] font-semibold transition-all border ${
          demoMode
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
        }`}
        title={demoMode ? 'Exit Demo Mode' : 'Enter Demo Mode'}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${demoMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`}></span>
        <span className="hidden sm:inline">{demoMode ? 'DEMO' : 'DEMO'}</span>
        <span className="sm:hidden">{demoMode ? 'DEMO' : 'DEMO'}</span>
      </button>
    </div>
  );
}
