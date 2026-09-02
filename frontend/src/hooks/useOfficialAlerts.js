import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchIMDCapAlerts, getAlertSummary, clearAlertCache } from '../services/alertService';

const REFRESH_INTERVAL = 10 * 60 * 1000;
let sharedAlerts = null;
let sharedSummary = null;
let sharedTimestamp = null;
let sharedLoading = false;
let sharedError = false;
let sharedListeners = new Set();
let sharedTimer = null;
let fetchPromise = null;

function subscribe(listener) {
  sharedListeners.add(listener);
  return () => sharedListeners.delete(listener);
}

function notifyListeners() {
  sharedListeners.forEach(fn => fn());
}

async function doFetch() {
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    sharedLoading = true;
    sharedError = false;
    notifyListeners();

    try {
      const alerts = await fetchIMDCapAlerts();
      sharedAlerts = alerts;
      sharedSummary = getAlertSummary(alerts);
      sharedTimestamp = Date.now();
      sharedError = false;
    } catch (err) {
      sharedError = true;
    } finally {
      sharedLoading = false;
      fetchPromise = null;
      notifyListeners();
    }
  })();

  return fetchPromise;
}

export default function useOfficialAlerts() {
  const [, forceUpdate] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    const unsub = subscribe(() => {
      if (mountedRef.current) forceUpdate(c => c + 1);
    });
    return unsub;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    doFetch();

    if (!sharedTimer) {
      sharedTimer = setInterval(() => {
        clearAlertCache();
        doFetch();
      }, REFRESH_INTERVAL);
    }

    return () => {};
  }, []);

  const refresh = useCallback(() => {
    clearAlertCache();
    sharedAlerts = null;
    sharedSummary = null;
    doFetch();
  }, []);

  return {
    alerts: sharedAlerts,
    summary: sharedSummary,
    loading: sharedLoading,
    error: sharedError,
    refresh,
    lastUpdated: sharedTimestamp,
  };
}
