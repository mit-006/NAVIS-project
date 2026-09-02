# GIS Geometry Data Requirement: Kamrup Metropolitan Village/Habitation Boundaries

## Purpose

This document defines the GIS geometry dataset required to spatially locate village/habitation records from the Census 2011 PCA-TV dataset for Kamrup Metropolitan District, Assam.

## What We Need

A geographic dataset containing **at minimum**:

| Field | Description | Required |
|-------|-------------|----------|
| Village/Habitation Name | Official name of the settlement | Yes |
| Village/Habitation Code | Unique Census or administrative code | Yes |
| District Name | Kamrup Metropolitan | Yes |
| District Code | Census/administrative district code | Yes |
| Sub-District Name | Administrative sub-district (tehsil/block) | Yes |
| Sub-District Code | Census/administrative sub-district code | Yes |
| Geometry | Village boundaries (polygons) OR reliable point coordinates (centroids) | Yes |
| CRS | Coordinate Reference System (must be documented) | Yes |

## Preferred Formats (in order)

1. **GeoJSON** — Ideal for web mapping with Leaflet/React-Leaflet
2. **GeoPackage (.gpkg)** — Modern, open standard, supports large datasets
3. **Shapefile (.shp)** — Widely supported, older format
4. **Other** — Only if source provides no alternative

## Ideal Join Key

To link Census population records to GIS geometry, we need a shared identifier:

| Priority | Join Key | Notes |
|----------|----------|-------|
| 1 | Census Village Code (`Town/Village` field) | Best match — official, unique, numeric |
| 2 | Sub-District Code + Village Name | Secondary option if codes are formatted differently |
| 3 | District Code + Sub-District Code + Village Name | Compound key |
| 4 | Village Name only | **Last resort only** — high risk of mismatches |

### Why Village-Name-Only Matching Is Risky

- Census records and GIS datasets may use **different spelling conventions** (e.g., "Pamehi" vs "Pamehee" vs "Pamei")
- Multiple villages in the same district may share the **same name**
- Names may appear in **different scripts** (Assamese/English) with varying transliterations
- Name formatting may differ (abbreviations, spaces, punctuation)
- Matching by name alone can produce **silent errors** — incorrect joins that appear valid but link wrong records

**Name-only matching should be avoided wherever possible.**

## Validation Requirements

Before adding any dataset to `data/raw/`, the research team must verify:

- [ ] Dataset covers **Kamrup Metropolitan District, Assam** (not other districts)
- [ ] Dataset contains **village-level** geometry (not just district/sub-district)
- [ ] Source is **official or authoritative** (Census of India, Survey of India, state revenue dept, or verified academic/GIS portal)
- [ ] Geometry is **valid** (no broken polygons, null geometries, or self-intersections)
- [ ] CRS is **known and documented** (e.g., EPSG:4326, EPSG:32646, EPSG:7755)
- [ ] Geographic identifiers are **inspectable** — we can cross-check codes against Census data
- [ ] Dataset is **not assumed** to be correct just because it is labeled "Assam" or "Kamrup"
- [ ] Dataset file size is reasonable for the prototype

## Acceptable Sources

| Source | Reliability | Notes |
|--------|-------------|-------|
| Census of India — Village/Town boundaries | High | Official Census GIS portal |
| Survey of India | High | National mapping agency |
| Assam State Remote Sensing Applications Centre | High | State authority |
| Bhuvan (ISRO) | High | National geo-portal |
| GADM (Global Administrative Areas) | Medium | Well-known, but may lack village-level detail for India |
| Academic/research repositories | Verify individually | Must be traceable to official source |

**Unacceptable**: Random GitHub repos, Kaggle datasets, or unverified blogs without source attribution.

## Join Key Compatibility with Census Data

The Census dataset at `data/raw/kamrup_metropolitan_pca_tv_2011.xlsx` contains these geographic identifier fields:

| Census Field | Type | Description | Example |
|--------------|------|-------------|---------|
| `State` | int64 | State code | 18 |
| `District` | int64 | District code | 322 |
| `Subdistt` | int64 | Sub-district code | 2127 |
| `Town/Village` | int64 | Town/Village code | 303398 |
| `Ward` | int64 | Ward code | 0 |
| `Level` | str | Geographic level | VILLAGE, TOWN, SUB-DISTRICT, DISTRICT, WARD |
| `Name` | str | Name | Pamehi, Azara, etc. |

The GIS dataset should ideally provide **matching codes** for at least:
- District code (`322` for Kamrup Metropolitan)
- Sub-district code (e.g., `2127` for Azara)
- Village/Town code (e.g., `303398`)

If the GIS dataset uses a different coding scheme, the research team must document the mapping between Census codes and GIS codes.

## Deliverables from Research Team

1. The GIS dataset file(s) in a standard format
2. Documentation of the source and how to access/verify it
3. Documentation of the CRS used
4. List of available geographic identifier fields
5. Assessment of which Census join keys are available in the GIS dataset
6. Any known limitations or data quality issues
