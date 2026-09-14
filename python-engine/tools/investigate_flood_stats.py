import json

BBOX = {"south": 25.9730, "north": 26.3189, "west": 91.5053, "east": 92.2287}
FLOOD_YEARS = [1998, 1999, 2004, 2012, 2013]

# Load processed GeoJSON
with open(r"C:\Users\DELL\OneDrive\Documents\Default Project\navis\data\processed\kamrup_metro_flood_exposure.geojson", 'r') as f:
    geojson = json.load(f)

features = geojson['features']
print(f"Total features: {len(features)}")

# Show all property keys for first feature
print(f"\nAll property keys ({len(features[0]['properties'])} fields):")
for k, v in features[0]['properties'].items():
    print(f"  {k}: {type(v).__name__} = {repr(v)[:80]}")

# STEP 1: Identify relevant fields
print("\n" + "=" * 60)
print("STEP 1: RELEVANT FIELDS")
print("=" * 60)

# Check what fields exist for each year
for year in FLOOD_YEARS:
    pct_key = f'flood_pct_{year}'
    pop_key = f'exposed_pop_{year}'
    area_key = f'flood_area_{year}'
    
    # Check first feature
    f0 = features[0]['properties']
    print(f"\nYear {year}:")
    print(f"  {pct_key}: {f0.get(pct_key, 'MISSING')}")
    print(f"  {pop_key}: {f0.get(pop_key, 'MISSING')}")
    print(f"  {area_key}: {f0.get(area_key, 'MISSING')}")

print(f"\n  TOT_P: {features[0]['properties'].get('TOT_P', 'MISSING')}")
print(f"  max_flood_exposure_pct: {features[0]['properties'].get('max_flood_exposure_pct', 'MISSING')}")
print(f"  flood_frequency: {features[0]['properties'].get('flood_frequency', 'MISSING')}")
print(f"  flood_years_exposed: {features[0]['properties'].get('flood_years_exposed', 'MISSING')}")

# STEP 2: Independent calculations
print("\n" + "=" * 60)
print("STEP 2: INDEPENDENT CALCULATIONS FROM GEOJSON")
print("=" * 60)

print("\nDefinition A: Average among EXPOSED only (flood_pct > 0)")
print("-" * 60)
for year in FLOOD_YEARS:
    pct_key = f'flood_pct_{year}'
    pop_key = f'exposed_pop_{year}'
    
    exposed_count = 0
    total_pct = 0
    max_pct = 0
    max_name = ''
    total_pop = 0
    
    for feat in features:
        p = feat['properties']
        pct = p.get(pct_key, 0) or 0
        pop = p.get(pop_key, 0) or 0
        if pct > 0:
            exposed_count += 1
            total_pct += pct
            total_pop += pop
        if pct > max_pct:
            max_pct = pct
            max_name = p.get('Name', '')
    
    avg = total_pct / exposed_count if exposed_count > 0 else 0
    print(f"{year}: {exposed_count} exposed | Avg {avg:.2f}% | Max {max_pct:.2f}% ({max_name}) | Pop {total_pop:,}")

print("\nDefinition B: Average across ALL 228 habitations")
print("-" * 60)
for year in FLOOD_YEARS:
    pct_key = f'flood_pct_{year}'
    pop_key = f'exposed_pop_{year}'
    
    total_pct = 0
    total_pop = 0
    max_pct = 0
    
    for feat in features:
        p = feat['properties']
        pct = p.get(pct_key, 0) or 0
        pop = p.get(pop_key, 0) or 0
        total_pct += pct
        total_pop += pop
        if pct > max_pct:
            max_pct = pct
    
    avg_all = total_pct / len(features)
    print(f"{year}: Avg(all 228) {avg_all:.2f}% | Max {max_pct:.2f}% | Pop {total_pop:,}")

print("\nDefinition C: Population-weighted average exposure")
print("-" * 60)
for year in FLOOD_YEARS:
    pct_key = f'flood_pct_{year}'
    pop_key = f'exposed_pop_{year}'
    
    weighted_sum = 0
    total_pop = 0
    
    for feat in features:
        p = feat['properties']
        pct = p.get(pct_key, 0) or 0
        pop = p.get('TOT_P', 0) or 0
        weighted_sum += pct * pop
        total_pop += pop
    
    weighted_avg = weighted_sum / total_pop if total_pop > 0 else 0
    print(f"{year}: Pop-weighted avg {weighted_avg:.2f}%")

# STEP 3: Check for stale fields
print("\n" + "=" * 60)
print("STEP 3: CHECK FOR STALE/UNUSED FIELDS")
print("=" * 60)

# Check if there are any 'avg' or 'summary' fields in properties
f0 = features[0]['properties']
summary_fields = [k for k in f0.keys() if 'avg' in k.lower() or 'summary' in k.lower() or 'total' in k.lower() or 'overall' in k.lower()]
print(f"Summary-like fields in properties: {summary_fields}")

# Check all field names
print(f"\nAll {len(f0)} field names:")
for k in sorted(f0.keys()):
    print(f"  {k}")

# STEP 4: Verify specific previously reported values
print("\n" + "=" * 60)
print("STEP 4: COMPARISON WITH PREVIOUSLY REPORTED VALUES")
print("=" * 60)

# Previously reported (from audit spec):
prev_reported = {
    1998: {'count': 129, 'avg': 23.14, 'max': 100.00, 'pop': 133933},
    1999: {'count': 131, 'avg': 24.25, 'max': 100.00, 'pop': 136550},
    2004: {'count': 125, 'avg': 20.36, 'max': 100.00, 'pop': 116135},
    2012: {'count': 102, 'avg': 13.92, 'max': 82.45, 'pop': 84679},
    2013: {'count': 82, 'avg': 9.24, 'max': 63.76, 'pop': 52059},
}

# From inspection report:
inspection = {
    1998: {'count': 129, 'avg': 23.70, 'max': 100.00, 'pop': 147064},
    1999: {'count': 131, 'avg': 16.53, 'max': 93.81, 'pop': 111668},
    2004: {'count': 125, 'avg': 24.16, 'max': 100.00, 'pop': 127934},
    2012: {'count': 102, 'avg': 13.98, 'max': 100.00, 'pop': 67831},
    2013: {'count': 82, 'avg': 10.39, 'max': 100.00, 'pop': 46115},
}

# Our computed (exposed only):
computed_exposed = {}
for year in FLOOD_YEARS:
    pct_key = f'flood_pct_{year}'
    pop_key = f'exposed_pop_{year}'
    exposed_count = 0
    total_pct = 0
    max_pct = 0
    total_pop = 0
    for feat in features:
        p = feat['properties']
        pct = p.get(pct_key, 0) or 0
        pop = p.get(pop_key, 0) or 0
        if pct > 0:
            exposed_count += 1
            total_pct += pct
            total_pop += pop
        if pct > max_pct:
            max_pct = pct
    avg = total_pct / exposed_count if exposed_count > 0 else 0
    computed_exposed[year] = {'count': exposed_count, 'avg': round(avg, 2), 'max': round(max_pct, 2), 'pop': total_pop}

print(f"\n{'Year':<6} {'Metric':<12} {'Computed':>12} {'Inspection':>12} {'Prev.Rep.':>12} {'Match?':>8}")
print("-" * 70)
for year in FLOOD_YEARS:
    for metric, label in [('count', 'Count'), ('avg', 'Avg%'), ('max', 'Max%'), ('pop', 'Population')]:
        c = computed_exposed[year][metric]
        i = inspection[year][metric]
        p = prev_reported[year][metric]
        match_c_i = 'YES' if c == i or (isinstance(c, float) and abs(c - i) < 0.1) else 'NO'
        match_c_p = 'YES' if c == p or (isinstance(c, float) and abs(c - p) < 0.1) else 'NO'
        both_match = 'BOTH' if match_c_i == 'YES' and match_c_p == 'YES' else ('C=I' if match_c_i == 'YES' else ('C=P' if match_c_p == 'YES' else 'NONE'))
        print(f"{year:<6} {label:<12} {str(c):>12} {str(i):>12} {str(p):>12} {both_match:>8}")
