import geopandas as gpd
import os
from shapely.geometry import box

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')

HAB_PATH = os.path.join(BASE_DIR, 'data', 'processed', 'kamrup_metro_habitations.geojson')
LS_DIR = os.path.join(BASE_DIR, 'data', 'raw', 'landslide', 'extracted', 'NDEM_Landslide_Hazard')

hab = gpd.read_file(HAB_PATH)
ls_files = [f for f in os.listdir(LS_DIR) if f.endswith('.shp')]
ls = gpd.read_file(os.path.join(LS_DIR, ls_files[0]))

# Filter landslide to actual habitation bounds (not just Kamrup bbox)
hab_bounds = hab.total_bounds  # [minx, miny, maxx, maxy]
print(f'Habitation bounds: lon {hab_bounds[0]:.4f}-{hab_bounds[2]:.4f}, lat {hab_bounds[1]:.4f}-{hab_bounds[3]:.4f}')

# Create a tighter bbox around habitations with buffer
buffer = 0.01  # ~1km buffer
tight_bbox = box(hab_bounds[0] - buffer, hab_bounds[1] - buffer, 
                 hab_bounds[2] + buffer, hab_bounds[3] + buffer)

ls_tight = ls[ls.geometry.intersects(tight_bbox)]
print(f'Landslide zones near habitations (tight bbox): {len(ls_tight)}')

if len(ls_tight) > 0:
    print(f'  Grid code distribution:')
    for code in sorted(ls_tight["grid_code"].unique()):
        count = (ls_tight["grid_code"] == code).sum()
        print(f'    Class {code}: {count} zones')
    print(f'  Bounds: {ls_tight.total_bounds}')

# Check intersection with first habitation
hab_geom = hab.iloc[0].geometry
print(f'\nFirst habitation: {hab.iloc[0]["Name"]}')
print(f'  Bounds: {hab_geom.bounds}')

# Try intersection with tight bbox landslide zones
intersections = 0
for i in range(len(ls_tight)):
    ls_geom = ls_tight.iloc[i].geometry
    if hab_geom.intersects(ls_geom):
        intersections += 1
        inter = hab_geom.intersection(ls_geom)
        if not inter.is_empty:
            inter_utm = gpd.GeoSeries([inter], crs='EPSG:4326').to_crs(epsg=32646)
            print(f'  Intersection with zone {i}: area={inter_utm.area.values[0]:.2f} sqm')

print(f'Total intersections: {intersections}')
