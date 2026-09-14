let cachedData = null;

export const FLOOD_YEARS = [1998, 1999, 2004, 2012, 2013];

export const EXPOSURE_CATEGORIES = [
  { label: 'No Exposure', min: 0, max: 0, color: '#D7DCE1' },
  { label: 'Low Exposure', min: 0.01, max: 25, color: '#6FA8BA' },
  { label: 'Moderate Exposure', min: 25.01, max: 50, color: '#D9A339' },
  { label: 'High Exposure', min: 50.01, max: 75, color: '#C4632B' },
  { label: 'Very High Exposure', min: 75.01, max: 100, color: '#A62B26' },
];

export function getExposureCategory(pct) {
  if (pct === 0) return EXPOSURE_CATEGORIES[0];
  if (pct <= 25) return EXPOSURE_CATEGORIES[1];
  if (pct <= 50) return EXPOSURE_CATEGORIES[2];
  if (pct <= 75) return EXPOSURE_CATEGORIES[3];
  return EXPOSURE_CATEGORIES[4];
}

export function getExposureColor(pct) {
  return getExposureCategory(pct).color;
}

export async function loadFloodData() {
  if (cachedData) return cachedData;
  const res = await fetch('/data/kamrup_metro_flood_exposure.geojson');
  const geojson = await res.json();
  cachedData = geojson;
  return geojson;
}

export function computeYearStats(features, year) {
  const pctKey = `flood_pct_${year}`;
  const popKey = `exposed_pop_${year}`;
  const areaKey = `flood_area_${year}`;

  let exposedCount = 0;
  let totalExposurePct = 0;
  let maxExposure = 0;
  let totalExposedPop = 0;
  let maxExposureName = '';

  features.forEach((f) => {
    const p = f.properties;
    const pct = p[pctKey] || 0;
    const pop = p[popKey] || 0;
    if (pct > 0) {
      exposedCount++;
      totalExposurePct += pct;
      totalExposedPop += pop;
    }
    if (pct > maxExposure) {
      maxExposure = pct;
      maxExposureName = p.Name;
    }
  });

  return {
    totalHabitations: features.length,
    exposedHabitations: exposedCount,
    nonExposedHabitations: features.length - exposedCount,
    avgExposure: exposedCount > 0 ? totalExposurePct / exposedCount : 0,
    maxExposure,
    maxExposureName,
    totalExposedPop,
    exposureRate: (exposedCount / features.length) * 100,
  };
}

export function computeAllYearStats(features) {
  return FLOOD_YEARS.reduce((acc, year) => {
    acc[year] = computeYearStats(features, year);
    return acc;
  }, {});
}

export function getTopExposed(features, year, limit = 20) {
  const pctKey = `flood_pct_${year}`;
  const popKey = `exposed_pop_${year}`;
  return features
    .map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        _currentPct: f.properties[pctKey] || 0,
        _currentPop: f.properties[popKey] || 0,
      },
    }))
    .filter((f) => f.properties._currentPct > 0)
    .sort((a, b) => b.properties._currentPct - a.properties._currentPct)
    .slice(0, limit);
}

export const PRIORITY_LEVELS = [
  { level: 'Critical', color: '#A62B26', bg: '#FBEDEC', border: '#E3B7B4', minScore: 70 },
  { level: 'High', color: '#C4632B', bg: '#FCF1E9', border: '#E9C4A9', minScore: 50 },
  { level: 'Medium', color: '#B4841F', bg: '#FBF3E1', border: '#E3CA9C', minScore: 30 },
  { level: 'Low', color: '#2F7A63', bg: '#EAF4F1', border: '#A9CFC4', minScore: 0 },
];

export function getPriorityLevel(score) {
  for (const lvl of PRIORITY_LEVELS) {
    if (score >= lvl.minScore) return lvl;
  }
  return PRIORITY_LEVELS[PRIORITY_LEVELS.length - 1];
}

export function computeHabitationPriority(feature) {
  const p = feature.properties;
  const maxExposure = p.max_flood_exposure_pct || 0;
  const frequency = p.flood_frequency || 0;
  const yearsExposed = p.flood_years_exposed || 0;
  const totPop = p.TOT_P || 0;

  let maxTotalPop = 0;
  let maxExposedPop = 0;
  FLOOD_YEARS.forEach((year) => {
    const ep = p[`exposed_pop_${year}`] || 0;
    if (ep > maxExposedPop) maxExposedPop = ep;
    if (totPop > maxTotalPop) maxTotalPop = totPop;
  });

  const normMaxExposure = maxExposure;
  const normFrequency = (frequency * 100);
  const normPop = maxTotalPop > 0 ? (maxExposedPop / maxTotalPop) * 100 : 0;

  const score = (normMaxExposure * 0.4) + (normFrequency * 0.3) + (normPop * 0.3);
  const level = getPriorityLevel(score);

  return {
    score: Math.round(score * 10) / 10,
    level: level.level,
    color: level.color,
    bg: level.bg,
    border: level.border,
    maxExposure,
    frequency,
    yearsExposed,
    maxExposedPop,
    totPop,
  };
}

export function computeScenarioScore(scenario) {
  const { maxExposure, frequency, totPop, maxExposedPop } = scenario;
  const normMaxExposure = maxExposure;
  const normFrequency = frequency * 100;
  const normPop = totPop > 0 ? (maxExposedPop / totPop) * 100 : 0;
  const score = (normMaxExposure * 0.4) + (normFrequency * 0.3) + (normPop * 0.3);
  const level = getPriorityLevel(score);
  return {
    score: Math.round(score * 10) / 10,
    level: level.level,
    color: level.color,
    bg: level.bg,
    border: level.border,
  };
}

export function getWhatIfExplanation(current, scenario, currentPriority, scenarioPriority) {
  const diff = scenario.score - current.score;
  const priorityChanged = currentPriority.level !== scenarioPriority.level;

  let impact = '';
  if (diff > 0) {
    impact = `+${diff.toFixed(1)} points`;
  } else if (diff < 0) {
    impact = `${diff.toFixed(1)} points`;
  } else {
    impact = 'No change';
  }

  let explanation = '';
  if (priorityChanged) {
    explanation = `This scenario moves the habitation from ${currentPriority.level} to ${scenarioPriority.level} priority.`;
  } else if (diff > 5) {
    explanation = 'Under this scenario, the increased exposure significantly raises the hypothetical risk score.';
  } else if (diff > 0) {
    explanation = 'Under this scenario, the modified conditions slightly increase the hypothetical risk score.';
  } else if (diff < -5) {
    explanation = 'Under this scenario, the reduced exposure significantly lowers the hypothetical risk score.';
  } else if (diff < 0) {
    explanation = 'Under this scenario, the modified conditions slightly reduce the hypothetical risk score.';
  } else {
    explanation = 'The simulated change does not alter the current priority classification.';
  }

  return { impact, explanation, priorityChanged, diff };
}

export function compareHabitations(featureA, featureB) {
  const pA = featureA.properties;
  const pB = featureB.properties;
  const priorityA = computeHabitationPriority(featureA);
  const priorityB = computeHabitationPriority(featureB);

  const yearsA = FLOOD_YEARS.filter(y => (pA[`flood_pct_${y}`] || 0) > 0).length;
  const yearsB = FLOOD_YEARS.filter(y => (pB[`flood_pct_${y}`] || 0) > 0).length;

  const exposureHistory = FLOOD_YEARS.map(year => ({
    year,
    pctA: pA[`flood_pct_${year}`] || 0,
    pctB: pB[`flood_pct_${year}`] || 0,
    exposedA: (pA[`flood_pct_${year}`] || 0) > 0,
    exposedB: (pB[`flood_pct_${year}`] || 0) > 0,
  }));

  const popA = pA.TOT_P || 0;
  const popB = pB.TOT_P || 0;
  const hhA = pA.No_HH || 0;
  const hhB = pB.No_HH || 0;
  const childA = pA.P_06 || 0;
  const childB = pB.P_06 || 0;
  const scA = pA.P_SC || 0;
  const scB = pB.P_SC || 0;
  const stA = pA.P_ST || 0;
  const stB = pB.P_ST || 0;

  const scoreDiff = priorityA.score - priorityB.score;
  const higherRisk = scoreDiff > 0 ? 'A' : scoreDiff < 0 ? 'B' : 'tie';

  let interpretation = '';
  if (Math.abs(scoreDiff) < 3) {
    interpretation = `Both habitations have similar priority levels and comparable historical exposure.`;
  } else if (higherRisk === 'A') {
    interpretation = `${pA.Name} has a higher priority score (${priorityA.score} vs ${priorityB.score}) and greater historical flood exposure than ${pB.Name}.`;
  } else {
    interpretation = `${pB.Name} has a higher priority score (${priorityB.score} vs ${priorityA.score}) and greater historical flood exposure than ${pA.Name}.`;
  }

  return {
    nameA: pA.Name,
    nameB: pB.Name,
    priorityA,
    priorityB,
    yearsExposedA: yearsA,
    yearsExposedB: yearsB,
    exposureHistory,
    populationA: popA,
    populationB: popB,
    householdsA: hhA,
    householdsB: hhB,
    childrenA: childA,
    childrenB: childB,
    scPopA: scA,
    scPopB: scB,
    stPopA: stA,
    stPopB: stB,
    scoreDiff: Math.abs(scoreDiff),
    higherRisk,
    interpretation,
    maxExposureA: pA.max_flood_exposure_pct || 0,
    maxExposureB: pB.max_flood_exposure_pct || 0,
  };
}

export function computeAllPriorities(features) {
  return features.map((f) => ({
    feature: f,
    priority: computeHabitationPriority(f),
  })).sort((a, b) => b.priority.score - a.priority.score);
}

export function getPriorityDistribution(features) {
  const dist = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  features.forEach((f) => {
    const p = computeHabitationPriority(f);
    dist[p.level]++;
  });
  return dist;
}

export function getFrequencyDistribution(features) {
  const dist = {};
  FLOOD_YEARS.forEach((y) => { dist[y] = 0; });
  features.forEach((f) => {
    const freq = f.properties.flood_years_exposed || 0;
    if (dist[freq] !== undefined) dist[freq]++;
  });
  return Object.entries(dist).map(([years, count]) => ({
    years: `${years}/5`,
    count,
  }));
}

export function getYearWiseExposedCounts(features) {
  return FLOOD_YEARS.map((year) => {
    const pctKey = `flood_pct_${year}`;
    const count = features.filter((f) => (f.properties[pctKey] || 0) > 0).length;
    return { year: String(year), count };
  });
}

export function getPopulationExposureBuckets(features) {
  const buckets = [
    { label: '0', min: 0, max: 0, count: 0, pop: 0 },
    { label: '1-500', min: 1, max: 500, count: 0, pop: 0 },
    { label: '501-1000', min: 501, max: 1000, count: 0, pop: 0 },
    { label: '1001-2000', min: 1001, max: 2000, count: 0, pop: 0 },
    { label: '2000+', min: 2001, max: Infinity, count: 0, pop: 0 },
  ];
  features.forEach((f) => {
    const totPop = f.properties.TOT_P || 0;
    for (const b of buckets) {
      if (totPop >= b.min && totPop <= b.max) {
        b.count++;
        b.pop += totPop;
        break;
      }
    }
  });
  return buckets;
}

export function computeInsights(features, allStats) {
  if (!features.length || !allStats) return [];
  const insights = [];

  let exposedCount = 0;
  features.forEach((f) => {
    const freq = f.properties.flood_years_exposed || 0;
    if (freq > 0) exposedCount++;
  });
  insights.push({
    icon: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6',
    text: `${exposedCount} of ${features.length} habitations have historical flood exposure across 5 analysed years.`,
    color: 'blue',
  });

  let multiYear = 0;
  let highExposure = 0;
  let highPopExposure = 0;
  features.forEach((f) => {
    const freq = f.properties.flood_years_exposed || 0;
    const maxExp = f.properties.max_flood_exposure_pct || 0;
    const maxPop = f.properties.exposed_pop_1998 || 0;
    if (freq >= 2) multiYear++;
    if (maxExp >= 50) highExposure++;
    if (maxPop >= 500) highPopExposure++;
  });

  if (multiYear > 0) {
    insights.push({
      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      text: `${multiYear} habitations experience exposure across 2 or more historical flood years, indicating repeated vulnerability.`,
      color: 'amber',
    });
  }

  if (highExposure > 0) {
    insights.push({
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z',
      text: `${highExposure} habitations have maximum historical exposure exceeding 50%, indicating severe inundation in peak events.`,
      color: 'red',
    });
  }

  insights.push({
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    text: `Habitation priority increases with repeated exposure, higher maximum exposure, and larger exposed population.`,
    color: 'green',
  });

  return insights;
}

export function getRiskExplanation(feature) {
  const p = feature.properties;
  const priority = computeHabitationPriority(feature);

  const yearsExposed = FLOOD_YEARS.filter(y => (p[`flood_pct_${y}`] || 0) > 0);
  const yearsExposedCount = yearsExposed.length;

  const exposureHistory = FLOOD_YEARS.map(year => ({
    year,
    pct: p[`flood_pct_${year}`] || 0,
    pop: p[`exposed_pop_${year}`] || 0,
    exposed: (p[`flood_pct_${year}`] || 0) > 0,
  }));

  const maxExposure = p.max_flood_exposure_pct || 0;
  const frequency = p.flood_frequency || 0;
  const totPop = p.TOT_P || 0;
  const maxExposedPop = priority.maxExposedPop;

  const normMaxExposure = maxExposure;
  const normFrequency = frequency * 100;
  const normPop = totPop > 0 ? (maxExposedPop / totPop) * 100 : 0;

  const factors = [
    {
      name: 'Max Flood Exposure',
      value: maxExposure,
      display: `${maxExposure.toFixed(1)}%`,
      normValue: normMaxExposure,
      weight: 0.4,
      description: maxExposure >= 75 ? 'Severe inundation recorded in peak flood events.'
        : maxExposure >= 50 ? 'Significant area coverage during historical floods.'
        : maxExposure >= 25 ? 'Moderate inundation in at least one flood year.'
        : maxExposure > 0 ? 'Limited flood area overlap detected.'
        : 'No historical flood inundation detected.',
    },
    {
      name: 'Historical Frequency',
      value: yearsExposedCount,
      display: `${yearsExposedCount} / 5 years`,
      normValue: normFrequency,
      weight: 0.3,
      description: yearsExposedCount >= 4 ? 'Repeatedly exposed across nearly all analysed flood years.'
        : yearsExposedCount >= 3 ? 'Exposed in multiple historical flood events.'
        : yearsExposedCount >= 2 ? 'Exposed in more than one flood year.'
        : yearsExposedCount === 1 ? 'Exposed in a single flood year.'
        : 'No historical flood exposure recorded.',
    },
    {
      name: 'Population Vulnerability',
      value: maxExposedPop,
      display: maxExposedPop > 0 ? `${maxExposedPop.toLocaleString()} people` : '0 people',
      normValue: normPop,
      weight: 0.3,
      description: normPop >= 50 ? 'Majority of the population exposed to flood inundation.'
        : normPop >= 25 ? 'Significant share of population in flood-exposed areas.'
        : normPop >= 10 ? 'Moderate population exposure detected.'
        : maxExposedPop > 0 ? 'Limited but notable population exposure.'
        : 'No population exposure quantified.',
    },
  ];

  const exposedYearsList = exposureHistory.filter(e => e.exposed).map(e => e.year);
  const notExposedYearsList = exposureHistory.filter(e => !e.exposed).map(e => e.year);

  let explanation = '';
  if (priority.level === 'Critical') {
    explanation = `This habitation is classified as Critical Priority because of extreme flood exposure (${maxExposure.toFixed(1)}% peak), repeated historical inundation across ${yearsExposedCount} years, and significant population vulnerability.`;
  } else if (priority.level === 'High') {
    explanation = `This habitation is classified as High Priority due to substantial flood exposure and historical frequency. ${yearsExposedCount >= 3 ? 'Repeated exposure across multiple years' : 'Peak flood events show significant coverage'} drives the elevated risk assessment.`;
  } else if (priority.level === 'Medium') {
    explanation = `This habitation is classified as Medium Priority. ${yearsExposedCount >= 2 ? 'While flood exposure has occurred in multiple years, ' : ''}the overall exposure magnitude and population vulnerability are moderate.`;
  } else {
    explanation = `This habitation is classified as Low Priority. ${yearsExposedCount > 0 ? 'Although some flood exposure exists, ' : ''}the historical exposure frequency and population vulnerability indicators are comparatively lower.`;
  }

  const decisionSummary = {
    Critical: 'Immediate attention is recommended based on the existing risk assessment.',
    High: 'Further risk mitigation and relocation assessment should be considered.',
    Medium: 'Continued monitoring and preparedness measures are recommended.',
    Low: 'Current indicators suggest comparatively lower priority.',
  };

  return {
    habitation: p.Name,
    censusId: p.pc11_tv_id,
    priority: priority.level,
    score: priority.score,
    scoreColor: priority.color,
    scoreBg: priority.bg,
    scoreBorder: priority.border,
    exposureYears: yearsExposedCount,
    exposedYearsList,
    notExposedYearsList,
    exposureHistory,
    factors,
    explanation,
    decisionSummary: decisionSummary[priority.level],
    population: totPop,
    households: p.No_HH || 0,
    maxExposure,
    frequency,
  };
}

export function filterFeatures(features, filters) {
  let result = [...features];
  const { search, minPop, maxPop, minExposure, maxExposure, exposureCategory, year } = filters;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter((f) => f.properties.Name.toLowerCase().includes(q));
  }
  if (minPop !== undefined && minPop !== '') {
    result = result.filter((f) => f.properties.TOT_P >= Number(minPop));
  }
  if (maxPop !== undefined && maxPop !== '') {
    result = result.filter((f) => f.properties.TOT_P <= Number(maxPop));
  }
  if (year) {
    const pctKey = `flood_pct_${year}`;
    if (minExposure !== undefined && minExposure !== '') {
      result = result.filter((f) => (f.properties[pctKey] || 0) >= Number(minExposure));
    }
    if (maxExposure !== undefined && maxExposure !== '') {
      result = result.filter((f) => (f.properties[pctKey] || 0) <= Number(maxExposure));
    }
    if (exposureCategory && exposureCategory !== 'all') {
      result = result.filter((f) => {
        const pct = f.properties[pctKey] || 0;
        const cat = getExposureCategory(pct);
        return cat.label === exposureCategory;
      });
    }
  }
  return result;
}
