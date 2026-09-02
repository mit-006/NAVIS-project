let cachedData = null;

export const SUITABILITY_LEVELS = [
  { level: 'High', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', minScore: 70 },
  { level: 'Medium', color: '#ca8a04', bg: '#fefce8', border: '#fef08a', minScore: 50 },
  { level: 'Low', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa', minScore: 0 },
];

export const SCORING_WEIGHTS = [
  { label: 'Elevation', weight: 0.25, unit: 'm', description: 'Higher relative elevation = safer from riverine flooding' },
  { label: 'Slope', weight: 0.15, unit: 'deg', description: 'Flatter land = easier construction and drainage' },
  { label: 'Road Accessibility', weight: 0.20, unit: 'km', description: 'Closer to major roads = better evacuation access' },
  { label: 'Amenities', weight: 0.25, unit: 'score', description: 'More existing facilities = less new infrastructure needed' },
  { label: 'Proximity to Vulnerable', weight: 0.15, unit: 'km', description: 'Closer to exposed populations = more useful relocation target' },
];

export async function loadRelocationData() {
  if (cachedData) return cachedData;
  const res = await fetch('/data/preliminary_relocation_candidates.geojson');
  const geojson = await res.json();
  cachedData = geojson;
  return geojson;
}

export function getSuitabilityLevel(score) {
  for (const lvl of SUITABILITY_LEVELS) {
    if (score >= lvl.minScore) return lvl;
  }
  return SUITABILITY_LEVELS[SUITABILITY_LEVELS.length - 1];
}

export function getSuitabilityDistribution(features) {
  const dist = { High: 0, Medium: 0, Low: 0 };
  features.forEach((f) => {
    const cls = f.properties.suitability_class;
    if (dist[cls] !== undefined) dist[cls]++;
  });
  return dist;
}

export function getElevationDistribution(features) {
  const bands = { '<50m (floodplain)': 0, '50-100m (low)': 0, '100-200m (foothill)': 0, '200-500m (upland)': 0, '>500m (high)': 0 };
  features.forEach((f) => {
    const band = f.properties.elevation_band;
    if (bands[band] !== undefined) bands[band]++;
  });
  return Object.entries(bands).map(([band, count]) => ({ band, count }));
}

export function getScoreBreakdown(feature) {
  const p = feature.properties;
  const elevNorm = Math.min(p.elevation_m / 300, 1.0) * 25;
  const slopeNorm = Math.max(0, (1 - p.slope_deg / 30)) * 15;
  const roadNorm = Math.max(0, (1 - p.distance_to_major_road_km / 10)) * 20;
  const amenNorm = (p.amenities_score / 100) * 25;
  const proxNorm = Math.min(1, Math.max(0, 1 - p.distance_to_nearest_exposed_km / 5)) * 8 +
                   Math.min(1, p.nearby_vulnerable_pop / 10000) * 7;
  return [
    { factor: 'Elevation', raw: `${p.elevation_m}m`, normalized: elevNorm.toFixed(1), max: 25, weight: '25%' },
    { factor: 'Slope', raw: `${p.slope_deg.toFixed(1)} deg`, normalized: slopeNorm.toFixed(1), max: 15, weight: '15%' },
    { factor: 'Road Access', raw: `${p.distance_to_major_road_km.toFixed(1)} km`, normalized: roadNorm.toFixed(1), max: 20, weight: '20%' },
    { factor: 'Amenities', raw: `${p.amenities_score.toFixed(0)}/100`, normalized: amenNorm.toFixed(1), max: 25, weight: '25%' },
    { factor: 'Proximity', raw: `${p.distance_to_nearest_exposed_km.toFixed(1)} km`, normalized: proxNorm.toFixed(1), max: 15, weight: '15%' },
  ];
}

export function filterCandidates(features, filters) {
  let result = [...features];
  const { search, suitabilityClass, minScore, maxScore, minElevation, maxElevation, minSlope, maxSlope, minRoad, maxRoad, floodHistory } = filters;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter((f) => {
      const name = f.properties.tv_name || '';
      const id = f.properties.candidate_id || '';
      return name.toLowerCase().includes(q) || id.toLowerCase().includes(q);
    });
  }
  if (suitabilityClass && suitabilityClass !== 'all') {
    result = result.filter((f) => f.properties.suitability_class === suitabilityClass);
  }
  if (minScore !== undefined && minScore !== '') {
    result = result.filter((f) => f.properties.suitability_score >= Number(minScore));
  }
  if (maxScore !== undefined && maxScore !== '') {
    result = result.filter((f) => f.properties.suitability_score <= Number(maxScore));
  }
  if (minElevation !== undefined && minElevation !== '') {
    result = result.filter((f) => f.properties.elevation_m >= Number(minElevation));
  }
  if (maxElevation !== undefined && maxElevation !== '') {
    result = result.filter((f) => f.properties.elevation_m <= Number(maxElevation));
  }
  if (minSlope !== undefined && minSlope !== '') {
    result = result.filter((f) => f.properties.slope_deg >= Number(minSlope));
  }
  if (maxSlope !== undefined && maxSlope !== '') {
    result = result.filter((f) => f.properties.slope_deg <= Number(maxSlope));
  }
  if (minRoad !== undefined && minRoad !== '') {
    result = result.filter((f) => f.properties.distance_to_major_road_km >= Number(minRoad));
  }
  if (maxRoad !== undefined && maxRoad !== '') {
    result = result.filter((f) => f.properties.distance_to_major_road_km <= Number(maxRoad));
  }
  if (floodHistory && floodHistory !== 'all') {
    result = result.filter((f) => {
      const years = f.properties.exposed_years || 0;
      if (floodHistory === 'never') return years === 0;
      if (floodHistory === '1-2') return years >= 1 && years <= 2;
      if (floodHistory === '3+') return years >= 3;
      return true;
    });
  }
  return result;
}
