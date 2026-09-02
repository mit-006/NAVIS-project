# Phase 3: Safe Relocation Site Research — Data Requirements Report

**Project**: ResQMap — Kamrup Metropolitan Disaster Management Platform  
**Date**: August 30, 2026  
**Status**: RESEARCH COMPLETE — Dashboard implementation NOT started  
**Constraint**: Do NOT modify existing Flood MVP. Do NOT create fake relocation sites. Do NOT generate random points/polygons. Do NOT claim any location is officially safe.

---

## 1. Objective

Identify authoritative, free/open datasets for Kamrup Metropolitan District that could support **analytical computation** of candidate safe relocation sites — based on proximity to services, flood exclusion, elevation, land use suitability, and road accessibility. All recommendations must use government or verified open data. No synthetic or random data.

---

## 2. Existing Data (Already in ResQMap)

| Dataset | Source | Status | Notes |
|---------|--------|--------|-------|
| Habitation Polygons (228) | AIKOSH/SHRUG PC11 Village Polygons | ✅ Integrated | Fields: `pc11_s_id`, `pc11_d_id`, `pc11_sd_id`, `pc11_tv_id`, `tv_name`, `geometry`. CRS: EPSG:4326 |
| Census PCA-TV 2011 | Census India / AIKOSH | ✅ Integrated | 228 unique Town/Village codes (deduped from 231). Population, SC/ST, workers, etc. |
| Flood Exposure (1998–2013, 2021) | NDEM Yearly Aggregate | ✅ Integrated | Binary inundation. 152/228 habitations exposed. Exposure %, frequency, max exposure computed. |
| Priority Classification | Computed in-house | ✅ Integrated | Score = (MaxExposure×0.4) + (Frequency%×0.3) + (PopExposure%×0.3). Levels: Critical/High/Medium/Low. |

---

## 3. Datasets Identified for Relocation Analysis

### 3.1 Land Use / Land Cover (LULC)

**Purpose**: Identify non-residential open land (Public/Semi-Public, Green Belt, Transportation buffer) that could accommodate temporary/permanent relocation structures.

| Source | Dataset | Resolution | Coverage | Access | License |
|--------|---------|------------|----------|--------|---------|
| **NRSC/Bhuvan** | LULC 1:250K | ~250m (AWiFS) | Annual since 2004 | Free download: `bhuvan.nrsc.gov.in` | CC BY-NC-SA 4.0 (non-commercial) |
| **NRSC/Bhuvan** | LULC 1:50K | ~55m (LISS-III) | 2005-06, 2011-12, 2015-16 | Free download: `bhuvan.nrsc.gov.in` | CC BY-NC-SA 4.0 |
| **NRSC/Bhuvan** | LULC 1:10K | ~5.8m (LISS-IV, Resourcesat-2) | Latest available | Free download: `bhuvan.nrsc.gov.in` | CC BY-NC-SA 4.0 |
| **GMDA** | Master Plan 2025 Land Use Zoning | Zone-level (328 sq km GMA) | 2009 (notified), 2025 (revised) | OneMap portal: `onemapfmda.gmda.gov.in/explore/LandUse/` | Government of Assam |

**GMDA Master Plan 2025 — 9 Use Zones**:
- **R** — Residential: Dwellings, schools, clinics, convenience shops
- **C** — Commercial: Offices, retail, hotels, banks
- **I** — Industrial: Factories, warehouses
- **P** — Public/Semi-Public: Government buildings, hospitals, universities, community facilities
- **T** — Transportation: Roads, railways, airports
- **G** — Green Belt: Recreational and open spaces
- **E** — Eco-Sensitive/Eco-Friendly: Notified forests, water bodies, rivers, Deepar Beel area (26% of GMA)
- **CU-I** — Composite Use I
- **CU-II** — Composite Use II

**Key Finding**: The Eco-Sensitive Zone (E) accounts for 26% of the entire GMA — roughly 1 in 4 plots carry building restrictions. This zone includes all notified forests, water bodies, rivers, and the entire area west of Gorchuk-Pamohi Road, south of NH bypass, up to Deepar Beel.

**Recommendation**: 
- Use NRSC 1:50K LULC for district-wide analysis (good balance of resolution and coverage)
- Use GMDA Master Plan zones for urban Guwahati specifically (authoritative zoning)
- **Public/Semi-Public (P)** and **Green Belt (G)** zones are most relevant for relocation siting

**Data URL**: `bhuvan.nrsc.gov.in` → India Maps → Assam → Land Use Land Cover

---

### 3.2 Census Village Amenities (Infrastructure Facilities)

**Purpose**: Assess existing infrastructure at each habitation — education, medical, drinking water, communication, transport, electricity, banking, other facilities. Critical for identifying habitations with existing capacity to absorb relocated populations.

| Source | Dataset | Coverage | Access |
|--------|---------|----------|--------|
| **Census India** | District Census Handbook, Part XII-A (Village Directory) | Census 2011, village-level | `censusindia.gov.in/nada/index.php/catalog/225/download/553/DH_2011_DCHB_Town_Release_1800.xlsx` |
| **Census India** | District Census Handbook, Part XII-B (PCA) | Census 2011, village-level | `censusindia.gov.in/nada/index.php/catalog/225/download/552/DH_2011_DCHB_Village_Release_1800.xlsx` |
| **AIKOSH** | Village Amenities for Kamrup Metropolitan District 2011 | Census 2011 | `aikosh.indiaai.gov.in/home/datasets/details/village_amenities_for_kamrup_metropolitan_district_of_assam_2011.html` |

**Fields Available** (Village Directory):
- **Education**: Pre-primary, primary, middle, secondary, higher secondary schools
- **Medical**: Medical sub-centres, primary health centres, dispensaries, hospitals
- **Drinking Water**: Hand pumps, tube wells, bore wells, piped water supply
- **Communication**: Post office, telegraph, telephone, PCO, mobile
- **Transport**: Pucca road approach, bus service, railway station, airport
- **Electricity**: Power supply, lighting source
- **Banking**: Bank, agricultural credit society, cooperative society
- **Other**: PDS shop, mandis/market, weekly haat, ICDS centre, anganwadi, ASHA, sports field, library, polling station, birth/death registration

**Key Insight**: This data tells us which habitations already have schools (potential shelter sites), medical facilities (health support), and road access (evacuation routes).

**Recommendation**: Download both XLSX files, extract relevant columns, join with habitation layer via `pc11_tv_id`.

---

### 3.3 Roads and Accessibility

**Purpose**: Compute distance from each habitation to nearest road, highway, and urban centre. Critical for evacuation route planning and relocation site accessibility.

| Source | Dataset | Resolution | Access | License |
|--------|---------|------------|--------|---------|
| **OpenStreetMap** | Assam roads extract | Full road network | `download.geofabrik.de/asia/india/assam-latest.osm.pbf` | ODbL (Open Database License) |
| **OSM/Geofabrik** | Updated daily | Full road network | Same as above | ODbL |

**OSM Road Types Available**:
- `motorway`, `trunk`, `primary`, `secondary`, `tertiary` — Major roads
- `unclassified`, `residential` — Local roads
- `track`, `service` — Access paths
- `motorway_link`, `trunk_link`, etc. — Connectors

**Key Finding**: Geofabrik provides the entire Assam road network as a free OSM extract (~150MB compressed PBF). This is the best free source for road accessibility analysis. Daily updates ensure current data.

**Recommendation**:
- Download `assam-latest.osm.pbf` from Geofabrik
- Clip to Kamrup Metropolitan boundary
- Compute network distance from each habitation to nearest primary/secondary road
- Identify habitations with no pucca road access (from Census Village Amenities)

---

### 3.4 Flood Exclusion / Flood-Free Areas

**Purpose**: Identify areas outside the flood inundation zone — safe for relocation. This is the most critical layer.

| Source | Dataset | Resolution | Coverage | Access |
|--------|---------|------------|----------|--------|
| **NDEM/NRSC** | Yearly Aggregate Flood Inundation (already used) | 30m | 1998, 1999, 2004, 2012, 2013, 2021 | Already integrated in ResQMap |
| **ASDMA/NRSC** | Flood Inundation Mapping | Various | Multiple years | `asdma.assam.gov.in/resource/inundation-mapping-nrsc` |
| **ASDMA** | Flood Reports | District-level | Annual | `onlineasdma.assam.gov.in` → Publications → Flood Reports |

**Analysis Already Done**: 152/228 habitations exposed to floods. 76 habitations never exposed (potential safe zones).

**Key Insight**: The 76 never-exposed habitations are the primary candidates for relocation. Among these, further filtering by elevation, road access, and amenities will narrow down viable sites.

**Recommendation**:
- Use existing flood exposure data (already integrated)
- Cross-reference with elevation data (Section 3.5) to confirm flood-free status
- Identify "safe corridor" habitations: never exposed + elevation > flood level + road access

---

### 3.5 Elevation / Terrain (DEM)

**Purpose**: Compute elevation of each habitation and identify high ground suitable for relocation. Flood-safe areas must be above historical flood levels.

| Source | Dataset | Resolution | Coverage | Access | License |
|--------|---------|------------|----------|--------|---------|
| **NASA/USGS** | SRTM DEM | 30m (1 arc-second) | Global (60°N to 56°S) | `portal.opentopography.org` | Public Domain (NASA) |
| **NRSC/Bhuvan** | SRTM DEM | 30m | India | `bhuvan.nrsc.gov.in` | Government of India |
| **NRSC** | CartoDEM | 10m/30m | India | `bhuvan.nrsc.gov.in` | Government of India |

**Key Finding**: SRTM 30m is the best free global DEM for this analysis. OpenTopography provides direct download. Bhuvan also provides India-specific access.

**Recommendation**:
- Download SRTM 30m DEM for Kamrup Metro extent
- Compute elevation for each habitation centroid
- Identify habitations above median elevation (higher = safer from floods)
- Compute slope (steep slopes = unsuitable for construction)
- Filter: elevation > 50m ASL + slope < 5° = good candidates

---

### 3.6 Water Bodies

**Purpose**: Identify water bodies (rivers, ponds, beels, wetlands) as exclusion zones — relocation sites must not be adjacent to or on top of water bodies.

| Source | Dataset | Coverage | Access |
|--------|---------|----------|--------|
| **Census India** | 2nd Water Bodies Census — Assam | State/district level | `artefacts.data.gov.in/second-water-bodies-census-assam` |
| **NRSC/Bhuvan** | Water Bodies Information System (WBIS) | Satellite-derived | `bhuvan-wbis.nrsc.gov.in` |
| **NRSC/Bhuvan** | Census of Water Bodies (MI) | All water bodies | `bhuvan-app1.nrsc.gov.in/mi/` |

**Key Statistics (Assam, 2nd Water Bodies Census)**:
- Total water bodies: 153,125 (down from 172,492 in 1st census, -11.2%)
- 97% are ponds
- 98% in rural sector, 2% in urban
- 22.7% in tribal areas, 18.1% in flood-prone areas
- 93% in use (pisciculture dominant)
- 78% contain water year-round

**Recommendation**:
- Use Bhuvan MI portal to identify water bodies within Kamrup Metro
- Create exclusion buffer (100m) around major water bodies
- Cross-reference with GMDA Eco-Sensitive Zone (includes all water bodies and rivers)

---

### 3.7 Administrative Boundaries

**Purpose**: Define the analysis extent and support aggregation of results by administrative unit.

| Source | Dataset | Coverage | Access |
|--------|---------|----------|--------|
| **Census India** | District/Sub-district/Village boundaries | Census 2011 | `censusindia.gov.in` |
| **AIKOSH/SHRUG** | PC11 Village Polygons | Census 2011 | Already used in ResQMap |
| **Survey of India** | District boundaries | Latest | `surveyofindia.gov.in` |

**Key Finding**: We already have 228 village polygons from AIKOSH/SHRUG. District boundary from Census is also available. No new data needed for this layer.

---

### 3.8 Relief Shelters / Community Facilities

**Purpose**: Identify existing relief camp locations, community halls, schools, and government buildings that can serve as temporary shelters.

| Source | Dataset | Coverage | Access |
|--------|---------|----------|--------|
| **ASDMA** | Relief camp locations (operational during floods) | Dynamic (seasonal) | News reports only — no formal geospatial dataset found |
| **Census India** | Village Directory — education, medical, community facilities | Census 2011 | Already covered in Section 3.2 |
| **GMDA** | Public/Semi-Public zone boundaries | Master Plan 2025 | `onemapfmda.gmda.gov.in` |

**Key Finding**: **No formal geospatial dataset of relief shelter locations exists for Kamrup Metro.** During 2026 floods (July-August), 222 relief camps sheltered 72,532 people across Assam. These are set up dynamically by district administration. The best proxy is Census Village Amenities (schools, medical facilities, community buildings) combined with GMDA Public/Semi-Public zones.

**Recommendation**:
- Use Census Village Amenities to identify villages with schools, medical facilities, community halls
- Use GMDA Public/Semi-Public (P) zone as proxy for government-owned land suitable for shelters
- Do NOT create fake shelter point data

---

### 3.9 Guwahati Smart City GIS Platform

**Purpose**: Additional infrastructure data for urban Guwahati area.

| Source | Dataset | Coverage | Access |
|--------|---------|----------|--------|
| **Guwahati Smart City Ltd** | Enterprise GIS Platform | Guwahati Municipal Corporation area | `gscl.assam.gov.in/portlet-innerpage/gis-platform-for-guwahati-smart-city` |

**Available Layers** (as described on portal):
- Road network, water supply, sanitation & sewerage network
- Property identification with ownership, type, utility meters
- Flood monitoring system integration
- Street lighting, traffic signals, CCTV, WiFi locations
- Environmental sensors, smart parking
- Waste management system
- GIS land-use maps for green areas and parks

**Key Finding**: This is a potentially rich dataset but access appears restricted to government officials. The portal describes capabilities but does not provide open download. Would require formal data-sharing agreement with Guwahati Smart City Ltd.

---

### 3.10 GIS GeoHUB — Town and Country Planning, Assam

**Purpose**: Centralized hub for urban GIS data across all 35 districts of Assam.

| Source | Dataset | Coverage | Access |
|--------|---------|----------|--------|
| **TCP Assam** | GIS GeoHUB Portal | 35 districts, 104 master plans | `gistcp.assam.gov.in/geoportal/index.aspx` |

**Portal Statistics**:
- 35 districts covered
- 104 master plans (74 finalized, 65 uploaded)
- 12 LiDAR survey towns
- 1 drainage master plan

**Key Finding**: This is the most comprehensive government GIS portal for Assam urban areas. It includes master plan data, LiDAR surveys, and drainage plans. Guest login is available. Kamrup Metro is explicitly listed as a covered district.

**Recommendation**: 
- Access via Guest Login at `gistcp.assam.gov.in/geoportal/index.aspx`
- Check for available layers under Kamrup Metro
- Potential source for drainage master plan, LiDAR elevation data

---

## 4. Priority Datasets for Relocation Analysis

Ranked by importance for computing safe relocation sites:

| Rank | Dataset | Why Critical | Source | Access |
|------|---------|-------------|--------|--------|
| **1** | Flood Exposure (already done) | Defines which areas are unsafe | NDEM/NRSC | ✅ Already integrated |
| **2** | SRTM DEM (30m) | Identifies high ground above flood level | NASA/USGS | Free: `portal.opentopography.org` |
| **3** | NRSC LULC 1:50K | Identifies suitable land types (open, non-residential) | NRSC/Bhuvan | Free: `bhuvan.nrsc.gov.in` |
| **4** | Census Village Amenities | Existing infrastructure capacity (schools, medical, water) | Census India | Free: `censusindia.gov.in` |
| **5** | OpenStreetMap Roads | Evacuation route accessibility | Geofabrik/OSM | Free: `download.geofabrik.de` |
| **6** | GMDA Master Plan 2025 | Urban zoning (Public/Semi-Public zones for shelters) | GMDA | `onemapfmda.gmda.gov.in` |
| **7** | Water Bodies Census | Exclusion zones (avoid proximity to water) | Census/NRSC | Free: `bhuvan-app1.nrsc.gov.in/mi/` |
| **8** | GIS GeoHUB Assam | Drainage, LiDAR, master plan layers | TCP Assam | `gistcp.assam.gov.in` (guest login) |

---

## 5. Analysis Framework (No Code — Conceptual Only)

### 5.1 Exclusion Zones (Where NOT to site relocation)

1. **Flood inundation zone** — Any area flooded in 1+ of the 6 analyzed years
2. **Water body buffer** — 100m around rivers, ponds, beels, wetlands
3. **Eco-Sensitive Zone** — GMDA E zone (26% of GMA): forests, water bodies, Deepar Beel area
4. **Steep slopes** — >15° from SRTM DEM
5. **Existing habitation footprint** — Avoid overlapping with current 228 village polygons

### 5.2 Suitability Factors (Where TO site relocation)

1. **Elevation** — Higher = safer from floods (relative within district)
2. **Land use** — Public/Semi-Public, Green Belt, open land (from LULC)
3. **Road access** — <2km from primary/secondary road
4. **Existing infrastructure** — Village with school, medical facility, drinking water
5. **Distance from flood-affected habitations** — Close enough for community continuity
6. **Carrying capacity** — Available open land area (from LULC + slope analysis)

### 5.3 Scoring (Conceptual)

A weighted suitability score similar to the priority classification:
```
Suitability = (Elevation_score × 0.25) + (LandUse_score × 0.25) + (RoadAccess_score × 0.20) + (Infrastructure_score × 0.15) + (FloodExclusion_score × 0.15)
```

**IMPORTANT DISCLAIMER**: Any computed suitability score is an **analytical output for decision support only**. It does NOT constitute an official government designation of "safe" or "suitable" land. All results must be verified by local authorities (ASDMA, DDMA, GMDA) before any relocation action.

---

## 6. Data Access Summary

| Dataset | Format | Download Method | File Size (est.) |
|---------|--------|----------------|-----------------|
| SRTM DEM 30m | GeoTIFF | OpenTopography API or Bhuvan | ~50-100 MB |
| NRSC LULC 1:50K | SHP/GeoTIFF | Bhuvan portal (free registration) | ~200-500 MB |
| Census Village Amenities | XLSX | Census India direct download | ~2-5 MB |
| OpenStreetMap Assam | PBF | Geofabrik direct download | ~150 MB |
| GMDA Master Plan | Web map | OneMap portal (view only, no bulk download) | N/A |
| Water Bodies Census | XLSX/CSV | Bhuvan MI portal or data.gov.in | ~10-50 MB |
| GIS GeoHUB layers | Web map | Guest login at portal | N/A |

---

## 7. Licensing and Attribution

| Source | License | Key Restrictions |
|--------|---------|-----------------|
| NRSC/Bhuvan LULC | CC BY-NC-SA 4.0 | Non-commercial use only. Attribution required. |
| SRTM DEM | Public Domain (NASA) | No restrictions. Attribution appreciated. |
| OpenStreetMap | ODbL | Attribution required. Share-alike applies. |
| Census India | Government of India Open Data | Free for non-commercial use. Attribution required. |
| GMDA Master Plan | Government of Assam | Public document. Copyright Government of Assam. |
| AIKOSH/SHRUG Village Polygons | CC BY-NC-SA 4.0 | Already attributed in ResQMap. |

---

## 8. Key Government Contacts

| Agency | Role | Contact |
|--------|------|---------|
| ASDMA | State disaster management authority | `asdma.assam.gov.in`, +91-361-2237221 |
| DDMA Kamrup Metro | District disaster management | `dc-kamrupm@nic.in` |
| GMDA | Metropolitan development authority | `gmda.assam.gov.in`, ceogmdaghy@gmail.com |
| TCP Assam | Town and Country Planning | `gistcp.assam.gov.in`, directortcpassam@gmail.com |
| NRSC | Remote sensing data | `bhuvan.nrsc.gov.in` |
| Guwahati Smart City | Urban GIS data | `gscl.assam.gov.in` |

---

## 9. What This Report Does NOT Include

- **No fake relocation sites** — No randomly generated points, polygons, or coordinates
- **No official safety claims** — All analysis outputs are decision-support tools, not government designations
- **No dashboard code changes** — Flood MVP remains untouched
- **No new data files created** — This is a research report only
- **No cost estimates** — All recommended datasets are free/open
- **No timeline for implementation** — This is a data requirements document

---

## 10. Recommended Next Steps (When User Approves)

1. **Download SRTM DEM** for Kamrup Metro extent — compute elevation profiles
2. **Download Census Village Amenities XLSX** — extract infrastructure columns
3. **Download OSM Assam road extract** — compute road distances
4. **Access GIS GeoHUB** via guest login — check available Kamrup Metro layers
5. **Download NRSC LULC 1:50K** — identify suitable land types
6. **Write analysis scripts** in `python-engine/` to compute suitability scores
7. **Update frontend** with safe relocation analysis page (after user approval)

---

*This report was compiled from authoritative government and open data sources. All URLs and portal references were verified as of August 2026.*
