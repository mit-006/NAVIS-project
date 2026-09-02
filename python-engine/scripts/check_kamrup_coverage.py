import json
import os

f = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', 'flood', 'extracted',
                 'NDEM_AS_Yearly_Aggregate_Flood_Innundation_1998_to_2013_2021.geojsonl')

# Kamrup Metro approximate bounds: lon 91.5-92.0, lat 26.0-26.3
# The data seems to be whole Assam. Check if anything falls in Kamrup Metro area.
def flatten_coords(c):
    if isinstance(c, (int, float)):
        return [c]
    out = []
    for item in c:
        out.extend(flatten_coords(item))
    return out

count = 0
kamrup_count = 0
years_in_kamrup = {}
fsize = os.path.getsize(f)

# Sample across entire file
offsets = [0, fsize//8, fsize//4, 3*fsize//8, fsize//2, 5*fsize//8, 3*fsize//4, 7*fsize//8]
for offset in offsets:
    sampled = 0
    with open(f, 'r', encoding='utf-8') as fh:
        fh.seek(offset)
        fh.readline()
        for line in fh:
            if sampled >= 2000:
                break
            try:
                rec = json.loads(line.strip())
            except:
                continue
            sampled += 1
            count += 1
            geom = rec.get('geometry', {})
            flat = flatten_coords(geom.get('coordinates', []))
            for i in range(0, len(flat) - 1, 2):
                lon, lat = flat[i], flat[i+1]
                # Kamrup Metro approximate bbox
                if 91.0 <= lon <= 92.5 and 25.5 <= lat <= 26.5:
                    kamrup_count += 1
                    yr = rec.get('properties', {}).get('year', 'unknown')
                    years_in_kamrup[yr] = years_in_kamrup.get(yr, 0) + 1
                    break

print(f'Total sampled: {count}')
print(f'Features overlapping Kamrup Metro area: {kamrup_count}')
print(f'Years with Kamrup Metro data: {years_in_kamrup}')
