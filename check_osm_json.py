"""Check OSM Overpass JSON structure"""
import json

f = 'C:/Users/DELL/OneDrive/Documents/Default Project/resqmap/data/raw/relocation/osm_roads/kamrup_metro_roads.json'
with open(f, 'r') as fh:
    data = json.load(fh)

elements = data.get('elements', [])
print(f"Total elements: {len(elements)}")

types = {}
for e in elements:
    t = e['type']
    types[t] = types.get(t, 0) + 1
print(f"Types: {types}")

# Check a sample way
ways = [e for e in elements if e['type'] == 'way']
if ways:
    w = ways[0]
    print(f"\nSample way:")
    print(f"  ID: {w['id']}")
    print(f"  Nodes: {w.get('nodes', [])[:5]}...")
    print(f"  Tags: {w.get('tags', {})}")
    
    # Check if nodes have lat/lon
    node_ids = w.get('nodes', [])[:3]
    for nid in node_ids:
        for e in elements:
            if e['type'] == 'node' and e['id'] == nid:
                print(f"  Node {nid}: lat={e.get('lat')}, lon={e.get('lon')}")
                break
        else:
            print(f"  Node {nid}: NOT FOUND in elements")

# Check if nodes are separate
nodes = [e for e in elements if e['type'] == 'node']
print(f"\nNodes count: {len(nodes)}")
if nodes:
    n = nodes[0]
    print(f"Sample node: id={n['id']}, lat={n.get('lat')}, lon={n.get('lon')}")
