import {
  FLOOD_YEARS,
  computeAllYearStats,
  computeHabitationPriority,
  computeAllPriorities,
  getPriorityDistribution,
  getYearWiseExposedCounts,
} from '../data/floodData';
import {
  SCORING_WEIGHTS,
  getSuitabilityDistribution,
} from '../data/relocationData';

let _features = null;
let _relocationFeatures = null;
let _allStats = null;

export function initAssistant(features, relocationFeatures) {
  _features = features;
  _relocationFeatures = relocationFeatures;
  if (features && features.length > 0) {
    _allStats = computeAllYearStats(features);
  }
}

// ── Text normalization ──

function normalize(q) {
  return q.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHinglish(q) {
  const map = {
    'kitne': 'how many', 'kitni': 'how many', 'kitna': 'how many',
    'batao': 'tell me', 'bata': 'tell me', 'dikhao': 'show me',
    'kya': 'what', 'kaun': 'which', 'kab': 'when', 'kyu': 'why', 'kyun': 'why',
    'kaise': 'how', 'mein': 'in', 'me': 'in',
    'sabse': 'most', 'zyada': 'highest', 'kam': 'lowest',
    'hai': 'is', 'hain': 'are', 'tha': 'was', 'the': 'were',
    'nahi': 'not', 'matlab': 'meaning',
    'ye': 'this', 'wo': 'that', 'woh': 'that',
    'habitation': 'habitation', 'gaon': 'village', 'village': 'village',
    'flood': 'flood', 'baadh': 'flood',
    'exposure': 'exposure', 'prabhavit': 'exposed',
    'priority': 'priority', 'score': 'score',
    'relocation': 'relocation', 'sthanantran': 'relocation',
    'data': 'data', 'source': 'source',
  };
  let out = q;
  for (const [hi, en] of Object.entries(map)) {
    out = out.replace(new RegExp(`\\b${hi}\\b`, 'gi'), en);
  }
  return out;
}

function fullNormalize(query) {
  return stripHinglish(normalize(query));
}

// ── Entity extraction ──

function extractYear(query) {
  const years = [1998, 1999, 2004, 2012, 2013];
  const q = query.toLowerCase();
  for (const y of years) {
    if (q.includes(String(y))) return y;
  }
  return null;
}

function findHabitation(query) {
  if (!_features) return null;
  const q = normalize(query);
  let best = null;
  let bestLen = 0;
  for (const f of _features) {
    const name = f.properties.Name || '';
    const lower = name.toLowerCase();
    if (lower && q.includes(lower)) {
      if (lower.length > bestLen) {
        bestLen = lower.length;
        best = f;
      }
    }
  }
  return best;
}

function extractEntities(query) {
  return {
    year: extractYear(query),
    habitation: findHabitation(query),
  };
}

// ── Intent definitions ──

const INTENTS = [
  // ── GENERAL RESQMAP ──
  {
    name: 'WHAT_IS_RESQMAP',
    patterns: [
      'what is resqmap', "what's resqmap", 'what is resq map', 'resqmap kya hai',
      'tell me about resqmap', 'resqmap about', 'about resqmap', 'resqmap meaning',
      'explain resqmap', 'resqmap explain', 'define resqmap',
    ],
    keywords: ['resqmap', 'resq', 'about'],
  },
  {
    name: 'PURPOSE_OF_RESQMAP',
    patterns: [
      'what is the purpose', 'why was resqmap', 'why resqmap', 'resqmap purpose',
      'why was this made', 'why was this created', 'what does resqmap do',
      'resqmap kya karta hai', 'iska purpose kya hai',
    ],
    keywords: ['purpose', 'why', 'created', 'made', 'goal', 'aim'],
  },
  {
    name: 'STUDY_AREA',
    patterns: [
      'study area', 'study district', 'which district', 'which area',
      'where is this', 'kahan hai', 'konsa district', 'konsa area',
      'geographic area', 'location of study', 'area covered',
      'what area', 'which region', 'study region', 'location',
    ],
    keywords: ['district', 'area', 'region', 'location', 'where', 'kahan', 'konsa'],
  },
  {
    name: 'HABITATION_COUNT',
    patterns: [
      'how many habitations', 'total habitations', 'habitation count',
      'number of habitations', 'kitne habitations', 'kitne gaon',
      'how many villages', 'total villages', 'village count',
      'how many settlements', 'count of habitations', 'habitation total',
    ],
    keywords: ['how many', 'total', 'count', 'kitne', 'kitni'],
    context: ['habitation', 'village', 'settlement', 'location'],
  },
  {
    name: 'ANALYSIS_PERIOD',
    patterns: [
      'which years', 'what years', 'years analysed', 'years analyzed',
      'flood years', 'historical years', 'analysis period',
      'time period', 'konsa year', 'konsa saal', 'kab se kab tak',
      'years covered', 'which year data', 'years available',
      'how many years', 'kitne saal', 'kitne years',
    ],
    keywords: ['year', 'years', 'saal', 'period', 'time'],
    exclude: ['expose', 'flood expose', 'highest', 'lowest', 'most', 'least', 'worst', 'best', 'how many expose'],
  },
  {
    name: 'ANALYSED_HAZARDS',
    patterns: [
      'which hazards', 'what hazards', 'hazards analysed', 'hazards analyzed',
      'types of hazards', 'hazard types', 'what hazard', 'kaun kaun se hazard',
      'flood landslide', 'multi hazard', 'disaster types',
    ],
    keywords: ['hazard', 'disaster', 'flood', 'landslide', 'earthquake'],
  },
  {
    name: 'DATA_SOURCES',
    patterns: [
      'data sources', 'source of data', 'where is data from', 'data kahan se aaya',
      'ndem', 'aikosh', 'shrug', 'census', 'nrsc', 'isro',
      'which data', 'what data', 'data used', 'dataset',
    ],
    keywords: ['data', 'source', 'dataset', 'ndem', 'aikosh', 'census', 'nrsc'],
  },
  {
    name: 'HOW_RESQMAP_WORKS',
    patterns: [
      'how does resqmap work', 'how resqmap works', 'resqmap workflow',
      'how it works', 'process', 'kaise kaam karta hai', 'workflow',
      'resqmap process', 'explain the process', 'how is it done',
      'methodology', 'what is the approach',
    ],
    keywords: ['how', 'work', 'process', 'workflow', 'kaise', 'method'],
  },
  {
    name: 'LIMITATIONS',
    patterns: [
      'limitations', 'what are limitations', 'constraints',
      'what cant it do', 'what cannot it do', 'kya nahi kar sakta',
      'disclaimer', 'restrictions', 'bounds',
    ],
    keywords: ['limit', 'limitation', 'constraint', 'cannot', 'cant', 'nahi'],
  },
  {
    name: 'WHAT_IS_GIS',
    patterns: [
      'what is gis', 'gis meaning', 'gis full form', 'gis kya hai',
      'geographic information', 'geospatial', 'gis explain',
    ],
    keywords: ['gis', 'geographic', 'geospatial'],
  },
  {
    name: 'WHAT_IS_NDEM',
    patterns: [
      'what is ndem', 'ndem meaning', 'ndem full form', 'ndem kya hai',
      'national digital elevation', 'ndem data',
    ],
    keywords: ['ndem', 'elevation', 'digital elevation'],
  },

  // ── FLOOD ──
  {
    name: 'TOTAL_FLOOD_EXPOSED',
    patterns: [
      'how many exposed', 'total exposed', 'exposed habitations',
      'flood exposed', 'how many flooded', 'kitne exposed',
      'kitne habitations exposed', 'how many affected', 'total affected',
      'exposed count', 'flooded habitations', 'kitne prabhavit',
    ],
    keywords: ['expose', 'exposed', 'flood', 'flooded', 'affected', 'prabhavit'],
    exclude: ['year', '1998', '1999', '2004', '2012', '2013', 'priority', 'relocation'],
  },
  {
    name: 'FLOOD_EXPOSURE_PERCENTAGE',
    patterns: [
      'exposure percentage', 'what percentage', 'exposed percentage',
      'percentage exposed', 'exposure rate', 'kitne percent',
      'exposure share', 'proportion exposed',
    ],
    keywords: ['percentage', 'percent', 'rate', 'proportion', 'percent'],
    context: ['expose', 'flood'],
  },
  {
    name: 'REPEATEDLY_EXPOSED',
    patterns: [
      'repeatedly exposed', 'multiple years exposed', 'multi year',
      'exposed in multiple', 'bar bar exposed', 'repeated flood',
      'how many exposed in more than one', 'repeatedly flooded',
      'exposed more than once', 'multi-year exposure',
    ],
    keywords: ['repeat', 'multiple', 'multi', 'bar bar', 'more than one'],
    context: ['expose', 'flood', 'year'],
  },
  {
    name: 'FLOOD_EXPOSURE_MEANING',
    patterns: [
      'what does exposure mean', 'exposure meaning', 'what is exposure',
      'exposed matlab kya', 'exposure kya hota hai', 'flood exposure meaning',
      'what is flood exposure', 'explain exposure', 'define exposure',
    ],
    keywords: ['meaning', 'meaning', 'matlab', 'kya hota hai', 'define', 'explain'],
    context: ['expose', 'exposure', 'flood'],
  },
  {
    name: 'HIGHEST_FLOOD_EXPOSURE_YEAR',
    patterns: [
      'which year highest', 'which year most', 'which year worst',
      'highest exposure year', 'most exposure', 'worst year',
      'sabse zyada exposure', 'sabse zyada kis year me',
      'which year had the highest', 'which year was worst',
      'maximum exposure year', 'peak exposure year',
      'konsa year sabse zyada', 'kaun sa saal',
      'year with most exposure', 'highest flood year',
      'when was exposure maximum', 'which year affected the most',
      'most habitations exposed in which year',
    ],
    keywords: ['highest', 'most', 'worst', 'maximum', 'peak', 'sabse zyada', 'max'],
    context: ['year', 'exposure', 'expose', 'flood'],
  },
  {
    name: 'LOWEST_FLOOD_EXPOSURE_YEAR',
    patterns: [
      'which year lowest', 'which year least', 'lowest exposure year',
      'least exposure', 'best year', 'sabse kam',
      'which year had the lowest', 'minimum exposure year',
      'year with least exposure', 'lowest flood year',
      'when was exposure minimum', 'which year affected the least',
      'konsa year sabse kam', 'kaun sa saal kam',
    ],
    keywords: ['lowest', 'least', 'minimum', 'min', 'sabse kam', 'best'],
    context: ['year', 'exposure', 'expose', 'flood'],
  },

  // ── YEAR-SPECIFIC (dynamic) ──
  {
    name: 'YEAR_WISE_EXPOSURE',
    patterns: [
      'exposed in', 'exposure in', 'flood in', 'affected in',
      'kya hua', 'me kitne', 'me exposure',
      'what happened in', 'how many in', 'how many were',
      'exposed thi', 'kitni exposed',
    ],
    keywords: ['expose', 'exposed', 'flood', 'affected', 'kitne', 'kitni'],
    requiresYear: true,
  },

  // ── HABITATION-SPECIFIC ──
  {
    name: 'HABITATION_PRIORITY',
    patterns: [
      'priority of', 'priority for', 'what is the priority',
      'kya hai priority', 'priority kya hai',
      'risk level', 'risk category',
    ],
    keywords: ['priority', 'risk level', 'risk category'],
    requiresHabitation: true,
  },
  {
    name: 'HABITATION_SCORE',
    patterns: [
      'score of', 'score for', 'what is the score', 'score kya hai',
      'priority score', 'risk score', 'kitna score hai',
    ],
    keywords: ['score', 'point', 'rating'],
    requiresHabitation: true,
  },
  {
    name: 'HABITATION_EXPOSURE_YEARS',
    patterns: [
      'years exposed', 'how many years exposed', 'exposed in how many',
      'kitne saal exposed', 'exposure years', 'flood years',
      'bar bar exposed', 'how often exposed',
    ],
    keywords: ['year', 'expose', 'exposed', 'flood', 'kitne saal', 'how many'],
    requiresHabitation: true,
    exclude: ['1998', '1999', '2004', '2012', '2013'],
  },
  {
    name: 'HABITATION_YEAR_EXPOSURE',
    patterns: [
      'exposed in', 'affected in', 'flood in', 'kya hua',
      'was it exposed', 'me exposed thi',
    ],
    keywords: ['expose', 'exposed', 'affected', 'flood'],
    requiresHabitation: true,
    requiresYear: true,
  },
  {
    name: 'HABITATION_RISK_EXPLANATION',
    patterns: [
      'why is', 'kyu hai', 'kyun hai', 'reason', 'because',
      'why high', 'why critical', 'why low',
      'kyu high hai', 'kyu critical hai', 'reason for',
    ],
    keywords: ['why', 'kyu', 'kyun', 'reason', 'because'],
    requiresHabitation: true,
  },
  {
    name: 'HABITATION_DETAILS',
    patterns: [
      'tell me about', 'information about', 'details of', 'details about',
      'about this', 'kya hai ye', 'batao about', 'show me details',
      'what about', 'info on',
    ],
    keywords: ['tell', 'information', 'detail', 'about', 'batao', 'info'],
    requiresHabitation: true,
  },

  // ── PRIORITY ──
  {
    name: 'PRIORITY_METHODOLOGY',
    patterns: [
      'how is priority calculated', 'priority calculation', 'priority formula',
      'how to calculate priority', 'priority kaise calculate hota hai',
      'priority scoring', 'score formula', 'how score is calculated',
      'weighted score', 'priority method',
    ],
    keywords: ['calculate', 'formula', 'method', 'scoring', 'weighted', 'kaise'],
    context: ['priority', 'score'],
  },
  {
    name: 'PRIORITY_FACTORS',
    patterns: [
      'priority factors', 'what affects priority', 'what determines priority',
      'priority components', 'factors affecting', 'kya affect karta hai',
      'what goes into priority', 'priority ingredients',
    ],
    keywords: ['factor', 'component', 'determine', 'affect', 'ingredient'],
    context: ['priority', 'score'],
  },
  {
    name: 'PRIORITY_DISTRIBUTION',
    patterns: [
      'priority distribution', 'priority breakdown', 'how many critical',
      'how many high priority', 'priority count', 'priority levels',
      'kitne critical', 'kitne high priority', 'distribution of priority',
      'priority wise count', 'level wise count',
    ],
    keywords: ['distribution', 'breakdown', 'count', 'kitne', 'level'],
    context: ['priority'],
  },
  {
    name: 'HIGH_PRIORITY_HABITATIONS',
    patterns: [
      'high priority', 'critical priority', 'top priority',
      'highest priority', 'which are high', 'sabse high priority',
      'most critical', 'most at risk', 'top risk',
      'high priority wale', 'critical wale',
    ],
    keywords: ['high', 'critical', 'top', 'most', 'sabse', 'highest'],
    context: ['priority', 'risk'],
  },
  {
    name: 'PRIORITY_LEVEL_MEANING',
    patterns: [
      'what does high priority mean', 'what does critical mean',
      'what does medium mean', 'what does low priority mean',
      'priority level meaning', 'critical matlab kya',
      'high priority meaning', 'priority levels explained',
    ],
    keywords: ['meaning', 'matlab', 'mean', 'explain', 'define'],
    context: ['priority', 'level', 'critical', 'high', 'medium', 'low'],
  },

  // ── RELOCATION ──
  {
    name: 'RELOCATION_CANDIDATE_COUNT',
    patterns: [
      'how many relocation', 'relocation candidates', 'relocation count',
      'kitne relocation', 'suitable sites', 'relocation sites count',
      'how many suitable', 'total relocation', 'relocation total',
    ],
    keywords: ['how many', 'count', 'total', 'kitne'],
    context: ['relocation', 'relocat', 'candidate', 'site', 'suitable'],
  },
  {
    name: 'RELOCATION_SUITABILITY',
    patterns: [
      'which sites suitable', 'suitable sites', 'relocation suitable',
      'which are suitable', 'kaun kaun suitable hai',
      'top relocation', 'best sites', 'highest suitability',
      'sabse suitable', 'site list',
    ],
    keywords: ['suitable', 'suitability', 'which', 'top', 'best', 'sabse'],
    context: ['relocation', 'relocat', 'site'],
  },
  {
    name: 'RELOCATION_FACTORS',
    patterns: [
      'relocation factors', 'how are sites selected', 'relocation criteria',
      'what makes site suitable', 'relocation scoring', 'relocation weight',
      'site selection', 'factors for relocation',
      'kaise select hota hai', 'relocation method',
    ],
    keywords: ['factor', 'select', 'criteria', 'scoring', 'weight', 'method', 'kaise'],
    context: ['relocation', 'relocat', 'site', 'suitable'],
  },
  {
    name: 'RELOCATION_METHODOLOGY',
    patterns: [
      'relocation methodology', 'how relocation works', 'relocation process',
      'relocation explain', 'relocation kaise hota hai',
      'relocation approach', 'relocation system',
    ],
    keywords: ['methodology', 'process', 'explain', 'approach', 'system', 'kaise'],
    context: ['relocation', 'relocat'],
  },

  // ── GIS / METHODOLOGY ──
  {
    name: 'WHAT_IS_GIS',
    patterns: [
      'what is gis', 'gis kya hai', 'gis explain', 'gis meaning',
      'geographic information system',
    ],
    keywords: ['gis', 'geographic'],
  },
  {
    name: 'WHAT_IS_NDEM',
    patterns: [
      'what is ndem', 'ndem kya hai', 'ndem explain', 'ndem data',
      'national digital elevation model',
    ],
    keywords: ['ndem', 'elevation'],
  },
  {
    name: 'WHAT_IS_AIKOSH',
    patterns: [
      'what is aikosh', 'aikosh kya hai', 'aikosh explain',
      'aikosh data', 'aikosh village',
    ],
    keywords: ['aikosh'],
  },
  {
    name: 'WHY_HISTORICAL_DATA',
    patterns: [
      'why historical', 'why past data', 'why 1998 2013',
      'historical data purpose', 'past flood data',
      'purana data kyu', 'historical kyu',
    ],
    keywords: ['historical', 'past', 'purana', 'history'],
  },
];

// ── Intent matching ──

function matchIntent(query) {
  const q = fullNormalize(query);
  const entities = extractEntities(query);

  // Check year-wise exposure first (needs year entity)
  const yearIntent = INTENTS.find(i => i.name === 'YEAR_WISE_EXPOSURE');
  if (entities.year && yearIntent) {
    const hasContext = yearIntent.keywords.some(k => q.includes(k)) || q.match(/\b(expose|flood|affected|kitne|kitni|hua)\b/);
    if (hasContext) {
      return { intent: yearIntent, entities };
    }
  }

  // Habitation year exposure (needs both habitation and year)
  if (entities.habitation && entities.year) {
    const hyIntent = INTENTS.find(i => i.name === 'HABITATION_YEAR_EXPOSURE');
    if (hyIntent && q.match(/\b(expose|flood|affected|kitne|kitni|hua|was)\b/)) {
      return { intent: hyIntent, entities };
    }
  }

  // Score each intent
  let bestMatch = null;
  let bestScore = 0;

  for (const intent of INTENTS) {
    if (intent.name === 'YEAR_WISE_EXPOSURE' || intent.name === 'HABITATION_YEAR_EXPOSURE') continue;

    let score = 0;

    // Exact pattern match
    for (const pattern of (intent.patterns || [])) {
      if (q.includes(pattern)) {
        score += 10;
        break;
      }
    }

    // Keyword matching
    const kwHits = (intent.keywords || []).filter(k => q.includes(k)).length;
    score += kwHits * 3;

    // Context matching
    const ctxHits = (intent.context || []).filter(c => q.includes(c)).length;
    score += ctxHits * 2;

    // Requires entities
    if (intent.requiresYear && !entities.year) score = 0;
    if (intent.requiresHabitation && !entities.habitation) {
      // Allow anyway for priority methodology etc
      if (!intent.context || intent.context.length === 0) score = 0;
    }

    // Exclude patterns
    if (intent.exclude) {
      for (const ex of intent.exclude) {
        if (q.includes(ex)) {
          // Only exclude if no context match
          const ctxMatch = (intent.context || []).some(c => q.includes(c));
          if (!ctxMatch) {
            score -= 5;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = intent;
    }
  }

  if (bestScore >= 3) {
    return { intent: bestMatch, entities };
  }

  // Fallback: if habitation found, show info
  if (entities.habitation) {
    return { intent: INTENTS.find(i => i.name === 'HABITATION_DETAILS'), entities };
  }

  return { intent: null, entities };
}

// ── Response generation ──

function generateResponse(match) {
  const { intent, entities } = match;
  if (!intent) return null;

  switch (intent.name) {
    // ── GENERAL ──
    case 'WHAT_IS_RESQMAP':
      return `**NAVIS** is a GIS-based disaster risk and relocation decision-support platform for **Kamrup Metropolitan District**, Assam, India. It analyses historical flood exposure across 228 habitations using Census 2011 data and NDEM flood inundation records.`;

    case 'PURPOSE_OF_RESQMAP':
      return `NAVIS helps disaster management officials and planners identify **which habitations are most at risk** from floods, how **priority** should be assigned, and where **relocation** may be needed. It provides analytical scoring — not official government classifications.`;

    case 'STUDY_AREA':
      return `The study area is **Kamrup Metropolitan District**, Assam, India. It spans approximately **25.97°N to 26.32°N** latitude and **91.51°E to 92.23°E** longitude.`;

    case 'HABITATION_COUNT': {
      const count = _features ? _features.length : 0;
      return `There are **${count}** habitations in the NAVIS dataset for Kamrup Metropolitan District.`;
    }

    case 'ANALYSIS_PERIOD':
      return `NAVIS analyses **5** historical flood years: **${FLOOD_YEARS.join(', ')}**.`;

    case 'ANALYSED_HAZARDS':
      return `The current MVP implements **flood hazard** analysis using NDEM historical flood inundation data. **Landslide** hazard overlap was also checked (0 overlap with habitation zones). Other hazards like earthquakes and droughts are planned for future versions.`;

    case 'DATA_SOURCES':
      return `NAVIS uses:\n- **Census 2011** (PC11) for habitation boundaries and demographics\n- **AIKOSH/SHRUG** for village polygons\n- **NDEM** (NRSC/ISRO) for historical flood inundation (1998-2013)\n- **NCEL/DEM** for elevation and slope data\n- **OpenStreetMap** for roads and amenities`;

    case 'HOW_RESQMAP_WORKS':
      return `NAVIS works in stages:\n1. **Data ingestion** — Census habitations, flood inundation rasters, elevation data\n2. **Spatial analysis** — Overlay habitation polygons with flood rasters to compute exposure\n3. **Priority scoring** — Weighted formula using exposure, frequency, and population\n4. **Relocation assessment** — Score potential relocation sites by elevation, slope, accessibility\n5. **Visualization** — Interactive maps, charts, and dashboards`;

    case 'LIMITATIONS':
      return `Key limitations:\n- Current MVP covers **flood hazard only**\n- Exposure is based on **spatial overlap** — not actual affected population\n- Priority is an **analytical indicator** — not an official government classification\n- Relocation candidates are **preliminary** — require ground-truthing\n- Data is from 1998-2013 — may not reflect recent changes`;

    case 'WHAT_IS_GIS':
      return `**GIS** (Geographic Information System) is a system for capturing, storing, and analyzing spatial and geographic data. NAVIS uses GIS to overlay habitation boundaries with flood data, compute exposure, and visualize results on interactive maps.`;

    case 'WHAT_IS_NDEM':
      return `**NDEM** (National Digital Elevation Model) is a product of NRSC/ISRO. NAVIS uses NDEM's yearly aggregate flood inundation data for Assam (1998-2013) to determine which habitations were exposed to flooding in each year.`;

    case 'WHAT_IS_AIKOSH':
      return `**AIKOSH** (part of the SHRUG platform by Carnegie India) provides digitized Census 2011 village/town polygons. NAVIS uses AIKOSH village polygons as habitation boundaries for spatial analysis.`;

    case 'WHY_HISTORICAL_DATA':
      return `Historical flood data helps identify **patterns of repeated exposure**. A habitation exposed in multiple years is more vulnerable than one exposed in a single event. NAVIS uses 5 years (1998, 1999, 2004, 2012, 2013) to calculate frequency and priority.`;

    // ── FLOOD ──
    case 'TOTAL_FLOOD_EXPOSED': {
      if (!_features) return 'Data not loaded yet.';
      const exposed = _features.filter(f => (f.properties.flood_years_exposed || 0) > 0).length;
      return `**${exposed}** out of ${_features.length} habitations (${((exposed / _features.length) * 100).toFixed(1)}%) have historical flood exposure across the ${FLOOD_YEARS.length} analysed years.`;
    }

    case 'FLOOD_EXPOSURE_PERCENTAGE': {
      if (!_features) return 'Data not loaded yet.';
      const exposed = _features.filter(f => (f.properties.flood_years_exposed || 0) > 0).length;
      return `**${((exposed / _features.length) * 100).toFixed(1)}%** of habitations (${exposed}/${_features.length}) have at least one year of flood exposure.`;
    }

    case 'REPEATEDLY_EXPOSED': {
      if (!_features) return 'Data not loaded yet.';
      const multi = _features.filter(f => (f.properties.flood_years_exposed || 0) >= 2).length;
      return `**${multi}** habitations were exposed in 2 or more years, indicating repeated vulnerability.`;
    }

    case 'FLOOD_EXPOSURE_MEANING':
      return `**Flood exposure** in NAVIS means a habitation's polygon spatially overlaps with flood inundation data for a given year. It is an **estimate based on geographic overlap** — it does NOT mean people were actually affected. The exposure percentage shows what portion of the habitation area was inundated.`;

    case 'HIGHEST_FLOOD_EXPOSURE_YEAR': {
      if (!_allStats) return 'Data not loaded yet.';
      let maxYear = FLOOD_YEARS[0], maxCount = 0;
      for (const y of FLOOD_YEARS) {
        const s = _allStats[y];
        if (s && s.exposedHabitations > maxCount) { maxCount = s.exposedHabitations; maxYear = y; }
      }
      let minYear = FLOOD_YEARS[0], minCount = Infinity;
      for (const y of FLOOD_YEARS) {
        const s = _allStats[y];
        if (s && s.exposedHabitations < minCount) { minCount = s.exposedHabitations; minYear = y; }
      }
      return `**${maxYear}** had the highest exposure with **${maxCount}** habitations exposed. For comparison, **${minYear}** had the lowest with ${minCount}.`;
    }

    case 'LOWEST_FLOOD_EXPOSURE_YEAR': {
      if (!_allStats) return 'Data not loaded yet.';
      let minYear = FLOOD_YEARS[0], minCount = Infinity;
      for (const y of FLOOD_YEARS) {
        const s = _allStats[y];
        if (s && s.exposedHabitations < minCount) { minCount = s.exposedHabitations; minYear = y; }
      }
      return `**${minYear}** had the lowest exposure with **${minCount}** habitations exposed.`;
    }

    case 'YEAR_WISE_EXPOSURE': {
      if (!_allStats) return 'Data not loaded yet.';
      const year = entities.year;
      if (!year) return 'Please specify a year (1998, 1999, 2004, 2012, or 2013).';
      const stats = _allStats[year];
      if (!stats) return `No data found for year ${year}.`;
      return `In **${year}**, **${stats.exposedHabitations}** out of ${stats.totalHabitations} habitations were exposed. Average exposure: ${stats.avgExposure.toFixed(1)}%. Maximum single-habitation exposure: ${stats.maxExposure.toFixed(1)}% (${stats.maxExposureName}).`;
    }

    // ── HABITATION-SPECIFIC ──
    case 'HABITATION_PRIORITY': {
      const p = entities.habitation.properties;
      const priority = computeHabitationPriority(entities.habitation);
      return `**${p.Name}** has a priority level of **${priority.level}** (score: **${priority.score}**). Max exposure: ${priority.maxExposure.toFixed(1)}%, frequency: ${(priority.frequency * 100).toFixed(0)}%.`;
    }

    case 'HABITATION_SCORE': {
      const priority = computeHabitationPriority(entities.habitation);
      return `**${entities.habitation.properties.Name}** has a priority score of **${priority.score}** (level: ${priority.level}).`;
    }

    case 'HABITATION_EXPOSURE_YEARS': {
      const p = entities.habitation.properties;
      const count = FLOOD_YEARS.filter(y => (p[`flood_pct_${y}`] || 0) > 0).length;
      const exposedYears = FLOOD_YEARS.filter(y => (p[`flood_pct_${y}`] || 0) > 0);
      if (count === 0) return `**${p.Name}** was not exposed in any of the analysed flood years.`;
      return `**${p.Name}** was exposed in **${count} out of ${FLOOD_YEARS.length}** years: ${exposedYears.join(', ')}.`;
    }

    case 'HABITATION_YEAR_EXPOSURE': {
      const p = entities.habitation.properties;
      const year = entities.year;
      if (!year) return `Please specify a year.`;
      const pct = p[`flood_pct_${year}`] || 0;
      if (pct === 0) return `**${p.Name}** was **not exposed** in ${year}.`;
      const cat = pct > 75 ? 'Very High' : pct > 50 ? 'High' : pct > 25 ? 'Moderate' : 'Low';
      return `**${p.Name}** was exposed in **${year}** with **${pct.toFixed(1)}%** area inundated (${cat} exposure).`;
    }

    case 'HABITATION_RISK_EXPLANATION': {
      const p = entities.habitation.properties;
      const priority = computeHabitationPriority(entities.habitation);
      const reasons = [];
      if (priority.maxExposure >= 75) reasons.push(`very high max exposure of ${priority.maxExposure.toFixed(1)}%`);
      else if (priority.maxExposure >= 50) reasons.push(`high max exposure of ${priority.maxExposure.toFixed(1)}%`);
      else if (priority.maxExposure >= 25) reasons.push(`moderate max exposure of ${priority.maxExposure.toFixed(1)}%`);
      if (priority.frequency >= 0.6) reasons.push(`exposed in ${(priority.frequency * 100).toFixed(0)}% of analysed years`);
      if (priority.maxExposedPop >= 1000) reasons.push(`large exposed population of ${priority.maxExposedPop.toLocaleString()}`);
      else if (priority.maxExposedPop >= 500) reasons.push(`exposed population of ${priority.maxExposedPop.toLocaleString()}`);
      if (reasons.length === 0) reasons.push(`cumulative weighted score across exposure, frequency, and population factors`);
      return `**${p.Name}** is **${priority.level}** because: ${reasons.join('; ')}. Score: ${priority.score}.`;
    }

    case 'HABITATION_DETAILS': {
      const p = entities.habitation.properties;
      const priority = computeHabitationPriority(entities.habitation);
      const count = FLOOD_YEARS.filter(y => (p[`flood_pct_${y}`] || 0) > 0).length;
      const exposedYears = FLOOD_YEARS.filter(y => (p[`flood_pct_${y}`] || 0) > 0);
      return `**${p.Name}** (Census ID: ${p.pc11_tv_id})\n- Population: ${(p.TOT_P || 0).toLocaleString()}\n- Households: ${(p.No_HH || 0).toLocaleString()}\n- Years exposed: ${count}/${FLOOD_YEARS.length} ${exposedYears.length > 0 ? '(' + exposedYears.join(', ') + ')' : ''}\n- Priority: ${priority.level} (score: ${priority.score})\n- Max exposure: ${(p.max_flood_exposure_pct || 0).toFixed(1)}%`;
    }

    // ── PRIORITY ──
    case 'PRIORITY_METHODOLOGY':
      return `NAVIS Analytical Priority uses a weighted formula:\n\n**Score = (MaxExposure x 0.4) + (Frequency x 0.3) + (PopExposure x 0.3)**\n\nWhere:\n- MaxExposure: Maximum historical flood exposure % (0-100)\n- Frequency: % of years with exposure (0-1)\n- PopExposure: Max exposed population as % of total (0-100)\n\nLevels: Critical (>=70), High (>=50), Medium (>=30), Low (<30).`;

    case 'PRIORITY_FACTORS':
      return `Three factors determine priority:\n1. **Maximum Flood Exposure** (40%) — Highest historical flood exposure %\n2. **Flood Frequency** (30%) — How often the habitation is exposed across years\n3. **Population Exposure** (30%) — Max exposed population relative to total population`;

    case 'PRIORITY_DISTRIBUTION': {
      if (!_features) return 'Data not loaded yet.';
      const dist = getPriorityDistribution(_features);
      return `Priority distribution across ${_features.length} habitations:\n- **Critical**: ${dist.Critical}\n- **High**: ${dist.High}\n- **Medium**: ${dist.Medium}\n- **Low**: ${dist.Low}`;
    }

    case 'HIGH_PRIORITY_HABITATIONS': {
      if (!_features) return 'Data not loaded yet.';
      const all = computeAllPriorities(_features);
      const high = all.filter(a => a.priority.level === 'Critical' || a.priority.level === 'High');
      if (high.length === 0) return 'No Critical or High priority habitations found.';
      const top5 = high.slice(0, 5);
      const list = top5.map(a => `**${a.feature.properties.Name}** (${a.priority.level}, score: ${a.priority.score})`).join('\n- ');
      return `There are **${high.length}** Critical/High priority habitations. Top 5:\n- ${list}`;
    }

    case 'PRIORITY_LEVEL_MEANING':
      return `Priority levels in NAVIS:\n- **Critical** (score >= 70): Requires immediate attention\n- **High** (score >= 50): Significant risk, needs planning\n- **Medium** (score >= 30): Moderate risk, monitor\n- **Low** (score < 30): Lower relative risk\n\nThese are **analytical indicators** — NOT official government risk classifications.`;

    // ── RELOCATION ──
    case 'RELOCATION_CANDIDATE_COUNT': {
      if (!_relocationFeatures) return 'Relocation data not loaded yet.';
      return `There are **${_relocationFeatures.length}** preliminary relocation suitability candidates.`;
    }

    case 'RELOCATION_SUITABILITY': {
      if (!_relocationFeatures) return 'Relocation data not loaded yet.';
      const dist = getSuitabilityDistribution(_relocationFeatures);
      const high = _relocationFeatures.filter(f => f.properties.suitability_class === 'High');
      const list = high.slice(0, 5).map(f => `**${f.properties.tv_name || 'Unknown'}** (score: ${f.properties.suitability_score})`).join('\n- ');
      return `Suitability distribution:\n- **High**: ${dist.High}\n- **Medium**: ${dist.Medium}\n- **Low**: ${dist.Low}\n\nTop High sites:\n- ${list || 'None found'}`;
    }

    case 'RELOCATION_FACTORS': {
      const weights = SCORING_WEIGHTS.map(w => `- **${w.label}** (${(w.weight * 100).toFixed(0)}%): ${w.description}`).join('\n');
      return `Relocation suitability scoring factors:\n${weights}`;
    }

    case 'RELOCATION_METHODOLOGY':
      return `Relocation suitability is assessed by scoring potential sites on 5 factors:\n1. **Elevation** (25%) — Higher = safer from riverine flooding\n2. **Slope** (15%) — Flatter = easier construction\n3. **Road Access** (20%) — Closer to major roads = better evacuation\n4. **Amenities** (25%) — More existing facilities = less new infrastructure\n5. **Proximity to Vulnerable** (15%) — Closer to exposed populations = more useful\n\nSites are classified as High/Medium/Low suitability based on total score.`;

    default:
      return null;
  }
}

// ── Main query processor ──

export function processQuery(query) {
  if (!_features || _features.length === 0) {
    return 'Data is still loading. Please try again in a moment.';
  }

  const match = matchIntent(query);
  const response = generateResponse(match);

  if (response) return response;

  return "I couldn't find that information in the current NAVIS dataset. Try asking about:\n- Habitation counts and flood exposure\n- Year-wise flood data (1998, 1999, 2004, 2012, 2013)\n- Priority analysis and methodology\n- Relocation candidates and scoring\n- GIS and methodology questions";
}

export const SUGGESTED_QUESTIONS = [
  'How many habitations are flood exposed?',
  'Which year had the highest exposure?',
  'What is the study area?',
  'How is priority calculated?',
  'Why is a habitation marked high priority?',
  'How many relocation candidates are there?',
  'What data sources does NAVIS use?',
  'How does NAVIS work?',
  'What is flood exposure?',
];
