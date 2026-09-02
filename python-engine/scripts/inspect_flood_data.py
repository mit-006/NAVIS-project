import json
import os
import sys

f = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', 'flood', 'extracted',
                 'NDEM_AS_Yearly_Aggregate_Flood_Innundation_1998_to_2013_2021.geojsonl')

print('=== First 10 records ===')
with open(f, 'r', encoding='utf-8') as fh:
    for i, line in enumerate(fh):
        if i >= 10:
            break
        rec = json.loads(line.strip())
        print(f'\nRecord {i+1}:')
        print(f'  Type: {rec.get("type")}')
        if 'geometry' in rec:
            geom = rec['geometry']
            print(f'  Geometry type: {geom.get("type")}')
            coords = geom.get('coordinates', [])
            if coords:
                print(f'  Coords preview: {str(coords)[:300]}')
        if 'properties' in rec:
            props = rec['properties']
            print(f'  Properties keys: {list(props.keys())}')
            print(f'  Properties: {json.dumps(props)}')

print('\n\n=== Counting total records ===')
count = 0
with open(f, 'r', encoding='utf-8') as fh:
    for line in fh:
        count += 1
print(f'Total records: {count}')

print('\n=== All unique property keys ===')
all_keys = set()
with open(f, 'r', encoding='utf-8') as fh:
    for i, line in enumerate(fh):
        if i >= 500:
            break
        rec = json.loads(line.strip())
        if 'properties' in rec:
            all_keys.update(rec['properties'].keys())
print(f'All keys: {sorted(all_keys)}')

print('\n=== Sample property values from first 50 records ===')
with open(f, 'r', encoding='utf-8') as fh:
    for i, line in enumerate(fh):
        if i >= 50:
            break
        rec = json.loads(line.strip())
        if 'properties' in rec:
            props = rec['properties']
            vals = {k: v for k, v in props.items() if v is not None}
            if vals:
                print(f'  Record {i}: {json.dumps(vals)}')
                break

print('\n=== Unique years ===')
years = set()
with open(f, 'r', encoding='utf-8') as fh:
    for line in fh:
        rec = json.loads(line.strip())
        props = rec.get('properties', {})
        for k in props:
            if 'year' in k.lower() or 'date' in k.lower() or 'time' in k.lower():
                years.add((k, str(props[k])))
for k, v in sorted(years):
    print(f'  {k}: {v}')

print('\n=== Geometry types ===')
geom_types = {}
with open(f, 'r', encoding='utf-8') as fh:
    for line in fh:
        rec = json.loads(line.strip())
        gt = rec.get('geometry', {}).get('type', 'unknown')
        geom_types[gt] = geom_types.get(gt, 0) + 1
for gt, cnt in geom_types.items():
    print(f'  {gt}: {cnt}')
