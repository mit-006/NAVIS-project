import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import useDemoAlarm from '../hooks/useDemoAlarm';
import {
  SCENARIO_VILLAGES,
  SCENARIO_SITES,
  SCENARIO_ROUTES,
  SCENARIO_STEPS,
  SCENARIO_COMPLETE,
} from './demoEmergencyScenario';

const DemoModeContext = createContext(null);

export function DemoModeProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [activeVillageIndex, setActiveVillageIndex] = useState(-1);
  const [activeSiteIndex, setActiveSiteIndex] = useState(-1);
  const [showRoute, setShowRoute] = useState(false);
  const [showFinalPlan, setShowFinalPlan] = useState(false);
  const [alarmMuted, setAlarmMuted] = useState(false);
  const timerRef = useRef(null);
  const stepTimerRef = useRef(null);

  const { resume } = useDemoAlarm(demoMode, alarmMuted);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, []);

  const enterDemoMode = useCallback(() => {
    setDemoMode(true);
    setSimulating(false);
    setCurrentStep(-1);
    setCompletedSteps([]);
    setActiveVillageIndex(-1);
    setActiveSiteIndex(-1);
    setShowRoute(false);
    setShowFinalPlan(false);
    setAlarmMuted(false);
    setTimeout(() => resume(), 100);
  }, [resume]);

  const exitDemoMode = useCallback(() => {
    setDemoMode(false);
    setSimulating(false);
    setCurrentStep(-1);
    setCompletedSteps([]);
    setActiveVillageIndex(-1);
    setActiveSiteIndex(-1);
    setShowRoute(false);
    setShowFinalPlan(false);
    setAlarmMuted(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    timerRef.current = null;
    stepTimerRef.current = null;
  }, []);

  const startSimulation = useCallback(() => {
    setSimulating(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    setActiveVillageIndex(-1);
    setActiveSiteIndex(-1);
    setShowRoute(false);
    setShowFinalPlan(false);

    let stepIdx = 0;

    const runStep = () => {
      if (stepIdx >= SCENARIO_STEPS.length) {
        setCurrentStep(-1);

        let villageIdx = 0;
        const showVillage = () => {
          if (villageIdx >= SCENARIO_VILLAGES.length) {
            setShowRoute(true);
            setTimeout(() => {
              setSimulating(false);
              setShowFinalPlan(true);
            }, 1000);
            return;
          }
          setActiveVillageIndex(villageIdx);

          const route = SCENARIO_ROUTES.find(r => r.villageId === SCENARIO_VILLAGES[villageIdx].id);
          if (route) {
            const siteIdx = SCENARIO_SITES.findIndex(s => s.id === route.siteId);
            setTimeout(() => setActiveSiteIndex(siteIdx), 600);
          }

          villageIdx++;
          stepTimerRef.current = setTimeout(showVillage, 2000);
        };

        stepTimerRef.current = setTimeout(showVillage, 500);
        return;
      }

      setCurrentStep(stepIdx);
      setCompletedSteps(prev => [...prev, stepIdx]);
      stepIdx++;
      timerRef.current = setTimeout(runStep, SCENARIO_STEPS[stepIdx - 1].duration);
    };

    timerRef.current = setTimeout(runStep, SCENARIO_STEPS[0].duration);
  }, []);

  const stopSimulation = useCallback(() => {
    setSimulating(false);
    setCurrentStep(-1);
    setCompletedSteps([]);
    setActiveVillageIndex(-1);
    setActiveSiteIndex(-1);
    setShowRoute(false);
    setShowFinalPlan(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    timerRef.current = null;
    stepTimerRef.current = null;
  }, []);

  const toggleAlarmMute = useCallback(() => {
    setAlarmMuted(prev => !prev);
  }, []);

  const value = {
    demoMode,
    simulating,
    currentStep,
    completedSteps,
    activeVillageIndex,
    activeSiteIndex,
    showRoute,
    showFinalPlan,
    alarmMuted,
    enterDemoMode,
    exitDemoMode,
    startSimulation,
    stopSimulation,
    toggleAlarmMute,
    villages: SCENARIO_VILLAGES,
    sites: SCENARIO_SITES,
    routes: SCENARIO_ROUTES,
    steps: SCENARIO_STEPS,
    complete: SCENARIO_COMPLETE,
  };

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error('useDemoMode must be used within DemoModeProvider');
  return ctx;
}
