# Phase 3 — Download & Inspection Status Report

**Date**: August 30, 2026  
**Project**: ResQMap — Kamrup Metropolitan Disaster Management Platform  
**Status**: INSPECTION COMPLETE — Dashboard implementation NOT started

---

## Summary Table

| # | Dataset | Download | Coverage | CRS | Format | Kamrup Metro | Records | Usable | Problems | Next Action |
|---|---------|----------|----------|-----|--------|-------------|---------|--------|----------|-------------|
| 1 | **SRTM DEM 30m** | ✅ Complete | Global 60°N-56°S | EPSG:4326 | GeoTIFF (int16) | ✅ Full | 3.24M pixels | ✅ Yes | None | Derive slope, compute habitation elevations |
| 2 | **NRSC LULC 1:50K** | ⚠️ Blocked | Pan-India | EPSG:4326 | SHP/GeoTIFF | ✅ Yes | N/A | ⚠️ Manual | Bhuvan API returns 404 | User must download from Bhuvan portal |
| 3 | **OSM Roads** | ✅ Complete | Kamrup Metro bbox | EPSG:4326 | JSON (Overpass) | ✅ Full | 16,957 ways | ✅ Yes | Geofabrik blocked; used Overpass API | Extract geometries, compute road distances |
| 4 | **Water Bodies** | ⚠️ Blocked | Pan-India | N/A | XLSX/CSV | ✅ Yes | N/A | ⚠️ Manual | Bhuvan MI API returns 404 | User must download from Bhuvan/data.gov.in |
| 5 | **Census Village Amenities** | ✅ Complete | Kamrup Metro | N/A | XLSX | ✅ Full | 396 cols/village | ✅ Yes | SSL cert issue (worked with verify=False) | Filter to Kamrup Metro, extract key columns |
| 6 | **GMDA Master Plan** | ⚠️ Web only | 328 sq km GMA | N/A | Web/PDF | ✅ Yes | 9 zones | ⚠️ Info only | No GIS download available | Document as exclusion criteria |

---

## Detailed File Inventory

### Downloaded Files

| File | Size | Location |
|------|------|----------|
| N25E091.tif | 16.0 MB | `data/raw/relocation/srtm_dem/` |
| N25E092.tif | 16.4 MB | `data/raw/relocation/srtm_dem/` |
| N26E091.tif | 10.9 MB | `data/raw/relocation/srtm_dem/` |
| N26E092.tif | 9.9 MB | `data/raw/relocation/srtm_dem/` |
| kamrup_metro_srtm30m.tif | 2.2 MB | `data/raw/relocation/srtm_dem/` (clipped) |
| kamrup_metro_roads.json | ~5 MB | `data/raw/relocation/osm_roads/` |
| DH_PartXIIA_Village_KamrupMetro.xlsx | 46.2 MB | `data/raw/relocation/census_amenities/` |
| DH_PartXIIA_Town_KamrupMetro.xlsx | 0.5 MB | `data/raw/relocation/census_amenities/` |
| bbox.json | 108 B | `data/raw/relocation/` |

**Total downloaded**: ~107 MB

### Inspection Reports

| Report | Location |
|--------|----------|
| SRTM DEM | `data/inspection/phase3_srtm_dem_inspection.md` |
| NRSC LULC | `data/inspection/phase3_nrsc_lulc_inspection.md` |
| OSM Roads | `data/inspection/phase3_osm_roads_inspection.md` |
| Census Amenities | `data/inspection/phase3_census_amenities_inspection.md` |
| Water Bodies | `data/inspection/phase3_water_bodies_inspection.md` |
| GMDA | `data/inspection/phase3_gmda_inspection.md` |

---

## Key Findings Per Dataset

### 1. SRTM DEM 30m ✅
- **Elevation range**: 18m to 837m ASL
- **Median**: 60m — most of Kamrup Metro is low-lying
- **100% valid pixels** — no voids
- **Slope derivable** from this DEM
- **CRS**: EPSG:4326 — matches existing layers

### 2. NRSC LULC 1:50K ⚠️
- **Requires**: Browser registration at `bhuvan.nrsc.gov.in`
- **Resolution**: ~55m (LISS-III)
- **Classes**: 54 (Level-3), 7 Level-1 categories
- **Key classes**: Built-up, Agriculture, Wasteland, Water Body, Wetland

### 3. OSM Roads ✅
- **16,957 road ways** in Kamrup Metro
- **783 major roads** (primary + secondary + trunk)
- **14,271 residential roads**
- **Source**: Overpass API (Geofabrik was blocked)

### 4. Water Bodies ⚠️
- **Requires**: Browser access to Bhuvan MI portal
- **Assam stats**: 153,125 water bodies (97% ponds)
- **Flood-prone**: 18.1% in flood-prone areas

### 5. Census Village Amenities ✅
- **396 columns** per village — extremely comprehensive
- **Covers**: Education, Health, Water, Transport, Banking, Electricity, Land Use
- **Key fields**: School availability, PHC/CHC, drinking water source, bus service, electricity
- **Distance codes**: a=<5km, b=5-10km, c=10+km to nearest facility

### 6. GMDA Master Plan ⚠️
- **Eco-Sensitive Zone**: 26% of GMA — building-restricted
- **9 zones**: R, C, I, P, T, G, E, CU-I, CU-II
- **No GIS data** — web/PDF only
- **E zone boundary**: West of Gorchuk-Pamohi Road, south of NH bypass, up to Deepar Beel

---

## Datasets NOT Downloaded (Manual Action Required)

| Dataset | Reason | Where to Get |
|---------|--------|-------------|
| NRSC LULC 1:50K | Bhuvan requires browser registration | `bhuvan.nrsc.gov.in` → India Maps → Assam → LULC |
| Water Bodies Census | Bhuvan MI API returns 404 | `bhuvan-app1.nrsc.gov.in/mi/` or `data.gov.in` |
| GMDA GIS data | Web viewer only, no download | `onemapfmda.gmda.gov.in` (view only) |

---

## CRS Compatibility

| Dataset | CRS | Compatible with ResQMap? |
|---------|-----|-------------------------|
| SRTM DEM | EPSG:4326 | ✅ Yes |
| OSM Roads | EPSG:4326 | ✅ Yes |
| Census Amenities | N/A (tabular) | ✅ Join via Village Code |
| Habitation layer | EPSG:4326 | ✅ Reference layer |

---

## What This Report Does NOT Include

- ❌ No fake relocation sites
- ❌ No land availability claims
- ❌ No safety status assignments
- ❌ No shelter capacity estimates
- ❌ No dashboard code changes
- ❌ No processed/relocated data

---

## Next Steps (When User Approves)

1. **Process SRTM**: Derive slope raster, compute elevation at 228 habitation centroids
2. **Process OSM**: Extract road geometries, compute distance to nearest road per habitation
3. **Process Census**: Filter to Kamrup Metro, extract key infrastructure columns, join with habitation layer
4. **Create processed files**: `data/processed/kamrup_metro_srtm30m.tif`, `kamrup_metro_roads.geojson`, `kamrup_metro_amenities.csv`
5. **Then**: Build relocation suitability analysis (NOT dashboard yet — analysis scripts only)

---

*All downloads and inspections completed August 30, 2026.*
