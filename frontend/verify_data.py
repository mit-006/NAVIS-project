import json;
g = json.load(open(r"C:\Users\DELL\OneDrive\Documents\Default Project\resqmap\data\processed\kamrup_metro_flood_exposure.geojson"))
r = json.load(open(r"C:\Users\DELL\OneDrive\Documents\Default Project\resqmap\data\processed\preliminary_relocation_candidates.geojson"))
print("Habitations:", len(g["features"]))
exposed = sum(1 for f in g["features"] if f["properties"].get("flood_years_exposed", 0) > 0)
print("Exposed:", exposed)
print("Candidates:", len(r["features"]))
for y in [1998, 1999, 2004, 2012, 2013]:
    c = sum(1 for f in g["features"] if f["properties"].get(f"flood_pct_{y}", 0) > 0)
    print(f"  {y}: {c}")
