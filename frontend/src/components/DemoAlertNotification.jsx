import React from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '../demo/DemoModeContext';

export default function DemoAlertNotification() {
  const navigate = useNavigate();
  const { demoMode } = useDemoMode();

  // The alert is intentionally derived from demoMode instead of a second
  // transient flag. That keeps the notification visible across route changes
  // for the entire duration of the simulated emergency.
  if (!demoMode || typeof document === 'undefined') return null;

  const openFloodSimulation = () => {
    navigate('/map');
  };

  return createPortal(
    <button
      type="button"
      onClick={openFloodSimulation}
      className="fixed top-[88px] right-4 z-[20000] w-[min(390px,calc(100vw-2rem))] rounded-xl border-2 border-red-500/50 bg-white p-4 text-left shadow-2xl shadow-red-900/20 transition hover:-translate-y-0.5 hover:shadow-red-500/20 dark:bg-[#11181b]"
      aria-label="Open NAVIS flood simulation"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-lg dark:bg-red-500/15">🚨</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">Simulated Flood Alert</span>
          <span className="mt-1 block text-sm font-semibold text-gray-900 dark:text-white">NAVIS emergency simulation is active</span>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">Click to open the Flood Map and view the simulated response.</span>
        </span>
        <span className="mt-1 text-xs font-bold text-red-600 dark:text-red-400">OPEN →</span>
      </div>
    </button>,
    document.body
  );
}
