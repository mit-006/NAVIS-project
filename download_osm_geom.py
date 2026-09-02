"""Re-download OSM roads with geometry included"""
import os
import requests
import json
import time

BASE = 'C:/Users/DELL/OneDrive/Documents/Default Project/resqmap'

with open(f'{BASE}/data/raw/relocation/bbox.json', 'r') as f:
    bbox = json.load(f)

s, w, n, e = bbox['south'], bbox['west'], bbox['north'], bbox['east']

# Use out geom to get geometry directly (includes lat/lon in ways)
overpass_query = f"""
[out:json][timeout:300];
(
  way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential"]({s},{w},{n},{e});
);
out geom;
"""

print("Re-downloading OSM roads with geometry...")
print(f"Bounding box: S={s:.4f} W={w:.4f} N={n:.4f} E={e:.4f}")

overpass_urls = [
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

output_file = f'{BASE}/data/raw/relocation/osm_roads/kamrup_metro_roads.json'

for url in overpass_urls:
    print(f"\nTrying: {url}")
    try:
        start = time.time()
        r = requests.post(url, data={'data': overpass_query}, timeout=600)
        print(f"  Status: {r.status_code}")
        
        if r.status_code == 200:
            data = r.json()
            elements = data.get('elements', [])
            
            # Check if ways have geometry
            ways = [e for e in elements if e['type'] == 'way']
            if ways and 'geometry' in ways[0]:
                print(f"  SUCCESS: {len(ways)} ways with geometry")
                
                # Save
                with open(output_file, 'w') as f:
                    json.dump(data, f)
                
                file_size = os.path.getsize(output_file)
                elapsed = time.time() - start
                print(f"  Saved: {output_file} ({file_size:,} bytes)")
                print(f"  Time: {elapsed:.1f}s")
                
                # Quick stats
                road_types = {}
                for way in ways:
                    tags = way.get('tags', {})
                    hw = tags.get('highway', 'unknown')
                    road_types[hw] = road_types.get(hw, 0) + 1
                
                print(f"\n  Road type distribution:")
                for rt, count in sorted(road_types.items(), key=lambda x: -x[1]):
                    print(f"    {rt}: {count}")
                break
            else:
                print(f"  No geometry in ways. Sample way keys: {list(ways[0].keys()) if ways else 'N/A'}")
        elif r.status_code == 429:
            print("  Rate limited, waiting 60s...")
            time.sleep(60)
        else:
            print(f"  Response: {r.text[:200]}")
    except Exception as e:
        print(f"  Error: {e}")
