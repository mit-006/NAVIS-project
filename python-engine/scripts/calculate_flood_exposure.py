import geopandas as gpd
import pandas as pd
import json
import os
import warnings
warnings.filterwarnings('ignore')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')

HAB_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'kamrup_metro_habitations.geojson')
FLOOD_DIR = os.path.join(BASE_DIR, 'data', 'raw', 'flood', 'extracted')
OUT_GEOJSON = os.path.join(BASE_DIR, 'data', 'processed', 'kamrup_metro_flood_exposure.geojson')
OUT_CSV = os.path.join(BASE_DIR, 'data', 'processed', 'kamrup_metro_flood_exposure.csv')
REPORT_PATH = os.path.join(BASE_DIR, 'data', 'inspection', 'flood_exposure_inspection.md')

FLOOD_FILE = 'NDEM_AS_Yearly_Aggregate_Flood_Innundation_1998_to_2013_2021.geojsonl'
YEARS = ['1998', '1999', '2004', '2012', '2013']
KAMRUP_BBOX = (91.0, 25.5, 92.5, 26.5)

print('='*70)
print('NAVIS Flood Exposure Calculation')
print('='*70)

# STEP 1: Load habitation layer
print('\nSTEP 1: Loading habitation layer...')
hab = gpd.read_file(HAB_PATH)
print(f'  Loaded {len(hab)} habitations')

# Calculate area in UTM
hab_utm = hab.to_crs(epsg=32646)
hab['total_area_sqm'] = hab_utm.geometry.area
hab['total_area_ha'] = hab['total_area_sqm'] / 10000
print(f'  Total area: {hab["total_area_sqm"].sum()/1e6:.2f} sq km')

# STEP 2: Read flood data and build per-year dissolved polygons
print('\nSTEP 2: Reading flood data per year...')
from shapely.geometry import shape
from shapely.ops import unary_union
import time

flood_file = os.path.join(FLOOD_DIR, FLOOD_FILE)

# Collect flood geometries per year within Kamrup bbox
flood_by_year = {y: [] for y in YEARS}

start = time.time()
line_count = 0
with open(flood_file, 'r', encoding='utf-8') as fh:
    for line in fh:
        line_count += 1
        if line_count % 200000 == 0:
            print(f'    {line_count:,} lines ({time.time()-start:.0f}s)')
        try:
            rec = json.loads(line.strip())
        except:
            continue
        props = rec.get('properties', {})
        year = props.get('year')
        if year not in YEARS:
            continue
        geom_data = rec.get('geometry', {})
        coords = geom_data.get('coordinates', [])
        if not coords:
            continue
        # Quick bbox check
        flat = []
        def flatten(c):
            if isinstance(c, (int, float)):
                flat.append(c)
            else:
                for item in c:
                    flatten(item)
        flatten(coords)
        if len(flat) < 4:
            continue
        lons, lats = flat[0::2], flat[1::2]
        if max(lons) < KAMRUP_BBOX[0] or min(lons) > KAMRUP_BBOX[2]:
            continue
        if max(lats) < KAMRUP_BBOX[1] or min(lats) > KAMRUP_BBOX[3]:
            continue
        try:
            flood_geom = shape(geom_data)
            if not flood_geom.is_empty:
                flood_by_year[year].append(flood_geom)
        except:
            continue

print(f'  Total lines: {line_count:,} ({time.time()-start:.0f}s)')

# Dissolve flood polygons per year
print('\nSTEP 3: Dissolving flood polygons per year...')
dissolved_flood = {}
for year in YEARS:
    geoms = flood_by_year[year]
    print(f'  Year {year}: {len(geoms)} raw polygons...', end=' ')
    if geoms:
        dissolved = unary_union(geoms)
        dissolved_flood[year] = dissolved
        print(f'dissolved to {len(dissolved.geoms) if hasattr(dissolved, "geoms") else 1} parts')
    else:
        dissolved_flood[year] = None
        print('no data')

# STEP 4: Calculate intersection for each habitation
print('\nSTEP 4: Calculating flood exposure for each habitation...')

for year in YEARS:
    hab[f'flood_area_{year}'] = 0.0
    hab[f'flood_pct_{year}'] = 0.0
    hab[f'exposed_pop_{year}'] = 0

for year in YEARS:
    flood_geom = dissolved_flood[year]
    if flood_geom is None:
        print(f'  Year {year}: no flood data')
        continue
    
    print(f'  Year {year}: intersecting with {len(hab)} habitations...', end=' ')
    exposed_count = 0
    
    for idx in range(len(hab)):
        hab_geom = hab.geometry.iloc[idx]
        try:
            if not flood_geom.intersects(hab_geom):
                continue
            intersection = flood_geom.intersection(hab_geom)
            if intersection.is_empty:
                continue
            # Calculate area in UTM
            inter_gdf = gpd.GeoSeries([intersection], crs='EPSG:4326').to_crs(epsg=32646)
            inter_area = inter_gdf.area.values[0]
            total_area = hab.at[hab.index[idx], 'total_area_sqm']
            # Cap at total area
            inter_area = min(inter_area, total_area)
            hab.at[hab.index[idx], f'flood_area_{year}'] = inter_area
            hab.at[hab.index[idx], f'flood_pct_{year}'] = (inter_area / total_area) * 100
            exposed_count += 1
        except:
            continue
    
    print(f'{exposed_count} habitations exposed')

# STEP 5: Calculate exposed population
print('\nSTEP 5: Calculating exposed population...')
for year in YEARS:
    hab[f'flood_pct_{year}'] = hab[f'flood_pct_{year}'].clip(0, 100)
    hab[f'exposed_pop_{year}'] = (hab['TOT_P'] * hab[f'flood_pct_{year}'] / 100).round(0).astype(int)

# STEP 6: Calculate frequency and max exposure
print('\nSTEP 6: Calculating flood frequency...')
hab['flood_years_exposed'] = 0
for year in YEARS:
    hab['flood_years_exposed'] += (hab[f'flood_pct_{year}'] > 0).astype(int)
hab['flood_frequency'] = hab['flood_years_exposed'] / len(YEARS)
hab['max_flood_exposure_pct'] = hab[[f'flood_pct_{y}' for y in YEARS]].max(axis=1)
hab['exposure_note'] = 'ESTIMATE: spatial overlap with historical flood inundation polygons only. NOT actual people affected.'

# STEP 7: Validation
print('\nSTEP 7: Validation...')
errors = []
if len(hab) != 228:
    errors.append(f'Records: {len(hab)} (expected 228)')
if hab['Town/Village'].duplicated().sum() > 0:
    errors.append(f'Duplicate Town/Village: {hab["Town/Village"].duplicated().sum()}')
if hab.geometry.isna().sum() > 0:
    errors.append(f'Missing geometry: {hab.geometry.isna().sum()}')
if (~hab.geometry.is_valid).sum() > 0:
    errors.append(f'Invalid geometry: {(~hab.geometry.is_valid).sum()}')
for year in YEARS:
    if hab[f'flood_pct_{year}'].min() < 0 or hab[f'flood_pct_{year}'].max() > 100:
        errors.append(f'Year {year}: exposure out of range')
    if (hab[f'flood_area_{year}'] > hab['total_area_sqm'] + 0.001).sum() > 0:
        errors.append(f'Year {year}: flooded area > total area')
if errors:
    for e in errors:
        print(f'  FAIL: {e}')
else:
    print('  ALL VALIDATIONS PASSED')

# STEP 8: Export
print('\nSTEP 8: Exporting...')
output_cols = ['District', 'Subdistt', 'Town/Village', 'Name', 'TRU',
               'No_HH', 'TOT_P', 'TOT_M', 'TOT_F', 'P_06', 'P_SC', 'P_ST',
               'pc11_s_id', 'pc11_d_id', 'pc11_sd_id', 'pc11_tv_id', 'tv_name', 'mdds_og',
               'total_area_sqm', 'total_area_ha']
for year in YEARS:
    output_cols.extend([f'flood_area_{year}', f'flood_pct_{year}', f'exposed_pop_{year}'])
output_cols.extend(['flood_years_exposed', 'flood_frequency', 'max_flood_exposure_pct', 'exposure_note', 'geometry'])

hab_out = hab[output_cols].copy()
hab_out.crs = 'EPSG:4326'
hab_out.to_file(OUT_GEOJSON, driver='GeoJSON')
print(f'  GeoJSON: {OUT_GEOJSON} ({os.path.getsize(OUT_GEOJSON):,} bytes)')

hab_csv = hab_out.drop(columns=['geometry'])
hab_csv.to_csv(OUT_CSV, index=False)
print(f'  CSV: {OUT_CSV} ({os.path.getsize(OUT_CSV):,} bytes)')

# STEP 9: Report
print('\nSTEP 9: Generating report...')
any_exposure = (hab['max_flood_exposure_pct'] > 0).sum()
max_idx = hab['max_flood_exposure_pct'].idxmax()
max_name = hab.loc[max_idx, 'Name']
max_val = hab.loc[max_idx, 'max_flood_exposure_pct']

report = f"""# Flood Exposure Inspection Report

## Processing Summary

| Metric | Value |
|--------|-------|
| Habitations processed | {len(hab)} |
| Total population | {hab['TOT_P'].sum():,} |
| Total habitation area | {hab['total_area_sqm'].sum()/1e6:.2f} sq km |
| Flood years | {', '.join(YEARS)} |
| CRS (area calc) | EPSG:32646 (UTM Zone 46N) |
| CRS (output) | EPSG:4326 (WGS84) |

## Results

| Metric | Value |
|--------|-------|
| Habitations with flood exposure | {any_exposure} / {len(hab)} |
| Habitations with 0% exposure | {len(hab) - any_exposure} / {len(hab)} |
| Max exposure (any year) | {max_val:.2f}% ({max_name}) |
| Avg flood frequency | {hab['flood_frequency'].mean():.2f} |

### Exposure by Year

| Year | Exposed Hab | Avg Exposure % | Max Exposure % | Est. Total Exposed Pop |
|------|-------------|----------------|----------------|----------------------|
"""

for year in YEARS:
    pct_col = f'flood_pct_{year}'
    pop_col = f'exposed_pop_{year}'
    report += f"| {year} | {(hab[pct_col] > 0).sum()} | {hab.loc[hab[pct_col] > 0, pct_col].mean():.2f}% | {hab[pct_col].max():.2f}% | {hab[pop_col].sum():,} |\n"

report += f"""
### Flood Frequency Distribution

| Frequency | Count |
|-----------|-------|
| 0.0 (never) | {(hab['flood_frequency'] == 0).sum()} |
| 0.01-0.2 (1yr) | {((hab['flood_frequency'] > 0) & (hab['flood_frequency'] <= 0.2)).sum()} |
| 0.21-0.4 (2yr) | {((hab['flood_frequency'] > 0.2) & (hab['flood_frequency'] <= 0.4)).sum()} |
| 0.41-0.6 (3yr) | {((hab['flood_frequency'] > 0.4) & (hab['flood_frequency'] <= 0.6)).sum()} |
| 0.61-0.8 (4yr) | {((hab['flood_frequency'] > 0.6) & (hab['flood_frequency'] <= 0.8)).sum()} |
| 0.81-1.0 (5yr) | {(hab['flood_frequency'] > 0.8).sum()} |

### Top 10 Most Exposed

| Rank | Name | Max Exposure % | Frequency | Pop | Est. Exposed Pop |
|------|------|----------------|-----------|-----|-----------------|
"""
top10 = hab.nlargest(10, 'max_flood_exposure_pct')
for rank, (_, row) in enumerate(top10.iterrows(), 1):
    report += f"| {rank} | {row['Name']} | {row['max_flood_exposure_pct']:.2f}% | {row['flood_frequency']:.2f} | {row['TOT_P']:,} | {int(row['TOT_P'] * row['max_flood_exposure_pct'] / 100):,} |\n"

report += f"""
## Validation

| Check | Status |
|-------|--------|
| 228 records | {'PASS' if len(hab) == 228 else 'FAIL'} |
| No duplicate IDs | {'PASS' if hab['Town/Village'].duplicated().sum() == 0 else 'FAIL'} |
| No missing geometry | {'PASS' if hab.geometry.isna().sum() == 0 else 'FAIL'} |
| Valid geometry | {'PASS' if hab.geometry.is_valid.all() else 'FAIL'} |
| Exposure 0-100% | {'PASS' if all(hab[f'flood_pct_{y}'].between(0, 100).all() for y in YEARS) else 'FAIL'} |
| Flooded area <= total | {'PASS' if all((hab[f'flood_area_{y}'] <= hab['total_area_sqm'] + 0.001).all() for y in YEARS) else 'FAIL'} |

## Output Files

| File | Path |
|------|------|
| GeoJSON | `{OUT_GEOJSON}` |
| CSV | `{OUT_CSV}` |

## Methodology

1. **Flood data dissolved per year** to eliminate overlapping polygon double-counting
2. **Area calculated in UTM Zone 46N** (EPSG:32646) for accurate sq meter measurements
3. **Exposure %** = (Flooded Area / Total Area) x 100
4. **Flood frequency** = Years with exposure / Total available years (5)
5. **Exposed population** = TOT_P x Exposure % / 100 (ESTIMATE ONLY)
6. **Average exposure %** = Mean of exposure percentages among habitations with non-zero flood exposure only (consistent with frontend calculation)

## Important Notes

- This is a SPATIAL OVERLAP ESTIMATE, not actual flood impact assessment
- Binary inundation data: no depth/severity information available
- Only 5 years of data available (1998, 1999, 2004, 2012, 2013)
- Actual flood exposure likely higher due to unrecorded years
"""

with open(REPORT_PATH, 'w', encoding='utf-8') as f:
    f.write(report)
print(f'  Report: {REPORT_PATH}')

print('\n' + '='*70)
print('PROCESSING COMPLETE')
print('='*70)
print(f'  Habitations: {len(hab)}')
print(f'  Years: {", ".join(YEARS)}')
print(f'  Exposed: {any_exposure}')
print(f'  Max: {max_name} ({max_val:.2f}%)')
print(f'  GeoJSON: {OUT_GEOJSON}')
print(f'  CSV: {OUT_CSV}')
