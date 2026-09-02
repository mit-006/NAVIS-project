import json
import os

f = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', 'flood', 'extracted',
                 'NDEM_AS_Yearly_Aggregate_Flood_Innundation_1998_to_2013_2021.geojsonl')

# Get file size
fsize = os.path.getsize(f)
print(f'File size: {fsize/1024/1024:.1f} MB')

# Sample from different offsets in the file
offsets = [0, fsize//6, fsize//3, fsize//2, 2*fsize//3, 5*fsize//6]
years_all = set()
values_all = set()
rgb_all = set()
geom_all = set()
total_valid = 0

def flatten_coords(c):
    if isinstance(c, (int, float)):
        return [c]
    out = []
    for item in c:
        out.extend(flatten_coords(item))
    return out

for offset in offsets:
    sampled = 0
    with open(f, 'r', encoding='utf-8') as fh:
        fh.seek(offset)
        fh.readline()  # skip partial line
        for line in fh:
            if sampled >= 500:
                break
            try:
                rec = json.loads(line.strip())
            except:
                continue
            sampled += 1
            total_valid += 1
            props = rec.get('properties', {})
            years_all.add(props.get('year'))
            values_all.add(props.get('value'))
            rgb_all.add((props.get('red'), props.get('green'), props.get('blue')))
            geom_all.add(rec.get('geometry', {}).get('type'))
    print(f'  Offset {offset//1024//1024}MB: sampled {sampled} records')

print(f'\nTotal sampled across all offsets: {total_valid}')
print(f'All years: {sorted(years_all)}')
print(f'All values: {sorted([v for v in values_all if v is not None])}')
print(f'All RGB: {sorted([r for r in rgb_all if r[0] is not None])}')
print(f'All geometry types: {sorted([g for g in geom_all if g is not None])}')

print('\n=== Counting total records (fast binary count) ===')
total_lines = 0
with open(f, 'rb') as fh:
    for chunk in iter(lambda: fh.read(4*1024*1024), b''):
        total_lines += chunk.count(b'\n')
print(f'Total lines: {total_lines}')
