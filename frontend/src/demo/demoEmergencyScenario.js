export const SCENARIO_TITLE = 'Simulated Flood Escalation — Kamrup Metropolitan';
export const SCENARIO_SUBTITLE = 'Illustrative pre-disaster decision-support demonstration';

export const SCENARIO_VILLAGES = [
  {
    id: 'village-a',
    name: 'Chandrapur Gaon',
    population: 1200,
    households: 240,
    lat: 26.148,
    lng: 91.632,
    floodImpact: 'HIGH',
    yearsExposed: 4,
    maxExposure: 72.3,
    priority: 'Critical',
    priorityScore: 78,
    isSimulation: true,
  },
  {
    id: 'village-b',
    name: 'Bachgoan',
    population: 950,
    households: 190,
    lat: 26.162,
    lng: 91.648,
    floodImpact: 'HIGH',
    yearsExposed: 3,
    maxExposure: 61.8,
    priority: 'High',
    priorityScore: 64,
    isSimulation: true,
  },
  {
    id: 'village-c',
    name: 'Jalukbari',
    population: 1300,
    households: 260,
    lat: 26.138,
    lng: 91.655,
    floodImpact: 'MODERATE',
    yearsExposed: 2,
    maxExposure: 48.7,
    priority: 'Medium',
    priorityScore: 52,
    isSimulation: true,
  },
];

export const SCENARIO_SITES = [
  {
    id: 'site-a',
    name: 'Agyathuri Relocation Candidate',
    candidateId: 'RC-025',
    lat: 26.205848,
    lng: 91.667828,
    suitability: 56.85,
    capacity: 1500,
    elevation: 193,
    exposedYears: 0,
    isSimulation: true,
  },
  {
    id: 'site-b',
    name: 'No.2 Bonda Grant Candidate',
    candidateId: 'RC-029',
    lat: 26.176986,
    lng: 91.843815,
    suitability: 56.25,
    capacity: 1800,
    elevation: 60,
    exposedYears: 0,
    isSimulation: true,
  },
  {
    id: 'site-c',
    name: 'Kalitakuchi N.C. Candidate',
    candidateId: 'RC-038',
    lat: 26.159718,
    lng: 91.851107,
    suitability: 53.92,
    capacity: 800,
    elevation: 109,
    exposedYears: 0,
    isSimulation: true,
  },
  {
    id: 'site-d',
    name: 'Bonda Candidate',
    candidateId: 'RC-011',
    lat: 26.169489,
    lng: 91.855334,
    suitability: 60.27,
    capacity: 1600,
    elevation: 167,
    exposedYears: 0,
    isSimulation: true,
  },
];

export const SCENARIO_ROUTES = [
  {
    villageId: 'village-a',
    siteId: 'site-a',
    distanceKm: 8.4,
    travelTimeMin: 22,
    roadName: 'Simulated access route',
    polyline: [
      [26.148, 91.632],
      [26.166, 91.646],
      [26.185, 91.658],
      [26.205848, 91.667828],
    ],
  },
  {
    villageId: 'village-b',
    siteId: 'site-b',
    distanceKm: 12.6,
    travelTimeMin: 31,
    roadName: 'Simulated access route',
    polyline: [
      [26.162, 91.648],
      [26.168, 91.692],
      [26.171, 91.748],
      [26.177, 91.843815],
    ],
  },
  {
    villageId: 'village-c',
    siteId: 'site-d',
    distanceKm: 13.9,
    travelTimeMin: 34,
    roadName: 'Simulated access route',
    polyline: [
      [26.138, 91.655],
      [26.148, 91.704],
      [26.160, 91.770],
      [26.169489, 91.855334],
    ],
  },
];

export const SCENARIO_STEPS = [
  {
    key: 'warning',
    label: 'Flood warning received',
    description: 'Analysing weather intelligence and upstream data...',
    duration: 1500,
    icon: '📡',
  },
  {
    key: 'identify',
    label: 'Identifying potentially affected habitations',
    description: 'Cross-referencing flood hazard zones with habitation boundaries...',
    duration: 1800,
    icon: '🔍',
  },
  {
    key: 'population',
    label: 'Estimating population at risk',
    description: 'Calculating exposed population using Census 2011 data...',
    duration: 1500,
    icon: '👥',
  },
  {
    key: 'sites',
    label: 'Evaluating relocation sites',
    description: 'Scoring candidate sites by elevation, capacity, accessibility...',
    duration: 1800,
    icon: '🏫',
  },
  {
    key: 'capacity',
    label: 'Checking carrying capacity',
    description: 'Comparing population at risk against site capacities...',
    duration: 1500,
    icon: '📊',
  },
  {
    key: 'routes',
    label: 'Generating recommended road routes',
    description: 'Calculating shortest accessible road routes to safe sites...',
    duration: 2000,
    icon: '🛣️',
  },
];

export const SCENARIO_COMPLETE = {
  title: 'PRE-DISASTER RELOCATION PLAN READY',
  subtitle: 'Analytical decision-support demonstration — not an official evacuation directive.',
  summary: {
    affectedHabitations: 3,
    populationAtRisk: 3450,
    recommendedSites: 4,
    sufficientSites: 3,
    routesGenerated: 3,
  },
};

export const SCENARIO_DISCLAIMER = 'Illustrative scenario for demonstration purposes. Not a real emergency alert or evacuation order.';
