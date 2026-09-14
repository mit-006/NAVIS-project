import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchFloodData } from '../services/floodDataService';

function SkeletonCard() {
  return (
    <div className="rounded-xl border p-4 md:p-5" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Real-Time Flood Updates</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Loading river data...</p>
        </div>
        <div className="w-8 h-8 rounded-lg animate-pulse" style={{ background: 'var(--border-secondary)' }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-lg p-3 animate-pulse" style={{ background: 'var(--border-secondary)' }}>
            <div className="h-2 w-16 rounded mb-2" style={{ background: 'var(--border-primary)' }} />
            <div className="h-5 w-20 rounded" style={{ background: 'var(--border-primary)' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorCard({ onRetry }) {
  return (
    <div className="rounded-xl border p-4 md:p-5" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(240,176,26,0.12)' }}>
            <svg className="w-4 h-4" fill="none" stroke="#F0B01A" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Real-Time Flood Updates</p>
            <p className="text-xs" style={{ color: '#F0B01A' }}>Live data unavailable</p>
          </div>
        </div>
        <button onClick={onRetry} className="text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors" style={{ color: 'var(--text-tertiary)', background: 'var(--border-secondary)' }}>Retry</button>
      </div>
      <p className="text-[10px] mt-2" style={{ color: 'var(--text-tertiary)' }}>Unable to fetch the latest official flood observations.</p>
    </div>
  );
}

function FloodCard({ data, onRefresh, refreshing }) {
  return (
    <div className="rounded-xl border p-4 md:p-5 transition-shadow hover:shadow-sm" style={{ background: data.status.bg, borderColor: data.status.border }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: `${data.status.color}12` }}>
            🌊
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Real-Time Flood Updates</p>
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{data.river} — {data.station}</p>
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

      {/* Status badge */}
      <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: `${data.status.color}18`, color: data.status.color, border: `1px solid ${data.status.color}30` }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.status.color }}></span>
        {data.status.level === 'Unknown' ? 'Status threshold unavailable' : `Status: ${data.status.level}`}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <MetricBox
          label="River Discharge"
          value={data.currentDischarge != null ? `${data.currentDischarge.toFixed(1)} m³/s` : 'N/A'}
          sub={data.historicalMean ? `14d avg: ${data.historicalMean.toFixed(1)} m³/s` : null}
        />
        <MetricBox
          label="Trend"
          value={`${data.trend.icon} ${data.trend.direction}`}
          valueColor={data.trend.color}
        />
        <MetricBox
          label="Rainfall (7d)"
          value={data.rainfall7d != null ? `${data.rainfall7d} mm` : 'N/A'}
          highlight={data.rainfall7d != null && data.rainfall7d > 50}
        />
        <MetricBox
          label="Latest Observation"
          value={data.latestDate || 'N/A'}
          small
        />
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2.5 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
        <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
          Source: {data.source}
        </p>
        <p className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
          Fetched: {data.lastUpdated}
        </p>
      </div>
    </div>
  );
}

function MetricBox({ label, value, sub, highlight, valueColor, small }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: highlight ? 'rgba(225,29,72,0.06)' : 'var(--bg-primary)', border: `1px solid ${highlight ? 'rgba(225,29,72,0.15)' : 'var(--border-secondary)'}` }}>
      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className={`${small ? 'text-xs' : 'text-base md:text-lg'} font-bold mt-0.5`} style={{ color: valueColor || (highlight ? '#E11D48' : 'var(--text-primary)'), wordBreak: 'break-word' }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>}
    </div>
  );
}

const REFRESH_INTERVAL = 15 * 60 * 1000;

export default function RealTimeFloodCard() {
  const [data, setData] = useState(null);
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
      const result = await fetchFloodData();
      if (mountedRef.current) {
        setData(result);
        setError(false);
      }
    } catch (err) {
      if (mountedRef.current) {
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

  if (loading) return <SkeletonCard />;
  if (error && !data) return <ErrorCard onRetry={() => load(false)} />;
  if (!data) return null;

  return <FloodCard data={data} onRefresh={() => load(true)} refreshing={refreshing} />;
}
