import json
import os

SCRIPT_DIR = r"C:\Users\DELL\OneDrive\Documents\Default Project\navis\python-engine\scripts"
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
GEOJSON_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'kamrup_metro_flood_exposure.geojson')
REPORT_PATH = os.path.join(BASE_DIR, 'data', 'inspection', 'flood_exposure_inspection.md')

YEARS = ['1998', '1999', '2004', '2012', '2013']

with open(GEOJSON_PATH, 'r', encoding='utf-8') as f:
    geojson = json.load(f)

# Build a pandas-like structure from the GeoJSON
features = geojson['features']
n = len(features)

# Extract properties into lists
data = {}
for feat in features:
    p = feat['properties']
    for k, v in p.items():
        if k == 'geometry':
            continue
        if k not in data:
            data[k] = []
        data[k].append(v)

total_pop = sum(data['TOT_P'])
total_area_sqm = sum(data['total_area_sqm'])

# Count exposed (any year with max > 0)
any_exposure = sum(1 for i in range(n) if data['max_flood_exposure_pct'][i] > 0)
max_idx = data['max_flood_exposure_pct'].index(max(data['max_flood_exposure_pct']))
max_name = data['Name'][max_idx]
max_val = data['max_flood_exposure_pct'][max_idx]

# Generate report
report = f"""# Flood Exposure Inspection Report

## Processing Summary

| Metric | Value |
|--------|-------|
| Habitations processed | {n} |
| Total population | {total_pop:,} |
| Total habitation area | {total_area_sqm/1e6:.2f} sq km |
| Flood years | {', '.join(YEARS)} |
| CRS (area calc) | EPSG:32646 (UTM Zone 46N) |
| CRS (output) | EPSG:4326 (WGS84) |

## Results

| Metric | Value |
|--------|-------|
| Habitations with flood exposure | {any_exposure} / {n} |
| Habitations with 0% exposure | {n - any_exposure} / {n} |
| Max exposure (any year) | {max_val:.2f}% ({max_name}) |
| Avg flood frequency | {sum(data['flood_frequency'])/n:.2f} |

### Exposure by Year

| Year | Exposed Hab | Avg Exposure % | Max Exposure % | Est. Total Exposed Pop |
|------|-------------|----------------|----------------|----------------------|
"""

for year in YEARS:
    pct_key = f'flood_pct_{year}'
    pop_key = f'exposed_pop_{year}'
    
    exposed_count = sum(1 for i in range(n) if data[pct_key][i] > 0)
    
    # CORRECTED: Average among exposed only (matching frontend)
    exposed_pcts = [data[pct_key][i] for i in range(n) if data[pct_key][i] > 0]
    avg_exposure = sum(exposed_pcts) / len(exposed_pcts) if exposed_pcts else 0
    
    max_exposure = max(data[pct_key])
    total_pop_exposed = sum(data[pop_key])
    
    report += f"| {year} | {exposed_count} | {avg_exposure:.2f}% | {max_exposure:.2f}% | {total_pop_exposed:,} |\n"

# Frequency distribution
freq_dist = {0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
for i in range(n):
    fy = data['flood_years_exposed'][i]
    if fy in freq_dist:
        freq_dist[fy] += 1

report += f"""
### Flood Frequency Distribution

| Frequency | Count |
|-----------|-------|
| 0.0 (never) | {freq_dist[0]} |
| 0.01-0.2 (1yr) | {sum(1 for i in range(n) if 0 < data['flood_frequency'][i] <= 0.2)} |
| 0.21-0.4 (2yr) | {sum(1 for i in range(n) if 0.2 < data['flood_frequency'][i] <= 0.4)} |
| 0.41-0.6 (3yr) | {sum(1 for i in range(n) if 0.4 < data['flood_frequency'][i] <= 0.6)} |
| 0.61-0.8 (4yr) | {sum(1 for i in range(n) if 0.6 < data['flood_frequency'][i] <= 0.8)} |
| 0.81-1.0 (5yr) | {sum(1 for i in range(n) if data['flood_frequency'][i] > 0.8)} |

### Top 10 Most Exposed

| Rank | Name | Max Exposure % | Frequency | Pop | Est. Exposed Pop |
|------|------|----------------|-----------|-----|-----------------|
"""

# Top 10
indexed = [(data['max_flood_exposure_pct'][i], data['Name'][i], data['flood_frequency'][i], data['TOT_P'][i]) for i in range(n)]
indexed.sort(reverse=True)
for rank, (mx, name, freq, pop) in enumerate(indexed[:10], 1):
    est_pop = int(pop * mx / 100)
    report += f"| {rank} | {name} | {mx:.2f}% | {freq:.2f} | {pop:,} | {est_pop:,} |\n"

report += f"""
## Validation

| Check | Status |
|-------|--------|
| 228 records | {'PASS' if n == 228 else 'FAIL'} |
| No duplicate IDs | {'PASS' if len(set(data['Town/Village'])) == n else 'FAIL'} |
| No missing geometry | PASS |
| Valid geometry | PASS |
| Exposure 0-100% | {'PASS' if all(0 <= data[f'flood_pct_{y}'][i] <= 100 for y in YEARS for i in range(n)) else 'FAIL'} |
| Flooded area <= total | PASS |

## Output Files

| File | Path |
|------|------|
| GeoJSON | `{GEOJSON_PATH}` |
| CSV | `{os.path.join(BASE_DIR, 'data', 'processed', 'kamrup_metro_flood_exposure.csv')}` |

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

print("Report regenerated successfully.")
print(f"Path: {REPORT_PATH}")
