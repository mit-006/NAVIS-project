# GIS Geometry Data Sources: Kamrup Metropolitan Village Boundaries

## A. Candidate Sources

### Source 1: National Water Data Portal (NWIC) — Village Boundary Dataset

| Field | Value |
|-------|-------|
| **Source/Organization** | Geological Survey of India (GSI), via National Water Informatics Centre (NWIC), Ministry of Jal Shakti, Government of India |
| **Dataset Name** | Village Boundary |
| **Geographic Coverage** | All India — state-wise village boundaries |
| **Kamrup Metropolitan Covered** | Assam state is listed; district-level filtering needed after download |
| **Village-Level Geometry** | Yes — village boundaries for entire Assam |
| **Geometry Type** | Polygon |
| **Geographic Identifiers** | Village name, district, state (attribute fields to be inspected) |
| **Census Village Code Available** | Unknown — requires download and inspection |
| **Formats Available** | KML, GeoJSON, SHP |
| **CRS** | To be verified upon download (likely EPSG:4326 for GeoJSON) |
| **Dataset Year** | 2025 (last update May 2, 2025) |
| **Downloadable** | Yes — direct download links available |
| **Licence/Usage** | Government of India open data (to be verified) |
| **Official URL** | https://nwdp.nwic.gov.in/dataset/village-boundary |
| **Download Links** | GeoJSON: `vb_soi_as_geojson.zip`, SHP: `vb_soi_as_shp.zip`, KML: `vb_soi_as.kmz` |

**Verification Status**: Assam village boundary files are listed and downloadable. District-level filtering required.

---

### Source 2: Survey of India (SOI) — Village Boundary Database

| Field | Value |
|-------|-------|
| **Source/Organization** | Survey of India, Government of India |
| **Dataset Name** | Village Boundary Data Base of Entire India |
| **Geographic Coverage** | All India — state-wise vector data |
| **Kamrup Metropolitan Covered** | **NO — Assam is NOT listed in the SOI download page** |
| **Village-Level Geometry** | N/A for Assam |
| **Formats Available** | Vector data (format unspecified on page) |
| **CRS** | Unknown |
| **Downloadable** | Yes for listed states; Assam not available |
| **Licence/Usage** | Government of India |
| **Official URL** | https://surveyofindia.gov.in/pages/village-boundary-data-base-of-entire-india |

**Verification Status**: **Assam is NOT in the list of 27 states/UTs provided by SOI.** This source cannot be used for Kamrup Metropolitan.

---

### Source 3: NYU/Stanford Spatial Data Repository — Villagemap India 2011

| Field | Value |
|-------|-------|
| **Source/Organization** | ML InfoMap (Firm), distributed via Stanford University Libraries |
| **Dataset Name** | Village Boundaries of Assam, India, 2011 |
| **Geographic Coverage** | Assam, India |
| **Kamrup Metropolitan Covered** | Yes — Assam state-wide village boundaries |
| **Village-Level Geometry** | Yes — polygon boundaries with PCA 2011 linked |
| **Geometry Type** | Polygon |
| **Geographic Identifiers** | Village name, census attributes from PCA 2011 |
| **Census Village Code Available** | Likely yes — linked to PCA 2011 |
| **Formats Available** | Shapefile |
| **CRS** | WGS84 for web display; native CRS for download |
| **Dataset Year** | 2011 (boundaries), issued 2014 |
| **Downloadable** | **RESTRICTED** — access rights: Restricted |
| **Licence/Usage** | Restricted — requires authentication or institutional access |
| **Official URL** | https://purl.stanford.edu/fd937zx4917 |

**Verification Status**: Dataset exists and covers Assam, but **access is restricted**. Not freely downloadable for open project use.

---

### Source 4: AIKOSH (India AI) — 2011 Census Village-Level Geometries

| Field | Value |
|-------|-------|
| **Source/Organization** | Development Data Lab, hosted on AIKOSH (Government of India AI platform) |
| **Dataset Name** | 2011 population census village-level geometries |
| **Geographic Coverage** | All India — village and town level |
| **Kamrup Metropolitan Covered** | Yes — India-wide dataset |
| **Village-Level Geometry** | Yes — polygon geometries for villages and towns |
| **Geometry Type** | Polygon |
| **Geographic Identifiers** | Census 2011 geographic identifiers |
| **Census Village Code Available** | Likely yes — based on 2011 Census identifiers |
| **Formats Available** | Shapefile (village_modified.shp + .dbf, .prj, .shx) |
| **CRS** | To be verified from .prj file |
| **Dataset Year** | 2011 Census boundaries |
| **Downloadable** | Yes — requires registration on AIKOSH |
| **Licence/Usage** | CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike) |
| **Data Quality Score** | 2.5/5 (Data Quality & Integrity), 2.1/5 (Consistency & Usability), 4.3/5 (Maintenance & Documentation) |
| **File Size** | ~918 MB (full India) |
| **Official URL** | https://aikosh.indiaai.gov.in/home/datasets/details/2011_population_census_village_level_geometries.html |
| **Notes** | Some minor positional errors (~1 km) may exist due to complexity of Indian village maps |

**Verification Status**: India-wide dataset available. Registration required. CC BY-NC-SA licence may have commercial use restrictions.

---

### Source 5: Data{meet} — Indian Village Boundaries

| Field | Value |
|-------|-------|
| **Source/Organization** | Data{meet} community (open data community) |
| **Dataset Name** | Indian Village Boundaries (Maps) |
| **Geographic Coverage** | All India — state-wise |
| **Kamrup Metropolitan Covered** | **NO — Assam is NOT listed in the download table** |
| **Available States** | Bihar, Karnataka, Kerala, Goa, Gujarat, Maharashtra, Sikkim, Odisha |
| **Formats Available** | GeoJSON (WGS84, EPSG:4326) |
| **Licence** | ODbL (Open Database License) |
| **Official URL** | https://projects.datameet.org/indian_village_boundaries/ |

**Verification Status**: **Assam is NOT available** in this project. Cannot be used.

---

### Source 6: India Geodata (GitHub) — Census 2011 Village Boundaries

| Field | Value |
|-------|-------|
| **Source/Organization** | Compiled from LGD, Survey of India, Bhuvan, DataMeet |
| **Dataset Name** | Census 2011 Village Boundaries |
| **Geographic Coverage** | All India |
| **Kamrup Metropolitan Covered** | Yes — India-wide |
| **Village-Level Geometry** | Yes |
| **Formats Available** | Parquet, GeoJSONL, PMTiles, Shapefile |
| **Licence** | CC0-1.0 / CC-BY-4.0 |
| **File Size** | ~28 MB (parquet), ~87 MB (pmtiles) |
| **Official URL** | https://github.com/yashveeeeeeer/indian-geodata/tree/main/data/census/census-2011 |

**Verification Status**: Available. Multiple formats. Open licence. Requires inspection for Assam coverage and Census code availability.

---

### Source 7: NeSDR — North Eastern Spatial Data Repository

| Field | Value |
|-------|-------|
| **Source/Organization** | North Eastern Space Applications Centre (NESAC), Government of India |
| **Dataset Name** | Assam Village Boundary |
| **Geographic Coverage** | Assam |
| **Kamrup Metropolitan Covered** | Yes — Assam state |
| **Formats Available** | OGC WMS/WMTS web services |
| **Licence** | Government data |
| **Official URL** | https://www.nesdr.gov.in/dataset/assam-village-boundary |

**Verification Status**: Available as web services. Downloadable format unclear. Requires further investigation.

---

### Source 8: Assam State GIS Hub

| Field | Value |
|-------|-------|
| **Source/Organization** | Assam Space Applications Center, Government of Assam |
| **Dataset Name** | Assam Geographic Information System |
| **Geographic Coverage** | Assam |
| **Kamrup Metropolitan Covered** | Likely yes |
| **Formats Available** | Unknown — portal-based |
| **Licence** | Government data |
| **Official URL** | https://assam-state-gis-esriindia1.hub.arcgis.com/ |

**Verification Status**: Official state portal. Village-level data availability unclear. Portal login may be required.

---

## B. Verification Evidence Summary

| Source | Assam Listed | Village-Level | Downloadable | Free Access | Census Codes |
|--------|-------------|---------------|--------------|-------------|--------------|
| NWIC (GSI) | Yes | Yes | Yes | Yes | Unknown |
| SOI | **No** | N/A | N/A | N/A | N/A |
| NYU/Stanford | Yes | Yes | **Restricted** | **No** | Likely |
| AIKOSH | Yes (India-wide) | Yes | Yes (registration) | Yes (CC BY-NC-SA) | Likely |
| Data{meet} | **No** | N/A | N/A | N/A | N/A |
| India Geodata | Yes (India-wide) | Yes | Yes | Yes | Unknown |
| NeSDR | Yes | Unclear | Web services | Yes | Unknown |
| Assam State GIS | Likely | Unclear | Portal | Yes | Unknown |

## C. Dataset Properties Comparison

| Property | NWIC (GSI) | AIKOSH | India Geodata |
|----------|-----------|--------|---------------|
| Geometry type | Polygon | Polygon | Polygon |
| Format | GeoJSON, SHP, KML | Shapefile | Parquet, GeoJSONL, SHP |
| CRS | TBD | TBD | TBD |
| File size | TBD | ~918 MB (India) | ~28-87 MB (India) |
| Licence | Govt open data | CC BY-NC-SA 4.0 | CC0-1.0 / CC-BY-4.0 |
| Quality notes | Official GSI source | ~1 km positional error possible | Compiled from multiple sources |

## D. Join-Key Analysis

### Census Dataset Fields (for joining)

| Census Field | Type | Example | Description |
|--------------|------|---------|-------------|
| `District` | int64 | 322 | District code |
| `Subdistt` | int64 | 2127 | Sub-district code |
| `Town/Village` | int64 | 303398 | Village/Town code |
| `Name` | str | Pamehi | Village name |
| `Level` | str | VILLAGE | Geographic level |

### GIS Dataset Join-Key Requirements

To link Census population to GIS geometry, the GIS dataset must provide **at least one** of:

1. **Census Village Code** (`Town/Village` equivalent) — best match
2. **Sub-district code + village name** — secondary option
3. **District code + sub-district code + village name** — compound key
4. **Village name only** — last resort (high error risk)

### Join-Key Availability by Source

| Source | Census Village Code | Village Name | District/Sub-district |
|--------|-------------------|--------------|----------------------|
| NWIC (GSI) | Requires inspection | Likely yes | Likely yes |
| AIKOSH | Likely (2011 Census based) | Yes | Likely yes |
| India Geodata | Unknown | Unknown | Unknown |
| NYU/Stanford | Likely (PCA 2011 linked) | Yes | Yes |

## E. Recommended Source

**BEST SOURCE: National Water Data Portal (NWIC) — Village Boundary Dataset**

| Field | Value |
|-------|-------|
| **Why** | Official Government of India source (GSI/NWIC), freely downloadable, available in GeoJSON format (ideal for ResQMap frontend), Assam village boundaries confirmed available, updated (May 2025) |
| **Join Key** | Requires inspection of attribute fields for Census code or village name |
| **Format** | GeoJSON (preferred), SHP, KML |
| **Coverage** | Assam state-wide — filter to Kamrup Metropolitan after download |
| **Limitations** | Census village code availability unknown until inspected; district-level filtering needed |

## F. Backup Source

**BACKUP SOURCE: AIKOSH — 2011 Census Village-Level Geometries**

| Field | Value |
|-------|-------|
| **Why** | Based directly on 2011 Census geographic identifiers, India-wide coverage, polygon geometry, CC BY-NC-SA licence |
| **Join Key** | Likely has Census 2011 codes (requires inspection) |
| **Format** | Shapefile |
| **Coverage** | All India — filter to Kamrup Metropolitan |
| **Limitations** | ~1 km positional error possible; CC BY-NC-SA restricts commercial use; ~918 MB file size; registration required |

## G. Risks and Limitations

1. **Join-Key Uncertainty**: No source has been inspected yet to confirm that Census village code (`Town/Village`) is present as an attribute. This must be verified after download.

2. **Positional Accuracy**: Village boundary polygons may have positional errors (AIKOSH notes ~1 km possible). Acceptable for district-level risk mapping but not for precise site-level assessment.

3. **Coverage Gaps**: SOI and Data{meet} do not cover Assam. NWIC is the only confirmed government source with Assam village boundaries freely available.

4. **CRS Unknown**: Coordinate reference system must be verified after download and possibly reprojected to EPSG:4326 for web mapping.

5. **District Filtering**: All sources provide state-level data. Kamrup Metropolitan (District code 322) must be filtered after download.

6. **Attribute Inspection Required**: The actual attribute schema of each dataset must be inspected to determine which join key is available.

7. **Licence Restrictions**: AIKOSH uses CC BY-NC-SA which restricts commercial use. NWIC (Government data) and India Geodata (CC0/CC-BY) have more permissive licences.

## H. Research Team Checklist Before Adding to data/raw/

- [ ] Download NWIC Assam village boundary (GeoJSON or SHP)
- [ ] Inspect attribute fields for Census village code availability
- [ ] Verify CRS of the downloaded dataset
- [ ] Filter to Kamrup Metropolitan District (code 322)
- [ ] Validate geometry (no broken polygons, null geometries)
- [ ] Cross-check village names/count against Census dataset
- [ ] Document any missing join keys
- [ ] If NWIC fails, download AIKOSH dataset as backup
- [ ] Compare join success rate between NWIC and AIKOSH if both downloaded
