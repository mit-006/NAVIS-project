import json
import os

f = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', 'flood', 'extracted',
                 'NDEM_AS_Yearly_Aggregate_Flood_Innundation_1998_to_2013_2021.geojsonl')

print('=== Counting total records ===')
count = 0
bad = 0
with open(f, 'r', encoding='utf-8') as fh:
    for line in fh:
        try:
            json.loads(line.strip())
            count += 1
        except:
            bad += 1
print(f'Valid records: {count}')
print(f'Bad records: {bad}')

print('\n=== Unique years and value counts ===')
years = {}
values = {}
with open(f, 'r', encoding='utf-8') as fh:
    for line in fh:
        try:
            rec = json.loads(line.strip())
        except:
            continue
        props = rec.get('properties', {})
        yr = props.get('year', 'unknown')
        val = props.get('value', 'unknown')
        years[yr] = years.get(yr, 0) + 1
        values[val] = values.get(val, 0) + 1
for yr in sorted(years.keys()):
    print(f'  Year {yr}: {years[yr]} features')
print(f'\nUnique values: {values}')

print('\n=== Geometry types ===')
geom_types = {}
with open(f, 'r', encoding='utf-8') as fh:
    for line in fh:
        try:
            rec = json.loads(line.strip())
        except:
            continue
        gt = rec.get('geometry', {}).get('type', 'unknown')
        geom_types[gt] = geom_types.get(gt, 0) + 1
for gt, cnt in geom_types.items():
    print(f'  {gt}: {cnt}')

print('\n=== Spatial extent (sampled) ===')
min_lon, max_lon = 180, -180
min_lat, max_lat = 90, -90
sampled = 0
with open(f, 'r', encoding='utf-8') as fh:
    for line in fh:
        try:
            rec = json.loads(line.strip())
        except:
            continue
        geom = rec.get('geometry', {})
        coords_str = json.dumps(geom.get('coordinates', []))
        import re
        lons = [float(x) for x in re.findall(r'[\d.]+', coords_str) if '.' in x]
        # Actually parse coordinates properly
        def extract_coords(c):
            if isinstance(c, (int, float)):
                return [(c,)]
            result = []
            for item in c:
                result.extend(extract_coords(item))
            return result
        
        flat = extract_coords(geom.get('coordinates', []))
        for pair_idx in range(0, len(flat) - 1, 2):
            lon = flat[pair_idx][0] if isinstance(flat[pair_idx], tuple) else flat[pair_idx]
            lat = flat[pair_idx + 1][0] if isinstance(flat[pair_idx + 1], tuple) else flat[pair_idx + 1]
            if isinstance(lon, (int, float)) and isinstance(lat, (int, float)):
                if -180 <= lon <= 180 and -90 <= lat <= 90:
                    min_lon = min(min_lon, lon)
                    max_lon = max(max_lon, lon)
                    min_lat = min(min_lat, lat)
                    max_lat = max(max_lat, lat)
        sampled += 1
        if sampled >= 1000:
            break
print(f'  Sampled {sampled} features')
print(f'  Longitude: {min_lon:.4f} to {max_lon:.4f}')
print(f'  Latitude: {min_lat:.4f} to {max_lat:.4f}')
