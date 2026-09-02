import json
import os

f = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', 'flood', 'extracted',
                 'NDEM_AS_Yearly_Aggregate_Flood_Innundation_1998_to_2013_2021.geojsonl')

print('=== Reading first 2000 valid lines ===')
years = {}
values = {}
rgb = {}
geom_types = {}
min_lon, max_lon = 180, -180
min_lat, max_lat = 90, -90
count = 0

def flatten_coords(c):
    if isinstance(c, (int, float)):
        return [c]
    out = []
    for item in c:
        out.extend(flatten_coords(item))
    return out

with open(f, 'r', encoding='utf-8') as fh:
    for line in fh:
        if count >= 2000:
            break
        try:
            rec = json.loads(line.strip())
        except:
            continue
        count += 1
        props = rec.get('properties', {})
        yr = props.get('year', 'unknown')
        val = props.get('value', 'unknown')
        years[yr] = years.get(yr, 0) + 1
        values[val] = values.get(val, 0) + 1
        key = (props.get('red'), props.get('green'), props.get('blue'))
        rgb[key] = rgb.get(key, 0) + 1
        gt = rec.get('geometry', {}).get('type', 'unknown')
        geom_types[gt] = geom_types.get(gt, 0) + 1
        flat = flatten_coords(rec.get('geometry', {}).get('coordinates', []))
        for i in range(0, len(flat) - 1, 2):
            lon, lat = flat[i], flat[i+1]
            if -180 <= lon <= 180 and -90 <= lat <= 90:
                min_lon = min(min_lon, lon)
                max_lon = max(max_lon, lon)
                min_lat = min(min_lat, lat)
                max_lat = max(max_lat, lat)

print(f'  Sampled {count} features')
print(f'\n  Years: {dict(sorted(years.items()))}')
print(f'  Value counts: {dict(sorted(values.items()))}')
print(f'  RGB colors:')
for k, v in sorted(rgb.items(), key=lambda x: -x[1]):
    print(f'    RGB({k[0]},{k[1]},{k[2]}): {v}')
print(f'  Geometry types: {geom_types}')
print(f'  Bounds: lon {min_lon:.4f}-{max_lon:.4f}, lat {min_lat:.4f}-{max_lat:.4f}')
