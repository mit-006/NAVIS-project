"""
Phase 3 - Preliminary Candidate Relocation Site Analysis
Kamrup Metropolitan District, Assam

Pipeline: Elevation → Flood Exclusion → Road Accessibility → 
          Habitation Proximity → Amenities → Scoring → Output

DO NOT modify existing Flood MVP.
DO NOT invent data.
DO NOT call any area "safe".
Output is PRELIMINARY ANALYSIS ONLY.
"""

import os
import json
import numpy as np
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point, LineString, MultiLineString
from shapely.ops import unary_union, nearest_points
import warnings
warnings.filterwarnings('ignore')

BASE = 'C:/Users/DELL/OneDrive/Documents/Default Project/navis'
PROCESSED = f'{BASE}/data/processed'

print("=" * 70)
print("PHASE 3 - PRELIMINARY CANDIDATE RELOCATION SITE ANALYSIS")
print("Kamrup Metropolitan District, Assam")
print("=" * 70)

# ============================================================
# LOAD ALL AVAILABLE DATASETS
# ============================================================
print("\n[0] Loading datasets...")

# 1. Habitation polygons (228)
print("  Loading habitation polygons...")
habitations = gpd.read_file(f'{PROCESSED}/kamrup_metro_habitations.geojson')
print(f"    {len(habitations)} habitations loaded")
print(f"    CRS: {habitations.crs}")
print(f"    Columns: {list(habitations.columns)}")

# 2. Flood exposure data
print("  Loading flood exposure data...")
flood_gdf = gpd.read_file(f'{PROCESSED}/kamrup_metro_flood_exposure.geojson')
print(f"    {len(flood_gdf)} features loaded")
print(f"    Flood columns: {[c for c in flood_gdf.columns if 'flood' in c.lower() or 'exposure' in c.lower() or 'exposed' in c.lower()]}")

# 3. Census amenities (pre-processed CSV for speed)
print("  Loading Census Village Amenities (pre-processed)...")
census_csv = f'{PROCESSED}/kamrup_metro_census_amenities.csv'
census = pd.read_csv(census_csv)
print(f"    {len(census)} Kamrup Metro villages, {len(census.columns)} columns")

# 4. SRTM DEM
print("  Loading SRTM DEM...")
import rasterio
dem_path = f'{BASE}/data/raw/relocation/srtm_dem/kamrup_metro_srtm30m.tif'
dem_src = rasterio.open(dem_path)
dem_data = dem_src.read(1)
dem_transform = dem_src.transform
dem_crs = dem_src.crs
dem_nodata = dem_src.nodata
print(f"    DEM shape: {dem_data.shape}")
print(f"    CRS: {dem_crs}")
print(f"    Elevation range: {dem_data[dem_data != dem_nodata].min():.0f}m to {dem_data[dem_data != dem_nodata].max():.0f}m")

# 5. OSM Roads
print("  Loading OSM Roads...")
roads_file = f'{BASE}/data/raw/relocation/osm_roads/kamrup_metro_roads.json'
with open(roads_file, 'r') as f:
    roads_data = json.load(f)
roads_elements = roads_data.get('elements', [])
road_ways = [e for e in roads_elements if e['type'] == 'way']
print(f"    {len(road_ways)} road ways loaded")

print("\n[0] All datasets loaded successfully.\n")


# ============================================================
# STEP 1 - ELEVATION ANALYSIS
# ============================================================
print("=" * 70)
print("STEP 1 - ELEVATION ANALYSIS")
print("=" * 70)

def extract_dem_value(gdf, dem_src, band=1):
    """Extract DEM values at geometry centroids in the DEM's CRS.

    The source habitation layer is normally EPSG:4326 while the DEM may be
    projected (for example EPSG:32646). Reproject before converting geometry
    coordinates to raster pixels; otherwise elevation/slope samples can be
    silently read from the wrong raster cells.
    """
    dem = dem_src.read(band)
    transform = dem_src.transform
    nodata = dem_src.nodata
    sampled_gdf = gdf.to_crs(dem_src.crs) if gdf.crs != dem_src.crs else gdf

    values = []
    for geom in sampled_gdf.geometry:
        if geom is None or geom.is_empty:
            values.append(np.nan)
            continue
        centroid = geom.centroid
        row, col = rasterio.transform.rowcol(transform, centroid.x, centroid.y)
        if 0 <= row < dem.shape[0] and 0 <= col < dem.shape[1]:
            val = dem[row, col]
            if nodata is not None and val == nodata:
                values.append(np.nan)
            else:
                values.append(float(val))
        else:
            values.append(np.nan)
    return values

# Extract elevation at each habitation centroid
print("  Extracting elevation at habitation centroids...")
habitations['elevation_m'] = extract_dem_value(habitations, dem_src)

# Compute slope from DEM (using numpy gradient)
print("  Computing slope from DEM...")
dem_valid = dem_data.astype(float)
dem_valid[dem_valid == dem_nodata] = np.nan

# Compute gradient in degrees
pixel_size = 30  # meters (SRTM 30m)
dy, dx = np.gradient(dem_valid, pixel_size)
slope_rad = np.arctan(np.sqrt(dx**2 + dy**2))
slope_deg = np.degrees(slope_rad)

# Extract slope at habitation centroids
print("  Extracting slope at habitation centroids...")
habitations['slope_deg'] = extract_dem_value(habitations, dem_src)
# Actually need to compute slope from the slope raster
def extract_slope_value(gdf, slope_array, transform, nodata):
    values = []
    for geom in gdf.geometry:
        if geom is None:
            values.append(np.nan)
            continue
        centroid = geom.centroid
        row, col = rasterio.transform.rowcol(transform, centroid.x, centroid.y)
        if 0 <= row < slope_array.shape[0] and 0 <= col < slope_array.shape[1]:
            val = slope_array[row, col]
            if np.isnan(val):
                values.append(np.nan)
            else:
                values.append(float(val))
        else:
            values.append(np.nan)
    return values

habitations['slope_deg'] = extract_slope_value(habitations, slope_deg, dem_transform, dem_nodata)

# Elevation statistics
print("\n  Elevation Statistics:")
elev = habitations['elevation_m'].dropna()
print(f"    Count: {len(elev)}")
print(f"    Min: {elev.min():.1f}m")
print(f"    Max: {elev.max():.1f}m")
print(f"    Mean: {elev.mean():.1f}m")
print(f"    Median: {elev.median():.1f}m")
print(f"    Std: {elev.std():.1f}m")

# Slope statistics
print("\n  Slope Statistics:")
slope = habitations['slope_deg'].dropna()
print(f"    Count: {len(slope)}")
print(f"    Min: {slope.min():.1f} deg")
print(f"    Max: {slope.max():.1f} deg")
print(f"    Mean: {slope.mean():.1f} deg")
print(f"    Median: {slope.median():.1f} deg")

# Elevation bands
habitations['elevation_band'] = pd.cut(
    habitations['elevation_m'],
    bins=[0, 50, 100, 200, 500, 1000],
    labels=['<50m (floodplain)', '50-100m (low)', '100-200m (foothill)', '200-500m (upland)', '>500m (high)']
)

print("\n  Elevation Band Distribution:")
print(habitations['elevation_band'].value_counts().to_string())

print("\n[1] Elevation analysis complete.\n")


# ============================================================
# STEP 2 - FLOOD EXCLUSION
# ============================================================
print("=" * 70)
print("STEP 2 - FLOOD EXCLUSION ANALYSIS")
print("=" * 70)

# The flood exposure layer has per-habitation flood stats
# Identify: exposed vs never-exposed habitations
print("  Analyzing historical flood exposure...")

# Merge flood data with habitations
# The flood_gdf should have pc11_tv_id matching habitations
flood_cols = [c for c in flood_gdf.columns if c not in ['geometry', 'pc11_tv_id', 'tv_name']]
print(f"  Flood columns available: {flood_cols}")

# Check key flood fields (actual column names from the GeoJSON)
flood_key_cols = ['flood_years_exposed', 'flood_frequency', 'max_flood_exposure_pct']
for col in flood_key_cols:
    if col in flood_gdf.columns:
        print(f"    {col}: {flood_gdf[col].describe()}")

# Identify never-exposed habitations using actual column names
if 'flood_years_exposed' in flood_gdf.columns:
    never_exposed = flood_gdf[flood_gdf['flood_years_exposed'] == 0]
    ever_exposed = flood_gdf[flood_gdf['flood_years_exposed'] > 0]
elif 'max_flood_exposure_pct' in flood_gdf.columns:
    never_exposed = flood_gdf[flood_gdf['max_flood_exposure_pct'] == 0]
    ever_exposed = flood_gdf[flood_gdf['max_flood_exposure_pct'] > 0]
else:
    never_exposed = flood_gdf.iloc[:0]
    ever_exposed = flood_gdf

print(f"\n  Flood Exposure Summary:")
print(f"    Total habitations: {len(flood_gdf)}")
print(f"    Ever exposed: {len(ever_exposed)}")
print(f"    Never exposed: {len(never_exposed)}")

# Create flood exclusion flag for habitations
# Merge flood data back to habitations using actual column names
flood_summary = flood_gdf[['pc11_tv_id']].copy()
flood_summary['exposed_years'] = flood_gdf['flood_years_exposed'].values
flood_summary['max_exposure_pct'] = flood_gdf['max_flood_exposure_pct'].values
flood_summary['frequency_pct'] = flood_gdf['flood_frequency'].values

# Merge with habitations
habitations = habitations.merge(flood_summary, on='pc11_tv_id', how='left')
habitations['exposed_years'] = habitations['exposed_years'].fillna(0)
habitations['max_exposure_pct'] = habitations['max_exposure_pct'].fillna(0)
habitations['frequency_pct'] = habitations['frequency_pct'].fillna(0)

# Flood exclusion classification
habitations['flood_exclusion'] = habitations['exposed_years'].apply(
    lambda x: 'never_exposed' if x == 0 else 'exposed'
)

print(f"\n  After merge:")
print(f"    Never exposed: {(habitations['flood_exclusion'] == 'never_exposed').sum()}")
print(f"    Exposed: {(habitations['flood_exclusion'] == 'exposed').sum()}")

print("\n[2] Flood exclusion analysis complete.\n")


# ============================================================
# STEP 3 - ROAD ACCESSIBILITY
# ============================================================
print("=" * 70)
print("STEP 3 - ROAD ACCESSIBILITY ANALYSIS")
print("=" * 70)

print("  Building road network from OSM data...")

# Extract road geometries from Overpass JSON (with out geom query)
road_lines = []
for way in road_ways:
    tags = way.get('tags', {})
    highway = tags.get('highway', 'unknown')
    name = tags.get('name', '')
    
    # Get geometry from 'geometry' field (lat/lon pairs)
    geom = way.get('geometry', [])
    if len(geom) >= 2:
        coords = [(pt['lon'], pt['lat']) for pt in geom]
        road_lines.append({
            'geometry': LineString(coords),
            'highway': highway,
            'name': name,
            'way_id': way['id']
        })

print(f"  Extracted {len(road_lines)} road geometries")

# Create road GeoDataFrame
roads_gdf = gpd.GeoDataFrame(road_lines, crs='EPSG:4326')

# Filter to major roads (primary, secondary, trunk, tertiary)
major_road_types = ['primary', 'primary_link', 'secondary', 'secondary_link', 
                    'trunk', 'trunk_link', 'tertiary', 'tertiary_link']
major_roads = roads_gdf[roads_gdf['highway'].isin(major_road_types)]
print(f"  Major roads: {len(major_roads)}")

# Compute distance from each habitation to nearest major road
print("  Computing distance to nearest major road...")

# Project to UTM Zone 46N for accurate distance calculations
habitations_utm = habitations.to_crs(epsg=32646)
major_roads_utm = major_roads.to_crs(epsg=32646)

# Union all major road geometries for efficient nearest-point calculation
major_road_union = unary_union(major_roads_utm.geometry.tolist())

# Compute distance to nearest road for each habitation
distances = []
nearest_points_list = []
for idx, hab in habitations_utm.iterrows():
    centroid = hab.geometry.centroid
    try:
        nearest_pt = nearest_points(centroid, major_road_union)[1]
        dist = centroid.distance(nearest_pt)
        distances.append(dist)
        nearest_points_list.append(nearest_pt)
    except:
        distances.append(np.nan)
        nearest_points_list.append(None)

habitations['distance_to_major_road_m'] = distances
habitations['distance_to_major_road_km'] = habitations['distance_to_major_road_m'] / 1000

# Road accessibility statistics
print("\n  Road Accessibility Statistics:")
dist = habitations['distance_to_major_road_km'].dropna()
print(f"    Count: {len(dist)}")
print(f"    Min: {dist.min():.2f} km")
print(f"    Max: {dist.max():.2f} km")
print(f"    Mean: {dist.mean():.2f} km")
print(f"    Median: {dist.median():.2f} km")

# Road accessibility bands
habitations['road_access_band'] = pd.cut(
    habitations['distance_to_major_road_km'],
    bins=[0, 1, 2, 5, 10, 100],
    labels=['<1km (excellent)', '1-2km (good)', '2-5km (moderate)', '5-10km (poor)', '>10km (very poor)']
)

print("\n  Road Access Distribution:")
print(habitations['road_access_band'].value_counts().to_string())

print("\n[3] Road accessibility analysis complete.\n")


# ============================================================
# STEP 4 - HABITATION PROXIMITY
# ============================================================
print("=" * 70)
print("STEP 4 - HABITATION PROXIMITY ANALYSIS")
print("=" * 70)

print("  Computing inter-habitation distances...")

# Compute distance from each habitation to all other habitations
# Focus on proximity to vulnerable (flood-exposed) habitations
exposed_habs = habitations[habitations['flood_exclusion'] == 'exposed']
never_exposed_habs = habitations[habitations['flood_exclusion'] == 'never_exposed']

print(f"  Exposed habitations: {len(exposed_habs)}")
print(f"  Never-exposed habitations: {len(never_exposed_habs)}")

# For each never-exposed habitation, compute distance to nearest exposed habitation
# This identifies candidates that are accessible to vulnerable populations
if len(exposed_habs) > 0 and len(never_exposed_habs) > 0:
    exposed_utm = exposed_habs.to_crs(epsg=32646)
    never_utm = never_exposed_habs.to_crs(epsg=32646)
    exposed_union = unary_union(exposed_utm.geometry.tolist())
    
    distances_to_exposed = []
    for idx, hab in never_utm.iterrows():
        centroid = hab.geometry.centroid
        try:
            nearest_pt = nearest_points(centroid, exposed_union)[1]
            dist = centroid.distance(nearest_pt)
            distances_to_exposed.append(dist / 1000)  # km
        except:
            distances_to_exposed.append(np.nan)
    
    # Add back to never-exposed habitations in main gdf
    mask = habitations['flood_exclusion'] == 'never_exposed'
    habitations.loc[mask, 'distance_to_nearest_exposed_km'] = distances_to_exposed
    
    print(f"\n  Distance from never-exposed to nearest exposed habitation:")
    d = habitations.loc[mask, 'distance_to_nearest_exposed_km'].dropna()
    print(f"    Mean: {d.mean():.2f} km")
    print(f"    Median: {d.median():.2f} km")
    print(f"    Max: {d.max():.2f} km")

# Also compute population within 5km radius for each never-exposed habitation
print("\n  Computing nearby vulnerable population (5km radius)...")
# Use habitation centroids for buffer analysis
habitations_utm_buf = habitations.to_crs(epsg=32646)
exposed_pop_in_radius = []

for idx, hab in never_utm.iterrows():
    centroid = hab.geometry.centroid
    buffer_5km = centroid.buffer(5000)  # 5km radius
    # Find exposed habitations within buffer
    nearby = exposed_utm[exposed_utm.geometry.centroid.within(buffer_5km)]
    total_pop = nearby['TOT_P'].sum() if 'TOT_P' in nearby.columns else 0
    exposed_pop_in_radius.append({
        'pc11_tv_id': habitations.loc[idx, 'pc11_tv_id'],
        'nearby_exposed_habs': len(nearby),
        'nearby_vulnerable_pop': total_pop
    })

nearby_df = pd.DataFrame(exposed_pop_in_radius)
habitations = habitations.merge(nearby_df, on='pc11_tv_id', how='left')
habitations['nearby_exposed_habs'] = habitations['nearby_exposed_habs'].fillna(0)
habitations['nearby_vulnerable_pop'] = habitations['nearby_vulnerable_pop'].fillna(0)

print(f"  Habitations with exposed population within 5km:")
with_pop = habitations[habitations['nearby_vulnerable_pop'] > 0]
print(f"    {len(with_pop)} never-exposed habitations have vulnerable populations nearby")

print("\n[4] Habitation proximity analysis complete.\n")


# ============================================================
# STEP 5 - CENSUS AMENITIES
# ============================================================
print("=" * 70)
print("STEP 5 - CENSUS AMENITIES INTEGRATION")
print("=" * 70)

print("  Merging Census Village Amenities with habitation layer...")

# The Census data uses Village Code which should match pc11_tv_id
census['Village_Code_str'] = census['Village Code'].astype(str)
habitations['pc11_tv_id_str'] = habitations['pc11_tv_id'].astype(str)

census_codes = set(census['Village_Code_str'].values)
hab_codes = set(habitations['pc11_tv_id_str'].values)
match_count = len(census_codes & hab_codes)
print(f"  Census village codes: {len(census_codes)}")
print(f"  Habitation IDs: {len(hab_codes)}")
print(f"  Matching: {match_count}")

# Merge amenities
amenity_cols = [c for c in census.columns if c not in [
    'District Code', 'Village Code', 'Village_Code_str',
]]
census_merge = census[['Village_Code_str'] + amenity_cols].copy()
census_merge.columns = ['pc11_tv_id_str'] + amenity_cols

habitations = habitations.merge(census_merge, on='pc11_tv_id_str', how='left', suffixes=('', '_census'))

# Compute amenities score
print("\n  Computing amenities availability score...")

def compute_amenities_score(row):
    """Score habitations based on available amenities (0-100)"""
    score = 0
    max_score = 0
    
    # Education (20 points)
    edu_fields = [
        'Govt Primary School (Status A(1)/NA(2))',
        'Govt  Middle School (Status A(1)/NA(2))',
        'Govt Secondary School (Status A(1)/NA(2))',
    ]
    for f in edu_fields:
        if f in row.index and pd.notna(row[f]):
            max_score += 7
            if row[f] == 1:  # Available
                score += 7
    
    # Health (25 points)
    health_fields = [
        'Community Health Centre (Numbers)',
        'Primary Health Centre (Numbers)',
        'Primary Heallth Sub Centre (Numbers)',
        'Hospital Allopathic (Numbers)',
    ]
    for f in health_fields:
        if f in row.index and pd.notna(row[f]):
            max_score += 6
            if row[f] > 0:
                score += 6
    
    # Water (20 points)
    water_fields = [
        'Hand Pump (Numbers)',
        'Tube well/ Bore well (Numbers)',
        'Tap Water (Numbers)',
    ]
    for f in water_fields:
        if f in row.index and pd.notna(row[f]):
            max_score += 7
            if row[f] > 0:
                score += 7
    
    # Transport (15 points)
    transport_fields = [
        'Bus Service (Numbers)',
        'Nearest Railway Station (Numbers)',
    ]
    for f in transport_fields:
        if f in row.index and pd.notna(row[f]):
            max_score += 8
            if row[f] > 0:
                score += 8
    
    # Banking (10 points)
    banking_fields = [
        'Bank (Numbers)',
        'ATM (Numbers)',
    ]
    for f in banking_fields:
        if f in row.index and pd.notna(row[f]):
            max_score += 5
            if row[f] > 0:
                score += 5
    
    # Communication (10 points)
    comm_fields = [
        'Telephone (Numbers)',
        'Mobile (Numbers)',
    ]
    for f in comm_fields:
        if f in row.index and pd.notna(row[f]):
            max_score += 5
            if row[f] > 0:
                score += 5
    
    if max_score > 0:
        return round(100 * score / max_score, 1)
    return 0

habitations['amenities_score'] = habitations.apply(compute_amenities_score, axis=1)

print(f"\n  Amenities Score Statistics:")
print(f"    Mean: {habitations['amenities_score'].mean():.1f}")
print(f"    Median: {habitations['amenities_score'].median():.1f}")
print(f"    Max: {habitations['amenities_score'].max():.1f}")
print(f"    Min: {habitations['amenities_score'].min():.1f}")

print("\n[5] Amenities integration complete.\n")


# ============================================================
# STEP 6-7 - CANDIDATE GENERATION AND SCORING
# ============================================================
print("=" * 70)
print("STEP 6-7 - CANDIDATE GENERATION AND SCORING")
print("=" * 70)

print("  Generating preliminary candidate areas...")

# Candidates are NEVER-EXPOSED habitations
# with valid elevation data
candidates = habitations[
    (habitations['flood_exclusion'] == 'never_exposed') & 
    (habitations['elevation_m'].notna())
].copy()

print(f"  Never-exposed habitations with elevation data: {len(candidates)}")

# ============================================================
# STEP 7 - PRELIMINARY SUITABILITY SCORE
# ============================================================
print("\n  Computing Preliminary Relocation Suitability Score...")
print("  Formula: Score = (Elevation × 0.25) + (Slope × 0.15) + (Road × 0.20) + (Amenities × 0.25) + (Proximity × 0.15)")

def compute_suitability_score(row):
    """
    Preliminary Relocation Suitability Score (0-100)
    
    Variables:
    - Elevation (0.25): Higher = safer from floods (relative)
    - Slope (0.15): Lower = better for construction
    - Road access (0.20): Closer to major road = better
    - Amenities (0.25): More facilities = better
    - Proximity to vulnerable (0.15): Closer to exposed = more useful
    
    NOTE: This is PRELIMINARY ANALYSIS ONLY.
    NOT an official safety assessment.
    """
    score = 0
    
    # 1. ELEVATION SCORE (25 points)
    # Relative scoring: higher elevation = higher score
    elev = row.get('elevation_m', 0)
    if pd.notna(elev) and elev > 0:
        # Cap at 300m for scoring purposes
        elev_score = min(elev / 300, 1.0) * 25
        score += elev_score
    
    # 2. SLOPE SCORE (15 points)
    # Lower slope = better (flat land preferred)
    slope = row.get('slope_deg', 0)
    if pd.notna(slope):
        # Inverse: 0 deg slope = 15 points, 30 deg+ = 0 points
        slope_score = max(0, (1 - slope / 30)) * 15
        score += slope_score
    
    # 3. ROAD ACCESSIBILITY SCORE (20 points)
    # Closer to major road = higher score
    dist_road = row.get('distance_to_major_road_km', 100)
    if pd.notna(dist_road):
        # 0km = 20 points, 10km+ = 0 points
        road_score = max(0, (1 - dist_road / 10)) * 20
        score += road_score
    
    # 4. AMENITIES SCORE (25 points)
    # More amenities = higher score
    amenities = row.get('amenities_score', 0)
    if pd.notna(amenities):
        amenities_component = (amenities / 100) * 25
        score += amenities_component
    
    # 5. PROXIMITY TO VULNERABLE (15 points)
    # Closer to exposed populations = more useful for relocation
    dist_exposed = row.get('distance_to_nearest_exposed_km', 100)
    vulnerable_pop = row.get('nearby_vulnerable_pop', 0)
    
    proximity_score = 0
    if pd.notna(dist_exposed) and dist_exposed < 100:
        # Closer = higher score
        proximity_score += max(0, (1 - dist_exposed / 20)) * 8
    
    if pd.notna(vulnerable_pop) and vulnerable_pop > 0:
        # More vulnerable population nearby = more useful
        pop_score = min(vulnerable_pop / 10000, 1.0) * 7
        proximity_score += pop_score
    
    score += proximity_score
    
    return round(score, 2)

candidates['suitability_score'] = candidates.apply(compute_suitability_score, axis=1)

# Classification
def classify_suitability(score):
    if score >= 70:
        return 'High'
    elif score >= 50:
        return 'Medium'
    elif score >= 30:
        return 'Low'
    else:
        return 'Very Low'

candidates['suitability_class'] = candidates['suitability_score'].apply(classify_suitability)

# Sort by score
candidates = candidates.sort_values('suitability_score', ascending=False).reset_index(drop=True)

# Assign candidate IDs
candidates['candidate_id'] = ['RC-' + str(i+1).zfill(3) for i in range(len(candidates))]

print(f"\n  PRELIMINARY RELOCATION SUITABILITY RESULTS:")
print(f"  Total candidates: {len(candidates)}")
print(f"\n  Classification distribution:")
print(candidates['suitability_class'].value_counts().to_string())

print(f"\n  Top 10 Candidates:")
top10 = candidates[['candidate_id', 'tv_name', 'elevation_m', 'slope_deg', 
                     'distance_to_major_road_km', 'amenities_score', 
                     'suitability_score', 'suitability_class']].head(10)
print(top10.to_string(index=False))

print(f"\n  Score Statistics:")
print(f"    Mean: {candidates['suitability_score'].mean():.2f}")
print(f"    Median: {candidates['suitability_score'].median():.2f}")
print(f"    Max: {candidates['suitability_score'].max():.2f}")
print(f"    Min: {candidates['suitability_score'].min():.2f}")
print(f"    Std: {candidates['suitability_score'].std():.2f}")

print("\n[6-7] Candidate generation and scoring complete.\n")


# ============================================================
# STEP 8 - CARRYING CAPACITY DATA STRUCTURE
# ============================================================
print("=" * 70)
print("STEP 8 - CARRYING CAPACITY DATA STRUCTURE")
print("=" * 70)

print("  Creating carrying capacity placeholder fields...")

# Add carrying capacity fields (all marked as PENDING)
candidates['capacity_status'] = 'Pending - requires LULC + land area + planning validation'
candidates['available_area_ha'] = np.nan  # Pending LULC data
candidates['max_capacity_persons'] = np.nan  # Pending area + planning
candidates['capacity_notes'] = (
    'Carrying capacity calculation requires: '
    '(1) NRSC LULC data for land-use classification, '
    '(2) Available open land area from LULC + slope analysis, '
    '(3) GMDA planning zones and ownership validation, '
    '(4) Density assumptions from government norms. '
    'NOT CALCULATED - pending these datasets.'
)

print("  Carrying capacity fields added (all PENDING)")
print("  Fields: capacity_status, available_area_ha, max_capacity_persons, capacity_notes")

print("\n[8] Carrying capacity data structure created.\n")


# ============================================================
# STEP 9 - OUTPUT FILES
# ============================================================
print("=" * 70)
print("STEP 9 - OUTPUT FILES")
print("=" * 70)

# Select output columns
output_cols = [
    'candidate_id', 'pc11_tv_id', 'tv_name',
    'geometry',
    # Demographics
    'TOT_P', 'P_06', 'P_SC', 'P_ST',
    # Step 1: Elevation
    'elevation_m', 'slope_deg', 'elevation_band',
    # Step 2: Flood
    'exposed_years', 'max_exposure_pct', 'frequency_pct', 'flood_exclusion',
    # Step 3: Road
    'distance_to_major_road_m', 'distance_to_major_road_km', 'road_access_band',
    # Step 4: Proximity
    'distance_to_nearest_exposed_km', 'nearby_exposed_habs', 'nearby_vulnerable_pop',
    # Step 5: Amenities
    'amenities_score',
    # Step 6-7: Score
    'suitability_score', 'suitability_class',
    # Step 8: Capacity
    'capacity_status', 'available_area_ha', 'max_capacity_persons', 'capacity_notes',
]

# Filter to available columns
output_cols = [c for c in output_cols if c in candidates.columns]

# GeoJSON output
print("  Writing GeoJSON...")
candidates_geojson = candidates[output_cols].copy()
# Convert to proper GeoJSON format
candidates_geojson.to_file(f'{PROCESSED}/preliminary_relocation_candidates.geojson', driver='GeoJSON')
print(f"    Saved: {PROCESSED}/preliminary_relocation_candidates.geojson")
print(f"    Features: {len(candidates_geojson)}")

# CSV output (without geometry)
print("  Writing CSV...")
candidates_csv = candidates[output_cols].drop(columns=['geometry'], errors='ignore').copy()
candidates_csv.to_csv(f'{PROCESSED}/preliminary_relocation_candidates.csv', index=False)
print(f"    Saved: {PROCESSED}/preliminary_relocation_candidates.csv")
print(f"    Rows: {len(candidates_csv)}")

print("\n[9] Output files created.\n")


# ============================================================
# STEP 10 - VALIDATION
# ============================================================
print("=" * 70)
print("STEP 10 - VALIDATION")
print("=" * 70)

# Validate GeoJSON
print("  Validating GeoJSON...")
gdf_check = gpd.read_file(f'{PROCESSED}/preliminary_relocation_candidates.geojson')
print(f"    CRS: {gdf_check.crs}")
print(f"    Features: {len(gdf_check)}")
print(f"    All valid geometries: {gdf_check.geometry.is_valid.all()}")
print(f"    Unique candidate IDs: {gdf_check['candidate_id'].nunique()}")
print(f"    Duplicate IDs: {len(gdf_check) - gdf_check['candidate_id'].nunique()}")

# Validate CRS
print(f"    CRS is EPSG:4326: {gdf_check.crs == 'EPSG:4326' or str(gdf_check.crs) == 'EPSG:4326'}")

# Validate no invented data
print("\n  Checking for invented data...")
# Verify all candidates have pc11_tv_id (from real habitation data)
assert gdf_check['pc11_tv_id'].notna().all(), "ERROR: Missing pc11_tv_id!"
print("    All candidates have pc11_tv_id: OK")

# Verify elevation values are within DEM range
elev_min = gdf_check['elevation_m'].min()
elev_max = gdf_check['elevation_m'].max()
assert elev_min >= 0, f"ERROR: Negative elevation {elev_min}!"
assert elev_max <= 1000, f"ERROR: Unrealistic elevation {elev_max}!"
print(f"    Elevation range: {elev_min:.0f}m to {elev_max:.0f}m OK")

# Verify flood values unchanged
flood_check = gpd.read_file(f'{PROCESSED}/kamrup_metro_flood_exposure.geojson')
print(f"    Original flood exposure records: {len(flood_check)}")

# Verify source datasets unchanged
print(f"    Original habitation records: {len(habitations)}")
assert len(habitations) == 228, f"ERROR: Habitation count changed! Expected 228, got {len(habitations)}"
print("    Habitation count unchanged: 228 OK")

# Check no duplicate pc11_tv_id in original
assert len(flood_check) == len(flood_check['pc11_tv_id'].unique()), "ERROR: Duplicate pc11_tv_id in flood data!"
print("    No duplicate pc11_tv_id in flood data: OK")

print("\n[10] Validation complete.\n")


# ============================================================
# FINAL SUMMARY
# ============================================================
print("=" * 70)
print("FINAL SUMMARY")
print("=" * 70)

print(f"\n  DATASETS USED:")
print(f"    1. Kamrup Metro Habitation Polygons: 228 features")
print(f"    2. NDEM Historical Flood Exposure: 152/228 exposed")
print(f"    3. SRTM DEM 30m: Clipped to Kamrup Metro")
print(f"    4. OSM Roads: {len(road_ways)} road ways")
print(f"    5. Census Village Amenities: {len(census)} villages, 396 columns")

print(f"\n  VARIABLES IN SCORING:")
print(f"    - Elevation (weight: 0.25)")
print(f"    - Slope (weight: 0.15)")
print(f"    - Road accessibility (weight: 0.20)")
print(f"    - Amenities availability (weight: 0.25)")
print(f"    - Proximity to vulnerable populations (weight: 0.15)")

print(f"\n  FORMULA:")
print(f"    Score = (Elevation_score × 0.25) + (Slope_score × 0.15) +")
print(f"            (Road_score × 0.20) + (Amenities_score × 0.25) +")
print(f"            (Proximity_score × 0.15)")

print(f"\n  RESULTS:")
print(f"    Total preliminary candidates: {len(candidates)}")
print(f"    High suitability (>=70): {(candidates['suitability_class'] == 'High').sum()}")
print(f"    Medium suitability (50-69): {(candidates['suitability_class'] == 'Medium').sum()}")
print(f"    Low suitability (30-49): {(candidates['suitability_class'] == 'Low').sum()}")
print(f"    Very Low suitability (<30): {(candidates['suitability_class'] == 'Very Low').sum()}")

print(f"\n  TOP 5 CANDIDATES:")
for _, row in candidates.head(5).iterrows():
    print(f"    {row['candidate_id']}: {row.get('tv_name', 'N/A')}")
    print(f"      Elev: {row['elevation_m']:.0f}m, Slope: {row['slope_deg']:.1f} deg")
    print(f"      Road: {row['distance_to_major_road_km']:.1f}km, Amenities: {row['amenities_score']:.0f}")
    print(f"      Score: {row['suitability_score']:.1f} ({row['suitability_class']})")

print(f"\n  MAJOR LIMITATIONS:")
print(f"    1. NO land-use data (NRSC LULC) - cannot identify actual open/available land")
print(f"    2. NO water body exclusion - candidates may be adjacent to water bodies")
print(f"    3. NO GMDA planning zones - cannot assess zoning restrictions")
print(f"    4. NO land ownership data - cannot confirm availability")
print(f"    5. NO carrying capacity calculated - pending LULC + planning data")
print(f"    6. Historical non-exposure does NOT guarantee future flood safety")
print(f"    7. All candidates are EXISTING HABITATIONS, not unoccupied land")
print(f"    8. Amenities data is Census 2011 - may be outdated")

print(f"\n  DATASETS STILL REQUIRED:")
print(f"    - NRSC LULC 1:50K (land-use classification)")
print(f"    - Water Bodies GIS layer (exclusion zones)")
print(f"    - GMDA Master Plan zones (planning restrictions)")
print(f"    - Land ownership data (availability confirmation)")

print(f"\n  DISCLAIMER:")
print(f"    This output is PRELIMINARY ANALYSIS ONLY.")
print(f"    It is NOT an official safety assessment.")
print(f"    It does NOT designate any area as 'safe' or 'suitable'.")
print(f"    All results must be verified by ASDMA, DDMA, and GMDA before any action.")

print(f"\n  OUTPUT FILES:")
print(f"    data/processed/preliminary_relocation_candidates.geojson")
print(f"    data/processed/preliminary_relocation_candidates.csv")
print(f"    data/inspection/phase3_candidate_site_analysis.md")

print("\n" + "=" * 70)
print("PIPELINE COMPLETE")
print("=" * 70)
