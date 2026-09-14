import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchCurrentWeather, getConditionSeverity, getWindDirectionLabel } from '../services/weatherService';

function SkeletonCard({ compact = false }) {
  return (
    <div className={`rounded-xl border ${compact ? 'navis-weather-compact' : 'p-4 md:p-5'}`} style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider">Live Weather</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Loading current weather...</p>
        </div>
        <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: 'var(--border-secondary)' }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-lg p-3 animate-pulse" style={{ background: 'var(--border-secondary)' }}>
            <div className="h-2 w-12 rounded mb-2" style={{ background: 'var(--border-primary)' }} />
            <div className="h-5 w-16 rounded" style={{ background: 'var(--border-primary)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorCard({ onRetry, compact = false }) {
  return (
    <div className={`rounded-xl border ${compact ? 'navis-weather-compact' : 'p-4 md:p-5'}`} style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(240,176,26,0.12)' }}>
            <svg className="w-4 h-4" fill="none" stroke="#F0B01A" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Current Conditions</p>
            <p className="text-xs" style={{ color: '#F0B01A' }}>Current weather data unavailable</p>
          </div>
        </div>
        <button onClick={onRetry} className="text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors" style={{ color: 'var(--text-tertiary)', background: 'var(--border-secondary)' }}>Retry</button>
      </div>
    </div>
  );
}

function WeatherCard({ weather, onRefresh, refreshing, compact = false }) {
  const severity = getConditionSeverity(weather.weatherCode);

  const bgMap = {
    danger: 'rgba(225,29,72,0.06)',
    warning: 'rgba(240,176,26,0.06)',
    info: 'rgba(59,130,246,0.06)',
    normal: 'transparent',
  };
  const borderMap = {
    danger: 'rgba(225,29,72,0.20)',
    warning: 'rgba(240,176,26,0.20)',
    info: 'rgba(59,130,246,0.20)',
    normal: 'var(--border-primary)',
  };
  const accentMap = {
    danger: '#E11D48',
    warning: '#F0B01A',
    info: '#3b82f6',
    normal: '#0221B7',
  };

  return (
    <div className={`rounded-xl border transition-shadow hover:shadow-sm ${compact ? 'navis-weather-compact' : 'p-4 md:p-5'}`} style={{ background: 'var(--bg-secondary)', borderColor: borderMap[severity], ...(severity !== 'normal' ? { background: bgMap[severity] } : {}) }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${compact ? 'navis-weather-compact-icon' : ''}`} style={{ background: `${accentMap[severity]}12` }}>
            {weather.conditionIcon}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Live Weather</p>
            <p className="text-xs font-semibold" style={{ color: accentMap[severity] }}>{weather.conditionLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wider">Live</span>
          <button onClick={onRefresh} disabled={refreshing} className="ml-1 p-1 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-white/5" style={{ color: 'var(--text-tertiary)' }}>
            <svg className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {/* Metrics grid */}
      <div className={`grid grid-cols-2 gap-2.5 ${compact ? 'navis-weather-compact-metrics' : ''}`}>
        <MetricBox label="Temperature" value={`${weather.temperature}°C`} />
        <MetricBox label="Rainfall" value={weather.rain > 0 ? `${weather.rain} mm` : '0 mm'} highlight={weather.rain > 10} />
        <MetricBox label="Humidity" value={`${weather.humidity}%`} highlight={weather.humidity > 85} />
        <MetricBox label="Wind" value={`${weather.windSpeed} km/h`} sub={getWindDirectionLabel(weather.windDirection)} />
      </div>

      {/* Updated */}
      <div className="mt-3 pt-2.5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          Updated: {weather.updatedAgo || 'Unknown'}
        </p>
        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          Kamrup Metropolitan
        </p>
      </div>
    </div>
  );
}

function MetricBox({ label, value, sub, highlight }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: highlight ? 'rgba(225,29,72,0.06)' : 'var(--bg-primary)', border: `1px solid ${highlight ? 'rgba(225,29,72,0.15)' : 'var(--border-secondary)'}` }}>
      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-base md:text-lg font-bold mt-0.5" style={{ color: highlight ? '#E11D48' : 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
    </div>
  );
}

const REFRESH_INTERVAL = 5 * 60 * 1000;

export default function CurrentConditions({ compact = false }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(false);

    try {
      const data = await fetchCurrentWeather();
      if (mountedRef.current) {
        setWeather(data);
        setError(false);
      }
    } catch (err) {
      if (err.name !== 'AbortError' && mountedRef.current) {
        setError(true);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();
    timerRef.current = setInterval(() => load(true), REFRESH_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [load]);

  if (loading) return <SkeletonCard compact={compact} />;
  if (error && !weather) return <ErrorCard onRetry={() => load(false)} compact={compact} />;
  if (!weather) return null;

  return <WeatherCard weather={weather} onRefresh={() => load(true)} refreshing={refreshing} compact={compact} />;
}
