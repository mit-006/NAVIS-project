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
print(f'\nUnique value/frequency counts: {values}')

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

print('\n=== Red/Green/Blue values (color coding) ===')
rgb = {}
with open(f, 'r', encoding='utf-8') as fh:
    for i, line in enumerate(fh):
        if i >= 10000:
            break
        try:
            rec = json.loads(line.strip())
        except:
            continue
        props = rec.get('properties', {})
        key = (props.get('red'), props.get('green'), props.get('blue'))
        rgb[key] = rgb.get(key, 0) + 1
for k, v in sorted(rgb.items(), key=lambda x: -x[1]):
    print(f'  RGB({k[0]},{k[1]},{k[2]}): {v} features')
