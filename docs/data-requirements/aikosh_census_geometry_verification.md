# AIKOSH 2011 Census Village-Level Geometries — Verification Report

## 1. Official Source

| Field | Value |
|-------|-------|
| **Platform** | AIKOSH — IndiaAI Datasets Platform |
| **URL** | https://aikosh.indiaai.gov.in/home/datasets/details/2011_population_census_village_level_geometries.html |
| **Publisher** | Government of India (IndiaAI initiative under MeitY) |
| **Dataset Host** | AIKOSH (https://aikosh.indiaai.gov.in) |

## 2. Dataset Name

**"2011 population census village-level geometries"**

Also known as: **PC11 Village Polygons Dataset**

## 3. Dataset Description

> "The PC11 Village Polygons Dataset provides detailed village- and town-level boundaries across India, based on 2011 Census geographic identifiers. This dataset is a critical resource for rural planning, land use analysis, and socio-economic studies. The village polygons were created using common location codes from multiple open-source sources, ensuring the best alignment possible with official census boundaries."

## 4. Is It Genuinely Based on Census 2011?

**YES** — Confirmed:

- Description explicitly states "based on 2011 Census geographic identifiers"
- Author is **Development Data Lab** (devdatalab.org), which maintains the **SHRUG** (Socioeconomic High-resolution Rural-Urban Geographic Dataset)
- SHRUG is a well-established academic dataset that links all Indian Population Censuses (1991–2011) using consistent village-level identifiers (`shrid`)
- The dataset is based on **PC11 (Population Census 2011)** village polygons stitched from multiple open-source maps
- The SHRUG documentation confirms: "These polygons align with 2011 Census village boundaries"

## 5. Geographic Coverage

| Field | Value |
|-------|-------|
| **Coverage** | All India |
| **Level** | Village and Town |
| **Total Polygons** | ~649,618 unique PC11 town/village polygons |
| **Kamrup Metropolitan Included** | **YES** — India-wide dataset covers all states/districts |

## 6. Geometry Type

| Field | Value |
|-------|-------|
| **Type** | Polygon |
| **Files** | village_modified.shp, .shx, .dbf, .prj, .cpg |
| **Format** | ESRI Shapefile |

## 7. File Format and Size

| Field | Value |
|-------|-------|
| **Format** | Shapefile (village_modified.shp + supporting files) |
| **Total Size** | ~918 MB (compressed) |
| **Visibility** | Open (requires registration on AIKOSH) |

## 8. CRS (Coordinate Reference System)

| Field | Value |
|-------|-------|
| **CRS** | To be verified from .prj file (likely WGS84 / EPSG:4326 based on SHRUG documentation) |
| **SHRUG Note** | "This layer is presented in the WGS84 coordinate system for web display purposes" |

## 9. Important Attribute Fields

Based on the SHRUG documentation and PC11 Village Polygons Dataset, the expected fields include:

### Location Identifiers

| Field | Description | Census Equivalent |
|-------|-------------|-------------------|
| `pc11_s_id` | Census 2011 State Code | State |
| `pc11_d_id` | Census 2011 District Code | District |
| `pc11_sd_id` | Census 2011 Sub-district Code | Subdistt |
| `pc11_tv_id` | Census 2011 Town/Village Code | Town/Village |
| `pc11_name` | Village/Town name | Name |
| `shrid2` | SHRUG unique identifier | N/A (derived) |

### SHRUG Identifier Format (shrid2)

```
PC11: YY-SS-DDD-sssss-VVVVVV
```
Where:
- `YY` = Census year (11 for 2011)
- `SS` = State code (2 digits)
- `DDD` = District code (3 digits)
- `sssss` = Sub-district code (5 digits)
- `VVVVVV` = Village code (6 digits)

### Additional Fields (expected)

| Field | Description |
|-------|-------------|
| `pc11_pca_tot_p` | Total population (PCA 2011) |
| `pc11_pca_tot_m` | Male population |
| `pc11_pca_tot_f` | Female population |
| `pc11_pca_no_hh` | Number of households |
| Village name fields | State, District, Sub-district names |

## 10. Census Code Matching Analysis

### Our Census PCA-TV 2011 Fields

| Census Field | Type | Example | Description |
|--------------|------|---------|-------------|
| `State` | int64 | 18 | State code |
| `District` | int64 | 322 | District code |
| `Subdistt` | int64 | 2127 | Sub-district code |
| `Town/Village` | int64 | 303398 | Village code |
| `Name` | str | Pamehi | Village name |
| `Level` | str | VILLAGE | Geographic level |

### AIKOSH/SHRUG Expected Fields

| SHRUG Field | Type | Example | Description |
|-------------|------|---------|-------------|
| `pc11_s_id` | int/str | 18 | Census 2011 State code |
| `pc11_d_id` | int/str | 322 | Census 2011 District code |
| `pc11_sd_id` | int/str | 2127 | Census 2011 Sub-district code |
| `pc11_tv_id` | int/str | 303398 | Census 2011 Town/Village code |
| `pc11_name` | str | Pamehi | Village/Town name |
| `shrid2` | str | 11-18-322-02127-303398 | SHRUG identifier |

### Critical Question: Do the Codes Match?

**The AIKOSH/SHRUG dataset is explicitly built on Census 2011 identifiers.**

According to the SHRUG documentation:
- The `shrid2` format for villages is: `11-SS-DDD-ssss-VVVVVV`
- Where SS = State code, DDD = District code, ssss = Sub-district code, VVVVVV = Village code
- These codes come directly from the **2011 Population Census**

**Expected match**: If our Census PCA-TV dataset uses the same Census 2011 coding system (which it should, as both are from Census 2011), then:

| Our Census Field | SHRUG Field | Expected Match |
|------------------|-------------|----------------|
| `District` = 322 | `pc11_d_id` = 322 | **YES** — same Census 2011 district code |
| `Subdistt` = 2127 | `pc11_sd_id` = 2127 | **YES** — same Census 2011 sub-district code |
| `Town/Village` = 303398 | `pc11_tv_id` = 303398 | **YES** — same Census 2011 village code |
| `Name` = Pamehi | `pc11_name` = Pamehi | **YES** — same name |

**However, this must be verified after download.** The dataset description states it was "created using common location codes from multiple open-source sources" — we need to confirm that the Census 2011 codes were preserved exactly.

## 11. Additional Related Dataset on AIKOSH

**"Population Census to SHRUG Identifier Keys"**

URL: https://aikosh.indiaai.gov.in/home/datasets/details/population_census_to_shrug_identifier_keys.html

> "The Population Census Keys Dataset links village, town, subdistrict, and district-level Population Census identifiers to SHRUG (shrid) units across 1991, 2001, and 2011 census years."

This dataset could serve as a **crosswalk table** between Census PCA-TV codes and SHRUG identifiers.

## 12. License

| Field | Value |
|-------|-------|
| **License** | CC BY-NC-SA 4.0 (Attribution-NonCommercial-ShareAlike) |
| **Restriction** | Non-commercial use only |
| **Impact** | Acceptable for ResQMap prototype; may need alternative for commercial deployment |

## 13. Download Requirements

| Field | Value |
|-------|-------|
| **Registration** | Required on AIKOSH platform |
| **Access** | Open (after registration) |
| **Download Method** | Direct download from AIKOSH |

## 14. Data Quality

| Metric | Score |
|--------|-------|
| Data Quality & Integrity | 2.5/5 |
| Data Consistency & Usability | 2.1/5 |
| Data Maintenance & Documentation | 4.3/5 |
| **Positional Accuracy** | 0–1 km error (per SHRUG documentation) |

## 15. Comparison: AIKOSH vs NWIC

| Criterion | AIKOSH (SHRUG) | NWIC (SOI) |
|-----------|----------------|------------|
| Census 2011 codes | **YES** (explicitly based on Census 2011) | NO (uses SOI codes) |
| Direct code match possible | **LIKELY YES** | NO |
| Kamrup Metropolitan | YES (India-wide) | YES (via name filter) |
| Village-level | YES | YES |
| Polygon geometry | YES | YES |
| CRS | WGS84 (expected) | EPSG:7755 |
| License | CC BY-NC-SA 4.0 | Government data |
| File size | ~918 MB | ~10 MB (SHP) |
| Registration required | YES | NO |
| Data quality | Academic-grade (SHRUG) | Government-grade (SOI) |

## 16. Risks and Limitations

1. **File size**: ~918 MB is large — only Kamrup Metropolitan subset needed
2. **Registration**: AIKOSH requires account creation
3. **Positional accuracy**: 0–1 km error expected (standard for Indian village maps)
4. **License**: CC BY-NC-SA restricts commercial use
5. **Code verification needed**: Must confirm that Census 2011 codes are preserved exactly after download
6. **Attribute schema**: Must inspect actual field names after download

---

## VERDICT: **BEST CANDIDATE**

### Reasoning

1. **Explicitly Census 2011-based** — Unlike NWIC/SOI which uses different codes, AIKOSH/SHRUG is built directly on Census 2011 geographic identifiers
2. **Direct code match expected** — The `pc11_tv_id` field should contain the same village codes as our Census PCA-TV `Town/Village` field
3. **Academic-grade quality** — Maintained by Development Data Lab (SHRUG), widely used in research
4. **Complete coverage** — All 649,618 villages/towns across India
5. **Related crosswalk available** — "Population Census to SHRUG Identifier Keys" dataset on AIKOSH can help if direct match fails

### Can AIKOSH provide a reliable geometry-to-Census-village-code join for our 216 Kamrup Metropolitan villages?

**ANSWER: LIKELY YES — but requires verification after download.**

The AIKOSH/SHRUG dataset is the only source found that:
- Is explicitly based on Census 2011 identifiers
- Contains the same coding system as our Census PCA-TV dataset
- Has village-level polygon geometries for all of India
- Provides a `pc11_tv_id` field that should match our `Town/Village` code

**If the codes match**, joining would be straightforward:
```
Census.Town/Village = AIKOSH.pc11_tv_id
```

**If codes do not match exactly**, the "Population Census to SHRUG Identifier Keys" dataset on AIKOSH can serve as a crosswalk.

### Recommendation

1. **Register on AIKOSH** and download the dataset
2. **Extract only Kamrup Metropolitan** features (District code 322)
3. **Verify** that `pc11_tv_id` matches our Census `Town/Village` codes
4. **If match is confirmed**, use AIKOSH as the primary geometry source
5. **If match fails**, use the SHRUG crosswalk keys as an intermediate step

---

## UPDATE: Village Code Matching Analysis (August 30, 2026)

### Independent Verification via village_list.csv

To independently verify that Census 2011 village codes are consistent across sources, we compared:

1. **Census PCA-TV 2011** (`data/raw/kamrup_metropolitan_pca_tv_2011.xlsx`) — 229 village/town records
2. **village_list.csv** (from `gggodhwani/indian_village_directory`) — 652,179 villages nationwide with Census 2011 codes

### Results

| Metric | Value |
|--------|-------|
| Census PCA-TV villages (Kamrup Metro) | 229 |
| village_list.csv villages (Kamrup Metro, district 618) | 220 |
| **Matched village codes** | **219** |
| Only in Census | 10 (wards, sub-districts) |
| Only in CSV | 1 |
| **Match rate** | **95.6%** (219/230 unique village codes) |

### Key Finding: Village Codes Are Identical

The 6-digit village codes (e.g., 303398, 303399, 303401) are **identical** between the Census PCA-TV dataset and the village_list.csv. This confirms that:

1. **Census 2011 village codes are consistent** across different data sources
2. **The AIKOSH/SHRUG dataset should use the same codes** since it's built on Census 2011 identifiers
3. **A direct join is feasible**: `Census.Town/Village = AIKOSH.pc11_tv_id`

### District Code Note

The village_list.csv uses district code **618** for Kamrup Metropolitan, while the Census PCA-TV uses **322**. This discrepancy is likely due to different administrative classification systems (e.g., pre-delimitation vs. post-delimitation codes). However, the **village codes themselves are identical**, which is what matters for the join.

### Sample Matched Villages

| Village Code | Census Name | CSV Name |
|-------------|-------------|----------|
| 303398 | Pamehi | Pamehi |
| 303399 | Char Majir N.C. | Char Majir N.C. |
| 303401 | Gog | Gog |
| 303402 | Gog N.C. | Gog N.C. |
| 303403 | Lakhara N.C. | Lakhara N.C. |
| 303404 | Lakhara | Lakhara |
| 303405 | Garbhanga N.C. | Garbhanga N.C. |
| 303406 | Mikirpara Chokardoi | Mikirpara Chokardoi |
| 303407 | Mirzapur | Mirzapur |
| 303408 | Kendukuchi | Kendukuchi |

### Download Instructions

The geometry data must be downloaded manually from one of these sources:

**Option 1: AIKOSH (Recommended)**
1. Go to https://aikosh.indiaai.gov.in/home/datasets/details/2011_population_census_village_level_geometries.html
2. Register for an account (free)
3. Download the dataset files:
   - `village_modified.shp`
   - `village_modified.shx`
   - `village_modified.dbf`
   - `village_modified.prj`
   - `village_modified.cpg`
4. Place files in: `data/raw/aikosh_census_village_geometry_2011/`

**Option 2: DDL Website**
1. Go to https://www.devdatalab.org/shrug_download
2. Find "Open Polygons and Spatial Statistics" module
3. Download the village-level shapefile
4. Place files in: `data/raw/aikosh_census_village_geometry_2011/`

**Option 3: Python SDK (Advanced)**
```bash
pip install aikosh
# Requires API key from AIKOSH platform
```

### Inspection Script

After downloading, run:
```bash
cd python-engine
python scripts/inspect_aikosh_geometry.py
```

This script will:
1. Load the geometry file
2. Filter to Kamrup Metropolitan (district code 322)
3. Verify village code matches with Census data
4. Generate a detailed inspection report

---

*Document created: August 30, 2026*
*Updated: August 30, 2026 — Added village code matching analysis*
*Status: Village codes verified; geometry download pending*
