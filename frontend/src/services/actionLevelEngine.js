import { getConditionSeverity } from './weatherService';

const ACTION_LEVELS = {
  IMMEDIATE: {
    level: 'IMMEDIATE ATTENTION',
    code: 'immediate',
    color: '#E11D48',
    bg: 'rgba(225,29,72,0.08)',
    border: 'rgba(225,29,72,0.25)',
    icon: '🔴',
    description: 'Critical conditions — take precaution. Flooding not confirmed.',
  },
  PREPARE: {
    level: 'PREPARE',
    code: 'prepare',
    color: '#F0B01A',
    bg: 'rgba(240,176,26,0.08)',
    border: 'rgba(240,176,26,0.25)',
    icon: '🟠',
    description: 'Conditions may worsen. Review evacuation plan and secure essential items.',
  },
  MONITOR: {
    level: 'MONITOR',
    code: 'monitor',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.25)',
    icon: '🔵',
    description: 'Weather conditions warrant attention. Stay informed and monitor updates.',
  },
  NORMAL: {
    level: 'NORMAL',
    code: 'normal',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.25)',
    icon: '🟢',
    description: 'No immediate weather-related concerns detected.',
  },
};

function getWeatherScore(weather) {
  if (!weather || !weather.weatherCode) return 0;

  const code = weather.weatherCode;
  const isHeavyRain = code >= 63 && code <= 67;
  const isThunderstorm = code >= 95 && code <= 99;
  const isModerateRain = code >= 61 && code <= 63;
  const heavyRainfall = weather.rain > 10;
  const extremeRainfall = weather.rain > 30;

  let score = 0;

  if (isThunderstorm) score += 40;
  else if (extremeRainfall) score += 35;
  else if (isHeavyRain) score += 30;
  else if (heavyRainfall) score += 20;
  else if (isModerateRain) score += 10;

  if (weather.humidity > 90) score += 5;
  if (weather.windSpeed > 40) score += 10;
  if (weather.windSpeed > 60) score += 15;

  return Math.min(score, 100);
}

function getWeatherLabel(weather) {
  if (!weather || !weather.weatherCode) return 'Unavailable';
  return weather.conditionLabel || 'Unknown';
}

function getAlertScore(alertSummary) {
  if (!alertSummary || !alertSummary.hasActiveAlerts) return 0;

  const sev = alertSummary.maxSeverity;
  if (!sev) return 0;

  let score = 0;

  switch (sev.level) {
    case 5: score += 40; break;
    case 4: score += 30; break;
    case 3: score += 20; break;
    case 2: score += 10; break;
    default: score += 5;
  }

  switch ((sev.urgency || '').toLowerCase()) {
    case 'immediate': score += 15; break;
    case 'expected': score += 10; break;
    case 'future': score += 5; break;
  }

  if (alertSummary.count > 1) score += 5;

  return Math.min(score, 100);
}

function getAlertLabel(alertSummary) {
  if (!alertSummary || !alertSummary.hasActiveAlerts) return 'None';
  const sev = alertSummary.maxSeverity;
  if (!sev) return 'Unknown';
  return `${sev.label} Alert`;
}

function getPriorityScore(priorityLevel) {
  switch (priorityLevel) {
    case 'Critical': return 40;
    case 'High': return 30;
    case 'Medium': return 15;
    case 'Low': return 5;
    default: return 0;
  }
}

function getHistoricalRiskScore(feature) {
  const p = feature.properties;
  const yearsExposed = [1998, 1999, 2004, 2012, 2013]
    .filter(y => (p[`flood_pct_${y}`] || 0) > 0).length;
  const maxExposure = p.max_flood_exposure_pct || 0;

  let score = 0;
  score += (yearsExposed / 5) * 30;
  if (maxExposure > 75) score += 20;
  else if (maxExposure > 50) score += 15;
  else if (maxExposure > 25) score += 10;
  else if (maxExposure > 0) score += 5;

  return Math.min(score, 50);
}

function getHistoricalRiskLabel(feature) {
  const p = feature.properties;
  const yearsExposed = [1998, 1999, 2004, 2012, 2013]
    .filter(y => (p[`flood_pct_${y}`] || 0) > 0).length;
  const maxExp = p.max_flood_exposure_pct || 0;
  if (yearsExposed >= 4 && maxExp > 50) return 'Very High';
  if (yearsExposed >= 3) return 'High';
  if (yearsExposed >= 1) return 'Moderate';
  return 'Low';
}

export function computeActionLevel(feature, weather, alertSummary, priorityLevel) {
  const weatherScore = getWeatherScore(weather);
  const alertScore = getAlertScore(alertSummary);
  const priorityScore = getPriorityScore(priorityLevel);
  const historicalScore = getHistoricalRiskScore(feature);

  const totalScore = weatherScore + alertScore + priorityScore + historicalScore;

  let actionLevel;
  if (totalScore >= 70) {
    actionLevel = ACTION_LEVELS.IMMEDIATE;
  } else if (totalScore >= 45) {
    actionLevel = ACTION_LEVELS.PREPARE;
  } else if (totalScore >= 20) {
    actionLevel = ACTION_LEVELS.MONITOR;
  } else {
    actionLevel = ACTION_LEVELS.NORMAL;
  }

  const factorDetails = [
    {
      name: 'Current Weather',
      value: getWeatherLabel(weather),
      score: weatherScore,
      max: 60,
    },
    {
      name: 'Official Alert',
      value: getAlertLabel(alertSummary),
      score: alertScore,
      max: 55,
    },
    {
      name: 'Historical Risk',
      value: getHistoricalRiskLabel(feature),
      score: historicalScore,
      max: 50,
    },
    {
      name: 'Priority Level',
      value: priorityLevel || 'Unknown',
      score: priorityScore,
      max: 40,
    },
    {
      name: 'Current Flooding',
      value: 'Not Confirmed',
      score: 0,
      max: 0,
    },
  ];

  const explanation = buildExplanation(actionLevel, weatherScore, alertScore, priorityLevel, alertSummary, weather, feature);

  return {
    ...actionLevel,
    totalScore,
    factors: factorDetails,
    explanation,
    weatherScore,
    alertScore,
    priorityScore,
    historicalScore,
    floodConfirmed: false,
    timestamp: new Date().toISOString(),
  };
}

function buildExplanation(actionLevel, weatherScore, alertScore, priorityLevel, alertSummary, weather, feature) {
  const parts = [];

  if (actionLevel.code === 'immediate') {
    parts.push('Critical conditions require immediate attention and preparedness.');
  } else if (actionLevel.code === 'prepare') {
    parts.push('Conditions suggest preparation may be warranted.');
  } else if (actionLevel.code === 'monitor') {
    parts.push('Current conditions warrant monitoring.');
  } else {
    parts.push('No immediate concerns detected.');
  }

  if (weatherScore > 20) {
    const severity = weather ? getConditionSeverity(weather.weatherCode) : 'normal';
    if (severity === 'danger') {
      parts.push('Active severe weather (thunderstorm/heavy rainfall) is currently detected in the area.');
    } else if (severity === 'warning') {
      parts.push('Significant rainfall is currently occurring in the area.');
    }
  }

  if (alertScore > 0 && alertSummary) {
    const sev = alertSummary.maxSeverity;
    parts.push(`IMD has issued a ${sev.label} severity alert${alertSummary.events.length > 0 ? ` for: ${alertSummary.events.join(', ')}` : ''}.`);
  }

  if (priorityLevel === 'Critical' || priorityLevel === 'High') {
    parts.push(`This habitation has ${priorityLevel} historical flood priority based on 15-year exposure analysis.`);
  }

  parts.push('Current Flooding: Not Confirmed — no reliable flood observation or flash-flood confirmation is available.');
  parts.push('Action Level is computed from weather + alerts + historical data. It is an analytical indicator, NOT an official directive and NOT proof of current flooding.');

  return parts.join(' ');
}

export { ACTION_LEVELS };
