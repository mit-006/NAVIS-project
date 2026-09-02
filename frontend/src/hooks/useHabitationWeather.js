import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchBatchWeather } from '../services/weatherService';

const REFRESH_INTERVAL = 5 * 60 * 1000;
let sharedWeatherCache = null;
let sharedTimer = null;
let sharedListeners = new Set();
let sharedLoading = false;
let sharedError = false;

function subscribe(listener) {
  sharedListeners.add(listener);
  return () => sharedListeners.delete(listener);
}

function notifyListeners() {
  sharedListeners.forEach(fn => fn());
}

export default function useHabitationWeather(features) {
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
    if (!features || features.length === 0) return;

    const load = async () => {
      if (sharedLoading) return;
      sharedLoading = true;
      sharedError = false;

      try {
        const result = await fetchBatchWeather(features);
        sharedWeatherCache = result;
        sharedError = false;
      } catch (err) {
        if (err.name !== 'AbortError' && err.message !== 'Aborted') {
          sharedError = true;
        }
      } finally {
        sharedLoading = false;
        notifyListeners();
      }
    };

    if (!sharedWeatherCache) {
      load();
    } else {
      notifyListeners();
    }

    if (!sharedTimer) {
      sharedTimer = setInterval(() => {
        if (features.length > 0) {
          sharedLoading = false;
          load();
        }
      }, REFRESH_INTERVAL);
    }

    return () => {};
  }, [features]);

  const refresh = useCallback(() => {
    if (!features || features.length === 0) return;
    sharedLoading = false;
    sharedWeatherCache = null;

    const load = async () => {
      sharedLoading = true;
      sharedError = false;
      try {
        const result = await fetchBatchWeather(features);
        sharedWeatherCache = result;
        sharedError = false;
      } catch (err) {
        if (err.name !== 'AbortError' && err.message !== 'Aborted') {
          sharedError = true;
        }
      } finally {
        sharedLoading = false;
        notifyListeners();
      }
    };
    load();
  }, [features]);

  const getWeatherForHabitation = useCallback((feature) => {
    if (!sharedWeatherCache || !feature) return null;
    const id = feature.properties?.pc11_tv_id;
    return sharedWeatherCache[id] || null;
  }, []);

  return {
    weatherMap: sharedWeatherCache,
    loading: sharedLoading,
    error: sharedError,
    getWeatherForHabitation,
    refresh,
  };
}
