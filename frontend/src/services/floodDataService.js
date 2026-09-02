const FLOOD_API_BASE = 'https://flood-api.open-meteo.com/v1/flood';
const WEATHER_API_BASE = 'https://api.open-meteo.com/v1/forecast';

const KAMRUP_METRO = {
  latitude: 26.14,
  longitude: 91.74,
};

const STATION_INFO = {
  river: 'Brahmaputra',
  station: 'Guwahati (Kamrup Metropolitan)',
  region: 'Assam, India',
  source: 'Open-Meteo GloFAS v4 (ECMWF)',
};

function computeTrend(discharges) {
  if (!discharges || discharges.length < 2) return { direction: 'Stable', icon: '→', color: '#a1a1aa' };
  const recent = discharges[discharges.length - 1];
  const previous = discharges[discharges.length - 2];
  if (recent == null || previous == null) return { direction: 'Stable', icon: '→', color: '#a1a1aa' };
  const diff = recent - previous;
  const pct = previous > 0 ? (diff / previous) * 100 : 0;
  if (pct > 5) return { direction: 'Rising', icon: '↑', color: '#E11D48' };
  if (pct < -5) return { direction: 'Falling', icon: '↓', color: '#13E83A' };
  return { direction: 'Stable', icon: '→', color: '#F0B01A' };
}

function getStatus(discharge, historicalMean) {
  if (!discharge || !historicalMean || historicalMean <= 0) {
    return { level: 'Unknown', color: '#a1a1aa', bg: 'rgba(161,161,170,0.08)', border: 'rgba(161,161,170,0.2)' };
  }
  const ratio = discharge / historicalMean;
  if (ratio >= 2.0) return { level: 'Danger', color: '#E11D48', bg: 'rgba(225,29,72,0.08)', border: 'rgba(225,29,72,0.2)' };
  if (ratio >= 1.5) return { level: 'Alert', color: '#F0B01A', bg: 'rgba(240,176,26,0.08)', border: 'rgba(240,176,26,0.2)' };
  if (ratio >= 1.2) return { level: 'Watch', color: '#F0B01A', bg: 'rgba(240,176,26,0.06)', border: 'rgba(240,176,26,0.15)' };
  return { level: 'Normal', color: '#13E83A', bg: 'rgba(19,232,58,0.06)', border: 'rgba(19,232,58,0.15)' };
}

function formatTimestamp(isoString) {
  if (!isoString) return 'Unknown';
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

export async function fetchFloodData() {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 30);

  const formatDate = (d) => d.toISOString().split('T')[0];

  const [floodRes, weatherRes] = await Promise.all([
    fetch(
      `${FLOOD_API_BASE}?latitude=${KAMRUP_METRO.latitude}&longitude=${KAMRUP_METRO.longitude}` +
      `&daily=river_discharge,river_discharge_max,river_discharge_min` +
      `&start_date=${formatDate(startDate)}&end_date=${formatDate(today)}` +
      `&timezone=Asia/Kolkata`
    ),
    fetch(
      `${WEATHER_API_BASE}?latitude=${KAMRUP_METRO.latitude}&longitude=${KAMRUP_METRO.longitude}` +
      `&daily=rain_sum&past_days=7&forecast_days=0&timezone=Asia/Kolkata`
    ),
  ]);

  if (!floodRes.ok) throw new Error('Flood API request failed');
  const floodData = await floodRes.json();

  let rainfall7d = null;
  if (weatherRes.ok) {
    const weatherData = await weatherRes.json();
    const rainValues = weatherData.daily?.rain_sum;
    if (rainValues && rainValues.length > 0) {
      rainfall7d = rainValues.reduce((sum, v) => sum + (v || 0), 0);
    }
  }

  const daily = floodData.daily;
  const discharges = daily?.river_discharge || [];
  const dates = daily?.time || [];
  const latestIdx = discharges.length - 1;
  const latestDischarge = discharges[latestIdx] ?? null;
  const latestDate = dates[latestIdx] ?? null;

  const recentDischarges = discharges.slice(-14).filter(v => v != null);
  const historicalMean = recentDischarges.length > 0
    ? recentDischarges.reduce((s, v) => s + v, 0) / recentDischarges.length
    : null;

  const trend = computeTrend(discharges.filter(v => v != null));
  const status = getStatus(latestDischarge, historicalMean);

  return {
    ...STATION_INFO,
    currentDischarge: latestDischarge,
    latestDate,
    trend,
    status,
    rainfall7d: rainfall7d != null ? Math.round(rainfall7d * 10) / 10 : null,
    historicalMean,
    lastUpdated: formatTimestamp(new Date().toISOString()),
    recentTrend: discharges.slice(-7).map((v, i) => ({
      date: dates[dates.length - 7 + i],
      value: v,
    })),
  };
}
