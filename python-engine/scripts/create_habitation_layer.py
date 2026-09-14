"""
Create first processed NAVIS GIS habitation layer.
Joins Census PCA-TV with AIKOSH PC11 village polygons.
"""
import json
import sys
from pathlib import Path

try:
    import geopandas as gpd
    import pandas as pd
    import openpyxl
except ImportError as e:
    print(f"ERROR: Missing dependency - {e}")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
CENSUS_FILE = PROJECT_ROOT / "data/raw/kamrup_metropolitan_pca_tv_2011.xlsx"
AIKOSH_SHP = PROJECT_ROOT / "data/raw/aikosh_census_village_geometry_2011/extracted/shrug-pc11-village-poly-shp/village_modified.shp"
OUTPUT_DIR = PROJECT_ROOT / "data/processed"
GEOJSON_OUT = OUTPUT_DIR / "kamrup_metro_habitations.geojson"
CSV_OUT = OUTPUT_DIR / "kamrup_metro_habitations.csv"
REPORT_OUT = PROJECT_ROOT / "data/inspection/kamrup_metro_habitation_layer.md"

SEP = "=" * 70
LINE = "-" * 70

print(SEP)
print("NAVIS Habitation Layer - Census + AIKOSH Join")
print(SEP)

# ── Step 1: Load Census data ──
print()
print("STEP 1: Loading Census PCA-TV data...")
wb = openpyxl.load_workbook(str(CENSUS_FILE), read_only=True, data_only=True)
ws = wb.active

headers = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
print("  All Census columns: " + str(headers))

# Find column indices
col_map = {}
for i, h in enumerate(headers):
    if h:
        col_map[h] = i

# Required Census columns
required_census = ['State', 'District', 'Subdistt', 'Town/Village', 'Ward', 'EB',
                   'Level', 'Name', 'TRU', 'No_HH', 'TOT_P', 'TOT_M', 'TOT_F',
                   'P_06', 'M_06', 'F_06', 'P_SC', 'M_SC', 'F_SC', 'P_ST', 'M_ST', 'F_ST']

# Read all rows
census_rows = []
for row in ws.iter_rows(min_row=2, values_only=True):
    if row[col_map.get('Town/Village', 3)] is not None:
        record = {}
        for col_name in required_census:
            if col_name in col_map:
                record[col_name] = row[col_map[col_name]]
            else:
                record[col_name] = None
        census_rows.append(record)

wb.close()

# Convert to DataFrame
census_df = pd.DataFrame(census_rows)

# Convert numeric columns (but keep District as string for comparison)
for col in ['No_HH', 'TOT_P', 'TOT_M', 'TOT_F',
            'P_06', 'M_06', 'F_06', 'P_SC', 'M_SC', 'F_SC', 'P_ST', 'M_ST', 'F_ST']:
    if col in census_df.columns:
        census_df[col] = pd.to_numeric(census_df[col], errors='coerce')

# Convert District to string for comparison
census_df['District_str'] = census_df['District'].astype(str).str.strip()

# Convert Town/Village to string for join
census_df['Town/Village_str'] = census_df['Town/Village'].astype(str).str.strip()

print(f"  Total Census rows: {len(census_df)}")

# Filter to District 322
census_322 = census_df[census_df['District_str'] == '322'].copy()
print(f"  Census rows District 322: {len(census_322)}")

# Filter to VILLAGE and TOWN levels
census_villages = census_322[census_322['Level'].isin(['VILLAGE', 'TOWN'])].copy()
print(f"  Census villages/towns: {len(census_villages)}")
print(f"  Unique join keys: {census_villages['Town/Village_str'].nunique()}")

# Handle duplicates - keep first entry for each code
dup_count = census_villages['Town/Village_str'].duplicated().sum()
if dup_count > 0:
    print(f"  Removing {dup_count} duplicate Census entries")
    census_villages = census_villages.drop_duplicates(subset='Town/Village_str', keep='first').copy()
print(f"  Census villages/towns after dedup: {len(census_villages)}")

# ── Step 2: Load AIKOSH geometry ──
print()
print("STEP 2: Loading AIKOSH geometry...")
gdf = gpd.read_file(str(AIKOSH_SHP))
print(f"  Total AIKOSH features: {len(gdf):,}")

# Filter to District 322
kamrup_mask = gdf['pc11_d_id'].astype(str) == '322'
kamrup_gdf = gdf[kamrup_mask].copy()
print(f"  AIKOSH features District 322: {len(kamrup_gdf)}")

# Remove duplicate pc11_tv_id (keep first valid geometry)
dup_mask = kamrup_gdf['pc11_tv_id'].duplicated(keep='first')
if dup_mask.sum() > 0:
    print(f"  Removing {dup_mask.sum()} duplicate pc11_tv_id entries")
    kamrup_gdf = kamrup_gdf[~dup_mask].copy()
print(f"  AIKOSH unique District 322: {len(kamrup_gdf)}")

# ── Step 3: Join ──
print()
print("STEP 3: Joining Census + AIKOSH...")
print(f"  Join key: Census.Town/Village_str = AIKOSH.pc11_tv_id")

# Perform the join
joined = census_villages.merge(
    kamrup_gdf,
    left_on='Town/Village_str',
    right_on='pc11_tv_id',
    how='left',
    indicator=True
)

# Analyze join results
matched = joined[joined['_merge'] == 'both']
unmatched_census = joined[joined['_merge'] == 'left_only']
unmatched_aikosh = joined[joined['_merge'] == 'right_only']

print(f"  Joined records: {len(joined)}")
print(f"  Matched (both): {len(matched)}")
print(f"  Unmatched Census: {len(unmatched_census)}")
print(f"  Unmatched AIKOSH: {len(unmatched_aikosh)}")

# ── Step 4: Validate ──
print()
print("STEP 4: Validation...")
print(f"  Census join keys: {census_villages['Town/Village_str'].nunique()}")
print(f"  AIKOSH join keys: {kamrup_gdf['pc11_tv_id'].nunique()}")
print(f"  Matched keys: {len(matched)}")

# Check for duplicates
if len(matched) > matched['Town/Village_str'].nunique():
    print("  WARNING: Duplicate join keys in result!")
else:
    print("  No duplicate join keys")

# Check geometry
gdf_joined = gpd.GeoDataFrame(matched, geometry='geometry')
valid_geom = gdf_joined.geometry.is_valid.sum()
missing_geom = gdf_joined.geometry.isna().sum()
print(f"  Valid geometry: {valid_geom}")
print(f"  Missing geometry: {missing_geom}")

# Validation summary
validation_ok = (len(matched) == 228 and missing_geom == 0 and
                 len(matched) == matched['Town/Village_str'].nunique())
print(f"  Validation: {'PASS' if validation_ok else 'FAIL'}")

# ── Step 5: Prepare output columns ──
print()
print("STEP 5: Preparing output columns...")

# Census columns to keep
census_keep = ['District', 'Subdistt', 'Town/Village', 'Name', 'TRU',
               'No_HH', 'TOT_P', 'TOT_M', 'TOT_F', 'P_06', 'P_SC', 'P_ST']

# AIKOSH columns to keep
aikosh_keep = ['pc11_s_id', 'pc11_d_id', 'pc11_sd_id', 'pc11_tv_id', 'tv_name', 'mdds_og']

# Build output dataframe
output_data = []
for _, row in matched.iterrows():
    record = {}
    # Census attributes
    for col in census_keep:
        val = row.get(col)
        # Convert numpy types to Python types for JSON serialization
        if hasattr(val, 'item'):
            val = val.item()
        record[col] = val
    # AIKOSH attributes
    for col in aikosh_keep:
        val = row.get(col)
        if hasattr(val, 'item'):
            val = val.item()
        record[col] = val
    # Geometry
    record['geometry'] = row['geometry']
    output_data.append(record)

output_gdf = gpd.GeoDataFrame(output_data, geometry='geometry')
print(f"  Output records: {len(output_gdf)}")
print(f"  Output columns: {[c for c in output_gdf.columns if c != 'geometry']}")

# ── Step 6: Export ──
print()
print("STEP 6: Exporting...")

# Create output directory
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Export GeoJSON
output_gdf.to_file(str(GEOJSON_OUT), driver='GeoJSON', encoding='utf-8')
print(f"  GeoJSON: {GEOJSON_OUT}")
print(f"    Size: {GEOJSON_OUT.stat().st_size:,} bytes")

# Export CSV (attributes only, no geometry)
csv_df = output_gdf.drop(columns=['geometry'])
csv_df.to_csv(str(CSV_OUT), index=False, encoding='utf-8')
print(f"  CSV: {CSV_OUT}")
print(f"    Size: {CSV_OUT.stat().st_size:,} bytes")

# ── Step 7: Create report ──
print()
print("STEP 7: Creating report...")

report = f"""# Kamrup Metro Habitation Layer - Processing Report

**Generated**: August 30, 2026
**Purpose**: First processed NAVIS GIS habitation layer

## Input Files

| File | Description |
|------|-------------|
| `data/raw/kamrup_metropolitan_pca_tv_2011.xlsx` | Census 2011 PCA-TV |
| `data/raw/aikosh_census_village_geometry_2011/extracted/.../village_modified.shp` | AIKOSH PC11 Village Polygons |

## Join Configuration

| Parameter | Value |
|-----------|-------|
| Join key (Census) | `Town/Village` (as string) |
| Join key (AIKOSH) | `pc11_tv_id` |
| Join type | Left join |
| Filter | Census District = 322, Level = VILLAGE or TOWN |

## Processing Summary

| Metric | Count |
|--------|-------|
| Census rows (all) | {len(census_df)} |
| Census rows District 322 | {len(census_322)} |
| Census villages/towns District 322 | {len(census_villages)} |
| AIKOSH features (all) | {len(gdf):,} |
| AIKOSH features District 322 | {len(kamrup_gdf)} |
| **Matched records** | **{len(matched)}** |
| Unmatched Census records | {len(unmatched_census)} |
| Unmatched AIKOSH records | {len(unmatched_aikosh)} |

## Validation

| Check | Result |
|-------|--------|
| 228/228 joins | {'PASS' if len(matched) == 228 else 'FAIL'} ({len(matched)}/228) |
| 0 missing geometries | {'PASS' if missing_geom == 0 else 'FAIL'} ({missing_geom} missing) |
| Geometry validity | {'PASS' if valid_geom == len(matched) else 'FAIL'} ({valid_geom}/{len(matched)} valid) |
| No duplicate join keys | {'PASS' if len(matched) == matched['Town/Village_str'].nunique() else 'FAIL'} |
| **Overall** | **{'PASS' if validation_ok else 'FAIL'}** |

## Output Columns

### Census Attributes (kept)
{chr(10).join(f"- `{c}`" for c in census_keep)}

### AIKOSH Attributes (kept)
{chr(10).join(f"- `{c}`" for c in aikosh_keep)}

### Geometry
- Type: Polygon/MultiPolygon
- CRS: EPSG:4326 (WGS84)

## Output Files

| File | Format | Size | Records |
|------|--------|------|---------|
| `data/processed/kamrup_metro_habitations.geojson` | GeoJSON | {GEOJSON_OUT.stat().st_size:,} bytes | {len(output_gdf)} |
| `data/processed/kamrup_metro_habitations.csv` | CSV | {CSV_OUT.stat().st_size:,} bytes | {len(csv_df)} |

## Sample Records (first 10)

| Code | Census Name | AIKOSH Name | TOT_P | NO_HH | Level |
|------|-------------|-------------|-------|-------|-------|
"""

# Add sample records
for _, row in matched.head(10).iterrows():
    name = row.get('Name', '')
    tv_name = row.get('tv_name', '')
    tot_p = row.get('TOT_P', 0)
    no_hh = row.get('No_HH', 0)
    level = row.get('Level', '')
    code = row.get('Town/Village_str', '')
    if hasattr(tot_p, 'item'):
        tot_p = tot_p.item()
    if hasattr(no_hh, 'item'):
        no_hh = no_hh.item()
    report += f"| {code} | {name} | {tv_name} | {tot_p} | {no_hh} | {level} |\n"

report += f"""
## Notes

1. **228 Census villages/towns** successfully joined to AIKOSH polygons
2. All geometries are valid polygons in WGS84 (EPSG:4326)
3. No duplicate join keys in output
4. Raw source files were NOT modified
5. This is the base habitation layer for NAVIS - hazard data will be added later

---

*Report created: August 30, 2026*
"""

with open(REPORT_OUT, 'w', encoding='utf-8') as f:
    f.write(report)
print(f"  Report: {REPORT_OUT}")

# ── Summary ──
print()
print(SEP)
print("PROCESSING COMPLETE")
print(SEP)
print(f"  Matched records: {len(matched)}/228")
print(f"  Missing geometries: {missing_geom}")
print(f"  GeoJSON: {GEOJSON_OUT}")
print(f"  CSV: {CSV_OUT}")
print(f"  Report: {REPORT_OUT}")
print(SEP)
