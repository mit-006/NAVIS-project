const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

const KAMRUP_METRO = {
  latitude: 26.15,
  longitude: 91.65,
};

const WMO_WEATHER_CODES = {
  0: { label: 'Clear Sky', icon: '☀️', group: 'clear' },
  1: { label: 'Mainly Clear', icon: '🌤️', group: 'clear' },
  2: { label: 'Partly Cloudy', icon: '⛅', group: 'cloudy' },
  3: { label: 'Overcast', icon: '☁️', group: 'cloudy' },
  45: { label: 'Fog', icon: '🌫️', group: 'fog' },
  48: { label: 'Rime Fog', icon: '🌫️', group: 'fog' },
  51: { label: 'Light Drizzle', icon: '🌦️', group: 'drizzle' },
  53: { label: 'Moderate Drizzle', icon: '🌦️', group: 'drizzle' },
  55: { label: 'Dense Drizzle', icon: '🌧️', group: 'drizzle' },
  56: { label: 'Freezing Drizzle', icon: '🌧️', group: 'drizzle' },
  57: { label: 'Heavy Freezing Drizzle', icon: '🌧️', group: 'drizzle' },
  61: { label: 'Slight Rain', icon: '🌧️', group: 'rain' },
  63: { label: 'Moderate Rain', icon: '🌧️', group: 'rain' },
  65: { label: 'Heavy Rain', icon: '🌧️', group: 'rain' },
  66: { label: 'Freezing Rain', icon: '🌧️', group: 'rain' },
  67: { label: 'Heavy Freezing Rain', icon: '🌧️', group: 'rain' },
  71: { label: 'Slight Snow', icon: '❄️', group: 'snow' },
  73: { label: 'Moderate Snow', icon: '❄️', group: 'snow' },
  75: { label: 'Heavy Snow', icon: '❄️', group: 'snow' },
  77: { label: 'Snow Grains', icon: '❄️', group: 'snow' },
  80: { label: 'Slight Showers', icon: '🌦️', group: 'showers' },
  81: { label: 'Moderate Showers', icon: '🌧️', group: 'showers' },
  82: { label: 'Violent Showers', icon: '🌧️', group: 'showers' },
  85: { label: 'Slight Snow Showers', icon: '🌨️', group: 'showers' },
  86: { label: 'Heavy Snow Showers', icon: '🌨️', group: 'showers' },
  95: { label: 'Thunderstorm', icon: '⛈️', group: 'thunderstorm' },
  96: { label: 'Thunderstorm with Hail', icon: '⛈️', group: 'thunderstorm' },
  99: { label: 'Thunderstorm with Heavy Hail', icon: '⛈️', group: 'thunderstorm' },
};

export function getWeatherCondition(code) {
  return WMO_WEATHER_CODES[code] || { label: 'Unknown', icon: '❓', group: 'unknown' };
}

export function getConditionSeverity(code) {
  const group = getWeatherCondition(code).group;
  if (group === 'thunderstorm') return 'danger';
  if (group === 'rain' || group === 'showers') return 'warning';
  if (group === 'snow') return 'info';
  return 'normal';
}

function minutesAgo(isoString) {
  if (!isoString) return null;
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins === 1) return '1 min ago';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return '1 hr ago';
  if (hrs < 24) return `${hrs} hrs ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export function getWindDirectionLabel(degrees) {
  if (degrees == null) return '—';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(degrees / 22.5) % 16];
}

function parseWeatherItem(item) {
  const condition = getWeatherCondition(item.weather_code);
  return {
    temperature: item.temperature_2m,
    humidity: item.relative_humidity_2m,
    precipitation: item.precipitation,
    rain: item.rain,
    weatherCode: item.weather_code,
    conditionLabel: condition.label,
    conditionIcon: condition.icon,
    conditionGroup: condition.group,
    windSpeed: item.wind_speed_10m,
    windDirection: item.wind_direction_10m,
    time: item.time,
  };
}

let singleController = null;

export async function fetchCurrentWeather() {
  if (singleController) singleController.abort();
  singleController = new AbortController();

  const params = new URLSearchParams({
    latitude: String(KAMRUP_METRO.latitude),
    longitude: String(KAMRUP_METRO.longitude),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'rain',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
    ].join(','),
    timezone: 'Asia/Kolkata',
  });

  const res = await fetch(`${OPEN_METEO_BASE}?${params}`, { signal: singleController.signal });
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data = await res.json();
  const c = data.current;
  const parsed = parseWeatherItem(c);

  return {
    ...parsed,
    updatedAt: new Date().toISOString(),
    updatedAgo: minutesAgo(c.time),
    timezone: data.timezone,
  };
}

const BATCH_CHUNK_SIZE = 50;

function buildBatchParams(locations) {
  const lats = locations.map(l => String(l.latitude)).join(',');
  const lngs = locations.map(l => String(l.longitude)).join(',');
  return new URLSearchParams({
    latitude: lats,
    longitude: lngs,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'precipitation',
      'rain',
      'weather_code',
      'wind_speed_10m',
      'wind_direction_10m',
    ].join(','),
    timezone: 'Asia/Kolkata',
  });
}

let batchAbortController = null;

export async function fetchBatchWeather(features) {
  if (batchAbortController) batchAbortController.abort();
  batchAbortController = new AbortController();

  const locations = features.map(f => {
    const geom = f.geometry;
    let coords = [];
    if (geom.type === 'Point') {
      coords = [geom.coordinates];
    } else if (geom.type === 'Polygon') {
      coords = geom.coordinates[0];
    } else if (geom.type === 'MultiPolygon') {
      coords = geom.coordinates[0][0];
    }
    if (coords.length === 0) return { id: f.properties.pc11_tv_id, latitude: 0, longitude: 0 };
    const avgLng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const avgLat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    return { id: f.properties.pc11_tv_id, latitude: avgLat, longitude: avgLng };
  });

  const now = new Date().toISOString();
  const weatherMap = {};

  for (let i = 0; i < locations.length; i += BATCH_CHUNK_SIZE) {
    if (batchAbortController.signal.aborted) throw new Error('Aborted');

    const chunk = locations.slice(i, i + BATCH_CHUNK_SIZE);
    const params = buildBatchParams(chunk);

    const res = await fetch(`${OPEN_METEO_BASE}?${params}`, {
      signal: batchAbortController.signal,
    });
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

    const data = await res.json();

    if (Array.isArray(data)) {
      data.forEach((item, idx) => {
        const loc = chunk[idx];
        if (loc && item && item.current) {
          const parsed = parseWeatherItem(item.current);
          weatherMap[loc.id] = {
            ...parsed,
            updatedAt: now,
            updatedAgo: minutesAgo(parsed.time),
            latitude: loc.latitude,
            longitude: loc.longitude,
          };
        }
      });
    } else if (data && data.current) {
      const parsed = parseWeatherItem(data.current);
      weatherMap[chunk[0].id] = {
        ...parsed,
        updatedAt: now,
        updatedAgo: minutesAgo(parsed.time),
        latitude: chunk[0].latitude,
        longitude: chunk[0].longitude,
      };
    }
  }

  return weatherMap;
}

export function getWeatherDecisionSupport(weather, priority) {
  if (!weather || !weather.weatherCode) return null;

  const severity = getConditionSeverity(weather.weatherCode);
  const condition = weather.conditionLabel;
  const isHeavyRain = weather.weatherCode >= 63 && weather.weatherCode <= 67;
  const isThunderstorm = weather.weatherCode >= 95 && weather.weatherCode <= 99;
  const isModerateRain = weather.weatherCode >= 61 && weather.weatherCode <= 63;
  const isShowers = weather.weatherCode >= 80 && weather.weatherCode <= 82;
  const isSnow = weather.weatherCode >= 71 && weather.weatherCode <= 77;
  const highHumidity = weather.humidity > 85;
  const heavyRainfall = weather.rain > 10;

  let level = 'normal';
  let text = 'Current conditions are within normal range.';
  let icon = 'ℹ️';

  if (isThunderstorm || (isHeavyRain && (priority === 'Critical' || priority === 'High'))) {
    level = 'danger';
    text = 'Active severe weather combined with high historical flood exposure. Increased monitoring recommended.';
    icon = '🔴';
  } else if (isHeavyRain || heavyRainfall) {
    level = 'warning';
    text = 'Heavy rainfall currently detected. Current conditions may increase flood risk in exposed areas.';
    icon = '🟠';
  } else if (isModerateRain || isShowers) {
    level = 'caution';
    text = 'Rainfall detected. Monitor conditions, particularly for habitations with historical flood exposure.';
    icon = '🟡';
  } else if (isSnow) {
    level = 'info';
    text = 'Snow detected. Road access and evacuation routes may be affected.';
    icon = '🔵';
  } else if (highHumidity && (priority === 'Critical' || priority === 'High')) {
    level = 'watch';
    text = 'High humidity detected in a high-risk area. Conditions may precede rainfall events.';
    icon = '👁️';
  } else {
    level = 'normal';
    text = 'Current conditions are within normal range. No immediate weather-related concerns.';
    icon = '✅';
  }

  return { level, text, icon, severity };
}
