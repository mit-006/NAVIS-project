import geopandas as gpd
import os
import zipfile
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
RAW_DIR = os.path.join(BASE_DIR, 'data', 'raw', 'landslide')
EXTRACT_DIR = os.path.join(RAW_DIR, 'extracted')
REPORT_PATH = os.path.join(BASE_DIR, 'data', 'inspection', 'landslide_data_inspection.md')

os.makedirs(EXTRACT_DIR, exist_ok=True)

# Extract both zip files
for zip_name in ['NDEM_Landslide_Hazard.shp.zip', 'GSI_Landslide_Inventory.shp.zip']:
    zip_path = os.path.join(RAW_DIR, zip_name)
    out_dir = os.path.join(EXTRACT_DIR, zip_name.replace('.shp.zip', ''))
    os.makedirs(out_dir, exist_ok=True)
    print(f'Extracting {zip_name}...')
    with zipfile.ZipFile(zip_path, 'r') as z:
        z.extractall(out_dir)
    print(f'  Extracted to {out_dir}')

# Inspect NDEM Landslide Hazard
print('\n' + '='*70)
print('NDEM LANDSLIDE HAZARD ZONES')
print('='*70)
ndem_dir = os.path.join(EXTRACT_DIR, 'NDEM_Landslide_Hazard')
ndem_shp = None
for f in os.listdir(ndem_dir):
    if f.endswith('.shp'):
        ndem_shp = os.path.join(ndem_dir, f)
        break

if ndem_shp:
    gdf = gpd.read_file(ndem_shp)
    print(f'File: {ndem_shp}')
    print(f'Features: {len(gdf)}')
    print(f'CRS: {gdf.crs}')
    print(f'Geometry type: {gdf.geometry.geom_type.value_counts().to_dict()}')
    print(f'Bounds: {gdf.total_bounds}')
    print(f'Columns: {list(gdf.columns)}')
    print(f'\nFirst 3 rows:')
    print(gdf.head(3).to_string())
    print(f'\nColumn dtypes:')
    for col in gdf.columns:
        print(f'  {col}: {gdf[col].dtype}')
    if 'HAZ_CLASS' in gdf.columns:
        print(f'\nHAZ_CLASS values:')
        print(gdf['HAZ_CLASS'].value_counts())
    if 'HAZARD' in gdf.columns:
        print(f'\nHAZARD values:')
        print(gdf['HAZARD'].value_counts())
    
    # Check for Assam data
    # Assam approximate bounds: lon 89-96, lat 24-28
    bounds = gdf.total_bounds
    print(f'\nSpatial extent: lon {bounds[0]:.2f}-{bounds[2]:.2f}, lat {bounds[1]:.2f}-{bounds[3]:.2f}')

# Inspect GSI Landslide Inventory
print('\n' + '='*70)
print('GSI LANDSLIDE INVENTORY')
print('='*70)
gsi_dir = os.path.join(EXTRACT_DIR, 'GSI_Landslide_Inventory')
gsi_shp = None
for f in os.listdir(gsi_dir):
    if f.endswith('.shp'):
        gsi_shp = os.path.join(gsi_dir, f)
        break

if gsi_shp:
    gdf2 = gpd.read_file(gsi_shp)
    print(f'File: {gsi_shp}')
    print(f'Features: {len(gdf2)}')
    print(f'CRS: {gdf2.crs}')
    print(f'Geometry type: {gdf2.geometry.geom_type.value_counts().to_dict()}')
    print(f'Bounds: {gdf2.total_bounds}')
    print(f'Columns: {list(gdf2.columns)}')
    print(f'\nFirst 3 rows:')
    print(gdf2.head(3).to_string())
    print(f'\nColumn dtypes:')
    for col in gdf2.columns:
        print(f'  {col}: {gdf2[col].dtype}')
