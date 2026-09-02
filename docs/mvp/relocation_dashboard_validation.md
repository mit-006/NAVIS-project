# Relocation Dashboard Validation Report

**Date**: August 30, 2026  
**Component**: Relocation Sites Dashboard  
**Status**: PASSED — Production build successful

---

## 1. Candidate Count

| Metric | Value |
|--------|-------|
| Total candidates displayed | 76 |
| High suitability (>= 70) | 1 |
| Medium suitability (50-69) | 59 |
| Low suitability (30-49) | 16 |
| Very Low (< 30) | 0 |

**Data source**: `data/processed/preliminary_relocation_candidates.geojson`  
**Loaded from**: `/data/preliminary_relocation_candidates.geojson` (frontend public)

---

## 2. Score Distribution

| Statistic | Value |
|-----------|-------|
| Mean | 54.51 |
| Median | 53.77 |
| Max | 71.69 (RC-001 Khankar N.C.) |
| Min | 41.61 |
| Std Dev | 5.60 |

---

## 3. Data Sources

| Dataset | Source | Records | Purpose |
|---------|--------|---------|---------|
| Habitation Polygons | AIKOSH/SHRUG PC11 | 228 | Base geometry |
| Flood Exposure | NDEM Yearly Aggregate | 228 | Historical flood years |
| SRTM DEM 30m | NASA/USGS via OpenTopography | 3.24M pixels | Elevation/slope |
| OSM Roads | Overpass API | 16,957 ways | Road accessibility |
| Census Village Amenities | Census India 2011 | 216 villages | Facility scores |

---

## 4. Scoring Formula

```
Score = (Elevation x 0.25) + (Slope x 0.15) +
        (Road Access x 0.20) + (Amenities x 0.25) +
        (Proximity x 0.15)
```

### Factor Weights

| Factor | Weight | Max Points | Description |
|--------|--------|-----------|-------------|
| Elevation | 25% | 25 | Higher = safer from riverine flooding |
| Slope | 15% | 15 | Flatter = easier construction |
| Road Accessibility | 20% | 20 | Closer to major roads = better access |
| Amenities | 25% | 25 | More existing facilities = less new infrastructure |
| Proximity to Vulnerable | 15% | 15 | Closer to exposed populations = more useful |

---

## 5. Validation Results

| Check | Result |
|-------|--------|
| Production build | PASS (15.30s) |
| GeoJSON features | 76 |
| Unique candidate IDs | 76 |
| Duplicate IDs | 0 |
| No console errors | PASS |
| Map renders | PASS (Leaflet with OSM tiles) |
| Filters work | PASS (10 filter types) |
| Detail panel opens | PASS (slide-in from right) |
| Existing Flood MVP unchanged | PASS (no files modified) |
| GeoJSON copied to public | PASS |

---

## 6. Dashboard Features

### 6.1 Limitations Banner
- Always visible at top
- States: "Preliminary Relocation Suitability"
- Disclaimer: "NOT an official government classification or declaration of a safe relocation site"

### 6.2 KPI Cards
- Total Preliminary Candidates: 76
- High Suitability: 1 (>= 70)
- Medium Suitability: 59 (50-69)
- Low Suitability: 16 (30-49)

### 6.3 Interactive Map
- Leaflet map centered on Kamrup Metropolitan
- 76 CircleMarkers colored by suitability level
- Green = High, Yellow = Medium, Orange = Low
- Click marker to open detail panel
- Legend overlay
- Auto-fits to filtered candidates

### 6.4 Filters
- Search (name or candidate ID)
- Suitability level (All/High/Medium/Low)
- Score range (min/max)
- Elevation range (min/max in meters)
- Slope range (max in degrees)
- Road accessibility (max in km)
- Flood history (All/Never/1-2 years/3+ years)
- Clear All button

### 6.5 Detail Panel (Slide-in)
- Candidate ID and name
- Suitability score and level badge
- Basic info (elevation, slope, road access, population)
- Flood history (years exposed, max exposure %, frequency)
- Habitation proximity (nearest exposed, nearby vulnerable pop)
- Amenities score with progress bar
- Full score breakdown with bar visualization
- "Why this candidate?" section with factor-by-factor explanation
- Pending validation section

### 6.6 Charts
- Pie chart: Suitability distribution (High/Medium/Low)
- Bar chart: Score distribution across all candidates

### 6.7 Ranked Table
- Sortable columns (Rank, ID, Name, Score, Level, Elevation, Slope, Road, Amenities)
- Color-coded score and level badge
- Pagination (15 per page)
- Click row to open detail panel

### 6.8 Scoring Methodology
- Full formula display
- Factor descriptions with weights
- Data sources list
- Pipeline flow visualization

### 6.9 Pending Validation
- NRSC LULC 1:50K (pending)
- Water Bodies GIS (pending)
- GMDA Planning GIS (unavailable)
- Land Ownership (pending)

---

## 7. Files Changed

| File | Action | Lines |
|------|--------|-------|
| `frontend/public/data/preliminary_relocation_candidates.geojson` | Copied | 76 features |
| `frontend/src/data/relocationData.js` | Created | ~140 lines |
| `frontend/src/pages/RelocationSites.jsx` | Created | ~450 lines |
| `frontend/src/App.jsx` | Modified | +3 lines (import, nav item, route) |

**No existing files were modified or broken.**

---

## 8. Existing Flood MVP Verification

| Page | Status |
|------|--------|
| Overview (`/`) | UNCHANGED |
| Flood Map (`/map`) | UNCHANGED |
| Priority Analysis (`/priority`) | UNCHANGED |
| Historical Analysis (`/historical`) | UNCHANGED |
| Habitation Explorer (`/explorer`) | UNCHANGED |
| Methodology (`/methodology`) | UNCHANGED |
| Sidebar Navigation | UNCHANGED (Relocation Sites added) |
| Header | UNCHANGED |

---

## 9. Missing Datasets

| Dataset | Status | Impact |
|---------|--------|--------|
| NRSC LULC 1:50K | Pending | Cannot identify actual open/available land |
| Water Bodies GIS | Pending | Candidates may be adjacent to water bodies |
| GMDA Planning GIS | Unavailable | Cannot assess zone restrictions or Eco-Sensitive Zone |
| Land Ownership | Pending | Cannot confirm land availability or government/private status |

---

## 10. Limitations

1. All candidates are existing habitation areas, NOT unoccupied land
2. Historical non-exposure does NOT guarantee future flood safety
3. Census 2011 amenities data is 15 years old
4. No land-use classification (LULC) available
5. No water body exclusion applied
6. No GMDA zoning restrictions applied
7. No ground truth verification
8. Single flood source (NDEM) used for exclusion

---

## 11. Disclaimer

This dashboard displays **PRELIMINARY ANALYSIS ONLY**.

It is NOT:
- An official safety assessment
- A government-approved relocation plan
- A designation of any area as "safe" or "suitable"
- A substitute for ground-level verification

All results must be verified by:
- ASDMA (Assam State Disaster Management Authority)
- DDMA Kamrup Metropolitan
- GMDA (Guwahati Metropolitan Development Authority)
- Local revenue authorities

before any relocation action is taken.

---

*Validation completed August 30, 2026 using ResQMap frontend build pipeline.*
