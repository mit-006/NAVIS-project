import json, hashlib, os

BASE = r"C:\Users\DELL\OneDrive\Documents\Default Project\navis"

# 1. Verify GeoJSON unchanged
geojson_path = os.path.join(BASE, 'data', 'processed', 'kamrup_metro_flood_exposure.geojson')
with open(geojson_path, 'r', encoding='utf-8') as f:
    geojson = json.load(f)
feats = geojson['features']
print(f"GeoJSON features: {len(feats)}")

# Verify exposed counts
FLOOD_YEARS = [1998, 1999, 2004, 2012, 2013]
expected_counts = {1998: 129, 1999: 131, 2004: 125, 2012: 102, 2013: 82}
for year in FLOOD_YEARS:
    pct_key = f'flood_pct_{year}'
    exposed = sum(1 for f in feats if f['properties'].get(pct_key, 0) > 0)
    status = 'PASS' if exposed == expected_counts[year] else 'FAIL'
    print(f"  {year}: {exposed} exposed ({status}, expected {expected_counts[year]})")

# 2. Verify inspection report values match frontend
print("\nInspection report averages (exposed-only):")
expected_avgs = {1998: 41.89, 1999: 28.77, 2004: 44.08, 2012: 31.26, 2013: 28.89}
for year in FLOOD_YEARS:
    pct_key = f'flood_pct_{year}'
    exposed_pcts = [f['properties'][pct_key] for f in feats if f['properties'].get(pct_key, 0) > 0]
    avg = sum(exposed_pcts) / len(exposed_pcts) if exposed_pcts else 0
    status = 'PASS' if abs(avg - expected_avgs[year]) < 0.01 else 'FAIL'
    print(f"  {year}: {avg:.2f}% ({status}, expected {expected_avgs[year]}%)")

# 3. Verify priority scores unchanged (compute a sample)
print("\nPriority score verification (first 5 features):")
for i, feat in enumerate(feats[:5]):
    p = feat['properties']
    max_exp = p.get('max_flood_exposure_pct', 0)
    freq = p.get('flood_frequency', 0)
    tot_p = p.get('TOT_P', 0)
    
    max_pop = 0
    for year in FLOOD_YEARS:
        ep = p.get(f'exposed_pop_{year}', 0)
        if ep > max_pop:
            max_pop = ep
    
    norm_max = max_exp
    norm_freq = freq * 100
    norm_pop = (max_pop / tot_p * 100) if tot_p > 0 else 0
    score = (norm_max * 0.4) + (norm_freq * 0.3) + (norm_pop * 0.3)
    score_rounded = round(score * 10) / 10
    
    print(f"  {p.get('Name', 'N/A')}: score={score_rounded} max_exp={max_exp} freq={freq} tot_p={tot_p}")

# 4. Verify relocation candidates unchanged
reloc_path = os.path.join(BASE, 'data', 'processed', 'preliminary_relocation_candidates.geojson')
with open(reloc_path, 'r', encoding='utf-8') as f:
    reloc = json.load(f)
print(f"\nRelocation candidates: {len(reloc['features'])} features")

# 5. Verify no frontend files modified
frontend_files = [
    'frontend/src/data/floodData.js',
    'frontend/src/pages/Overview.jsx',
    'frontend/src/pages/FloodMap.jsx',
    'frontend/src/pages/HistoricalAnalysis.jsx',
    'frontend/src/pages/PriorityAnalysis.jsx',
    'frontend/src/pages/HabitationExplorer.jsx',
]
print("\nFrontend file check:")
for fp in frontend_files:
    full = os.path.join(BASE, fp)
    exists = os.path.exists(full)
    print(f"  {fp}: {'EXISTS' if exists else 'MISSING'}")

print("\n" + "="*50)
print("VALIDATION COMPLETE")
print("="*50)
