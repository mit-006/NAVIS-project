import geopandas as gpd
import os
from shapely.geometry import box

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')

HAB_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'kamrup_metro_habitations.geojson')
LS_DIR = os.path.join(BASE_DIR, 'data', 'raw', 'landslide', 'extracted', 'NDEM_Landslide_Hazard')

# Load data
hab = gpd.read_file(HAB_PATH)
ls_files = [f for f in os.listdir(LS_DIR) if f.endswith('.shp')]
ls = gpd.read_file(os.path.join(LS_DIR, ls_files[0]))

print('Habitation CRS:', hab.crs)
print('Landslide CRS:', ls.crs)

# Check spatial reference
print('\nHabitation bounds:', hab.total_bounds)
print('Landslide bounds:', ls.total_bounds)

# Filter landslide to Kamrup area
kamrup_bbox = box(91.0, 25.5, 92.5, 26.5)
ls_kamrup = ls[ls.geometry.intersects(kamrup_bbox)]
print(f'\nLandslide zones in Kamrup bbox: {len(ls_kamrup)}')
print(f'Kamrup bbox: {kamrup_bbox.bounds}')

# Check first habitation
print('\nFirst habitation:')
print(f'  Name: {hab.iloc[0]["Name"]}')
print(f'  Bounds: {hab.iloc[0].geometry.bounds}')
print(f'  CRS: {hab.crs}')

# Check first few landslide zones
print('\nFirst 3 landslide zones in Kamrup:')
for i in range(min(3, len(ls_kamrup))):
    row = ls_kamrup.iloc[i]
    print(f'  Zone {i}: grid_code={row["grid_code"]}, bounds={row.geometry.bounds}')

# Try manual intersection with first habitation
hab_geom = hab.iloc[0].geometry
print(f'\nHabitation geom type: {hab_geom.geom_type}')
print(f'Is valid: {hab_geom.is_valid}')

# Check if any landslide zone intersects
intersections = 0
for i in range(len(ls_kamrup)):
    ls_geom = ls_kamrup.iloc[i].geometry
    if hab_geom.intersects(ls_geom):
        intersections += 1
        if intersections <= 3:
            inter = hab_geom.intersection(ls_geom)
            print(f'  Intersection with zone {i}: area={inter.area if not inter.is_empty else 0}')

print(f'\nTotal intersections: {intersections}')

# Also check CRS transformation
print('\n--- CRS Check ---')
hab_utm = hab.to_crs(epsg=32646)
print(f'UTM bounds: {hab_utm.total_bounds}')
