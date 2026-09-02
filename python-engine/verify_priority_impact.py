import json

with open(r"C:\Users\DELL\OneDrive\Documents\Default Project\resqmap\data\processed\kamrup_metro_flood_exposure.geojson", 'r') as f:
    g = json.load(f)

feats = g['features']
print(f"Features: {len(feats)}")

# Verify priority inputs don't depend on year-wise averages
# Priority formula: Score = (max_flood_exposure_pct * 0.4) + (flood_frequency * 100 * 0.3) + (max_exposed_pop_ratio * 100 * 0.3)

FLOOD_YEARS = [1998, 1999, 2004, 2012, 2013]
total_pop = 0
max_exposure_pcts = []
frequencies = []

for feat in feats:
    p = feat['properties']
    total_pop += p.get('TOT_P', 0)
    max_exposure_pcts.append(p.get('max_flood_exposure_pct', 0))
    frequencies.append(p.get('flood_frequency', 0))

print(f"\nTotal population: {total_pop:,}")
print(f"Max exposure pct: min={min(max_exposure_pcts):.2f} max={max(max_exposure_pcts):.2f} mean={sum(max_exposure_pcts)/len(max_exposure_pcts):.2f}")
print(f"Flood frequency: min={min(frequencies):.2f} max={max(frequencies):.2f} mean={sum(frequencies)/len(frequencies):.2f}")

# Verify: priority uses max_flood_exposure_pct (per-habitation max), NOT year-wise averages
# The year-wise avg exposure is ONLY used in the Overview display and Historical Analysis display
# Priority scores are NOT affected by the avg exposure discrepancy

# Check what the "previously reported" values actually were
# They don't match exposed-only avg OR all-228 avg
# Check if they might be from a DIFFERENT version of the data

# Let's check if any old inspection scripts computed differently
print("\n--- Checking for stale values ---")
print("Previously reported (audit spec):")
print("  1998: 129 exposed, Avg 23.14%, Max 100.00%, Pop 133,933")
print("  1999: 131 exposed, Avg 24.25%, Max 100.00%, Pop 136,550")
print("  2004: 125 exposed, Avg 20.36%, Max 100.00%, Pop 116,135")
print("  2012: 102 exposed, Avg 13.92%, Max 82.45%, Pop 84,679")
print("  2013: 82 exposed, Avg 9.24%, Max 63.76%, Pop 52,059")
print()
print("Current inspection report (all-228 avg):")
print("  1998: 129 exposed, Avg 23.70%, Max 100.00%, Pop 147,064")
print("  1999: 131 exposed, Avg 16.53%, Max 93.81%, Pop 111,668")
print("  2004: 125 exposed, Avg 24.16%, Max 100.00%, Pop 127,934")
print("  2012: 102 exposed, Avg 13.98%, Max 100.00%, Pop 67,831")
print("  2013: 82 exposed, Avg 10.39%, Max 100.00%, Pop 46,115")
print()
print("Frontend computes (exposed-only avg):")
for year in FLOOD_YEARS:
    pct_key = f'flood_pct_{year}'
    pop_key = f'exposed_pop_{year}'
    exposed = [(f['properties'][pct_key], f['properties'][pop_key], f['properties']['TOT_P'])
               for f in feats if f['properties'].get(pct_key, 0) > 0]
    avg = sum(e[0] for e in exposed) / len(exposed) if exposed else 0
    mx = max(e[0] for e in exposed) if exposed else 0
    pop = sum(e[1] for e in exposed)
    print(f"  {year}: {len(exposed)} exposed, Avg {avg:.2f}%, Max {mx:.2f}%, Pop {pop:,}")

# The root cause: inspection report used .mean() on ALL 228 values (including 76 zeros)
# Frontend uses mean of only exposed values (pct > 0)
# The "previously reported" values are from a THIRD source that doesn't match either
