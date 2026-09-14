import geopandas as gpd
import pandas as pd
import os
import warnings
warnings.filterwarnings('ignore')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')

HAB_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'kamrup_metro_habitations.geojson')
LS_DIR = os.path.join(BASE_DIR, 'data', 'raw', 'landslide', 'extracted', 'NDEM_Landslide_Hazard')
OUT_GEOJSON = os.path.join(BASE_DIR, 'data', 'processed', 'kamrup_metro_landslide_exposure.geojson')
OUT_CSV = os.path.join(BASE_DIR, 'data', 'processed', 'kamrup_metro_landslide_exposure.csv')
REPORT_PATH = os.path.join(BASE_DIR, 'data', 'inspection', 'landslide_exposure_inspection.md')

CLASS_NAMES = {1: 'Very Low', 2: 'Low', 3: 'Moderate', 4: 'High', 5: 'Very High'}

print('='*70)
print('NAVIS Landslide Exposure Calculation')
print('='*70)

# STEP 1: Load habitation layer
print('\nSTEP 1: Loading habitation layer...')
hab = gpd.read_file(HAB_PATH)
print(f'  Loaded {len(hab)} habitations')
print(f'  CRS: {hab.crs}')

# STEP 2: Load NDEM landslide hazard zones
print('\nSTEP 2: Loading NDEM landslide hazard zones...')
ls_files = [f for f in os.listdir(LS_DIR) if f.endswith('.shp')]
ls_path = os.path.join(LS_DIR, ls_files[0])
ls = gpd.read_file(ls_path)
print(f'  Loaded {len(ls)} hazard zones')
print(f'  CRS: {ls.crs}')
print(f'  Grid codes: {sorted(ls["grid_code"].unique())}')

# STEP 3: Filter hazard zones to Kamrup Metro area
print('\nSTEP 3: Filtering hazard zones to Kamrup Metro area...')
from shapely.geometry import box
kamrup_bbox = box(91.0, 25.5, 92.5, 26.5)
ls_kamrup = ls[ls.geometry.intersects(kamrup_bbox)].copy()
print(f'  Hazard zones in Kamrup Metro: {len(ls_kamrup)}')
print(f'  Grid code distribution:')
for code in sorted(ls_kamrup["grid_code"].unique()):
    count = (ls_kamrup["grid_code"] == code).sum()
    print(f'    Class {code} ({CLASS_NAMES.get(code, "Unknown")}): {count} zones')

# STEP 4: Calculate areas in UTM
print('\nSTEP 4: Calculating areas in UTM Zone 46N...')
hab_utm = hab.to_crs(epsg=32646)
hab['total_area_sqm'] = hab_utm.geometry.area
hab['total_area_ha'] = hab['total_area_sqm'] / 10000

ls_utm = ls_kamrup.to_crs(epsg=32646)
ls_kamrup['area_sqm'] = ls_utm.geometry.area

print(f'  Total habitation area: {hab["total_area_sqm"].sum()/1e6:.2f} sq km')
print(f'  Total hazard zone area: {ls_kamrup["area_sqm"].sum()/1e6:.2f} sq km')

# STEP 5: Spatial overlay and calculate exposure
print('\nSTEP 5: Calculating landslide exposure for each habitation...')

# Initialize columns
hab['landslide_overlap_area'] = 0.0
hab['landslide_exposure_pct'] = 0.0
hab['landslide_max_class'] = 0
hab['landslide_avg_class'] = 0.0
hab['landslide_exposed_population_estimate'] = 0

for idx in range(len(hab)):
    hab_geom = hab.geometry.iloc[idx]
    total_area = hab.at[hab.index[idx], 'total_area_sqm']
    
    total_overlap = 0.0
    weighted_class_sum = 0.0
    max_class = 0
    
    # Check intersection with each hazard zone
    for ls_idx in range(len(ls_kamrup)):
        ls_geom = ls_kamrup.geometry.iloc[ls_idx]
        
        if not hab_geom.intersects(ls_geom):
            continue
        
        intersection = hab_geom.intersection(ls_geom)
        if intersection.is_empty:
            continue
        
        # Calculate intersection area in UTM
        inter_gdf = gpd.GeoSeries([intersection], crs='EPSG:4326').to_crs(epsg=32646)
        inter_area = inter_gdf.area.values[0]
        
        if inter_area > 0:
            hazard_class = ls_kamrup.iloc[ls_idx]['grid_code']
            total_overlap += inter_area
            weighted_class_sum += hazard_class * inter_area
            max_class = max(max_class, hazard_class)
    
    # Cap overlap at total area
    total_overlap = min(total_overlap, total_area)
    
    hab.at[hab.index[idx], 'landslide_overlap_area'] = total_overlap
    hab.at[hab.index[idx], 'landslide_exposure_pct'] = (total_overlap / total_area) * 100 if total_area > 0 else 0
    hab.at[hab.index[idx], 'landslide_max_class'] = max_class
    hab.at[hab.index[idx], 'landslide_avg_class'] = weighted_class_sum / total_overlap if total_overlap > 0 else 0
    
    if (idx + 1) % 50 == 0:
        print(f'  Processed {idx + 1}/{len(hab)} habitations...')

print(f'  Completed {len(hab)} habitations')

# STEP 6: Calculate exposed population
print('\nSTEP 6: Calculating exposed population...')
hab['landslide_exposure_pct'] = hab['landslide_exposure_pct'].clip(0, 100)
hab['landslide_exposed_population_estimate'] = (hab['TOT_P'] * hab['landslide_exposure_pct'] / 100).round(0).astype(int)

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

if hab['landslide_exposure_pct'].min() < 0 or hab['landslide_exposure_pct'].max() > 100:
    errors.append(f'Exposure out of range: {hab["landslide_exposure_pct"].min():.2f} - {hab["landslide_exposure_pct"].max():.2f}')

if (hab['landslide_overlap_area'] > hab['total_area_sqm'] + 0.001).sum() > 0:
    errors.append(f'Overlap area > total area: {(hab["landslide_overlap_area"] > hab["total_area_sqm"] + 0.001).sum()}')

unknown_classes = hab[~hab['landslide_max_class'].isin([0, 1, 2, 3, 4, 5])]
if len(unknown_classes) > 0:
    errors.append(f'Unknown hazard classes: {len(unknown_classes)}')

if errors:
    for e in errors:
        print(f'  FAIL: {e}')
else:
    print('  ALL VALIDATIONS PASSED')

# STEP 8: Statistics
print('\nSTEP 8: Statistics...')

exposed = hab[hab['landslide_exposure_pct'] > 0]
zero_exp = hab[hab['landslide_exposure_pct'] == 0]

print(f'  Habitations with exposure: {len(exposed)}')
print(f'  Habitations with zero exposure: {len(zero_exp)}')
print(f'  Max exposure: {hab["landslide_exposure_pct"].max():.2f}%')
print(f'  Avg exposure (exposed only): {exposed["landslide_exposure_pct"].mean():.2f}%')

print(f'\n  Hazard class distribution (max class per habitation):')
for cls in [0, 1, 2, 3, 4, 5]:
    count = (hab['landslide_max_class'] == cls).sum()
    name = CLASS_NAMES.get(cls, 'No Hazard')
    print(f'    Class {cls} ({name}): {count} habitations')

# STEP 9: Export
print('\nSTEP 9: Exporting...')
output_cols = ['District', 'Subdistt', 'Town/Village', 'Name', 'TRU',
               'No_HH', 'TOT_P', 'TOT_M', 'TOT_F', 'P_06', 'P_SC', 'P_ST',
               'pc11_s_id', 'pc11_d_id', 'pc11_sd_id', 'pc11_tv_id', 'tv_name', 'mdds_og',
               'total_area_sqm', 'total_area_ha',
               'landslide_overlap_area', 'landslide_exposure_pct', 
               'landslide_max_class', 'landslide_avg_class',
               'landslide_exposed_population_estimate', 'geometry']

hab_out = hab[output_cols].copy()
hab_out.crs = 'EPSG:4326'
hab_out.to_file(OUT_GEOJSON, driver='GeoJSON')
print(f'  GeoJSON: {OUT_GEOJSON} ({os.path.getsize(OUT_GEOJSON):,} bytes)')

hab_csv = hab_out.drop(columns=['geometry'])
hab_csv.to_csv(OUT_CSV, index=False)
print(f'  CSV: {OUT_CSV} ({os.path.getsize(OUT_CSV):,} bytes)')

# STEP 10: Report
print('\nSTEP 10: Generating report...')
max_idx = hab['landslide_exposure_pct'].idxmax()
max_name = hab.loc[max_idx, 'Name']
max_val = hab.loc[max_idx, 'landslide_exposure_pct']
max_class = hab.loc[max_idx, 'landslide_max_class']

# Top 10 most exposed
top10 = hab.nlargest(10, 'landslide_exposure_pct')

report = f"""# Landslide Exposure Inspection Report

## Processing Summary

| Metric | Value |
|--------|-------|
| Habitations processed | {len(hab)} |
| Total population | {hab['TOT_P'].sum():,} |
| Total habitation area | {hab['total_area_sqm'].sum()/1e6:.2f} sq km |
| Hazard zones loaded | {len(ls_kamrup)} |
| CRS (area calc) | EPSG:32646 (UTM Zone 46N) |
| CRS (output) | EPSG:4326 (WGS84) |

## Hazard Class Mapping

| Grid Code | Class Name |
|-----------|------------|
| 1 | Very Low |
| 2 | Low |
| 3 | Moderate |
| 4 | High |
| 5 | Very High |

## Results

| Metric | Value |
|--------|-------|
| Habitations with landslide exposure | {len(exposed)} / {len(hab)} |
| Habitations with zero exposure | {len(zero_exp)} / {len(hab)} |
| Max exposure percentage | {max_val:.2f}% |
| Habitation with max exposure | {max_name} (Class {max_class}) |
| Avg exposure (exposed only) | {exposed['landslide_exposure_pct'].mean():.2f}% |
| Total estimated exposed population | {hab['landslide_exposed_population_estimate'].sum():,} |

### Exposure by Hazard Class (Max Class per Habitation)

| Class | Name | Habitations |
|-------|------|-------------|
| 0 | No Hazard | {(hab['landslide_max_class'] == 0).sum()} |
| 1 | Very Low | {(hab['landslide_max_class'] == 1).sum()} |
| 2 | Low | {(hab['landslide_max_class'] == 2).sum()} |
| 3 | Moderate | {(hab['landslide_max_class'] == 3).sum()} |
| 4 | High | {(hab['landslide_max_class'] == 4).sum()} |
| 5 | Very High | {(hab['landslide_max_class'] == 5).sum()} |

### Top 10 Most Exposed Habitations

| Rank | Name | Exposure % | Max Class | Avg Class | Population | Est. Exposed Pop |
|------|------|------------|-----------|-----------|------------|------------------|
"""

for rank, (_, row) in enumerate(top10.iterrows(), 1):
    report += f"| {rank} | {row['Name']} | {row['landslide_exposure_pct']:.2f}% | {row['landslide_max_class']} ({CLASS_NAMES.get(row['landslide_max_class'], 'N/A')}) | {row['landslide_avg_class']:.2f} | {row['TOT_P']:,} | {row['landslide_exposed_population_estimate']:,} |\n"

report += f"""
## Validation

| Check | Status |
|-------|--------|
| 228 records | {'PASS' if len(hab) == 228 else 'FAIL'} |
| No duplicate IDs | {'PASS' if hab['Town/Village'].duplicated().sum() == 0 else 'FAIL'} |
| No missing geometry | {'PASS' if hab.geometry.isna().sum() == 0 else 'FAIL'} |
| Valid geometry | {'PASS' if hab.geometry.is_valid.all() else 'FAIL'} |
| Exposure 0-100% | {'PASS' if hab['landslide_exposure_pct'].between(0, 100).all() else 'FAIL'} |
| Overlap <= total area | {'PASS' if (hab['landslide_overlap_area'] <= hab['total_area_sqm'] + 0.001).all() else 'FAIL'} |
| No unknown classes | {'PASS' if hab['landslide_max_class'].isin([0,1,2,3,4,5]).all() else 'FAIL'} |

## Output Files

| File | Path |
|------|------|
| GeoJSON | `{OUT_GEOJSON}` |
| CSV | `{OUT_CSV}` |

## Methodology

1. **Habitation area**: Calculated in UTM Zone 46N (EPSG:32646) for accurate area in square meters
2. **Landslide overlap**: Spatial intersection between habitation polygon and NDEM hazard zone polygons
3. **Exposure percentage**: (Overlap Area / Total Area) x 100
4. **Max hazard class**: Highest grid_code (1-5) among all intersecting hazard zones
5. **Area-weighted average**: Sum(class x overlap_area) / Total overlap_area
6. **Exposed population**: TOT_P x Exposure% / 100 (ESTIMATE only - spatial overlap, NOT actual people affected)

## Important Notes

- This is a SPATIAL OVERLAP ESTIMATE, not actual landslide impact assessment
- NDEM hazard zones represent terrain susceptibility, not guaranteed landslide occurrence
- Grid code 1-5 mapping: 1=Very Low, 2=Low, 3=Moderate, 4=High, 5=Very High
- Habitations with zero exposure may still be at risk from unclassified areas
"""

with open(REPORT_PATH, 'w', encoding='utf-8') as f:
    f.write(report)
print(f'  Report: {REPORT_PATH}')

print('\n' + '='*70)
print('PROCESSING COMPLETE')
print('='*70)
print(f'  Habitations: {len(hab)}')
print(f'  Exposed: {len(exposed)}')
print(f'  Zero exposure: {len(zero_exp)}')
print(f'  Max: {max_name} ({max_val:.2f}%, Class {max_class})')
print(f'  GeoJSON: {OUT_GEOJSON}')
print(f'  CSV: {OUT_CSV}')
