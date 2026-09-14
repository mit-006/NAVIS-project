import json

with open(r"C:\Users\DELL\OneDrive\Documents\Default Project\navis\data\processed\kamrup_metro_flood_exposure.geojson", 'r') as f:
    g = json.load(f)

feats = g['features']
years = [1998, 1999, 2004, 2012, 2013]

print("Year-wise exposed counts:")
for y in years:
    exposed = sum(1 for f in feats if f['properties'].get(f'flood_pct_{y}', 0) > 0)
    print(f"  {y}: {exposed}")

print("\nFrequency distribution (years exposed -> count):")
dist = {}
for f in feats:
    freq = f['properties'].get('flood_years_exposed', 0)
    dist[freq] = dist.get(freq, 0) + 1
for k in sorted(dist.keys()):
    print(f"  {k}/5: {dist[k]}")
print(f"  Total: {sum(dist.values())}")

print("\ngetFrequencyDistribution() output (current):")
for k in sorted(dist.keys()):
    print(f"  years='{k}/5', count={dist[k]}")

print("\nWhat the chart SHOULD show (year-wise exposed):")
for y in years:
    exposed = sum(1 for f in feats if f['properties'].get(f'flood_pct_{y}', 0) > 0)
    print(f"  year={y}, count={exposed}")
