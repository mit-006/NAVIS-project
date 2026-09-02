import geopandas as gpd
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
EXTRACT_DIR = os.path.join(BASE_DIR, 'data', 'raw', 'landslide', 'extracted')

# Load NDEM data for Assam
ndem_path = os.path.join(EXTRACT_DIR, 'NDEM_Landslide_Hazard', 'NDEM_Landslide_Hazard.shp')
ndem = gpd.read_file(ndem_path)

# Filter for Assam area
from shapely.geometry import box
assam_bbox = box(89.0, 24.0, 96.0, 28.5)
assam = ndem[ndem.geometry.intersects(assam_bbox)].copy()

print('NDEM Assam Landslide Hazard Zones:')
print(f'  Total features: {len(assam)}')
print(f'  Grid code values: {sorted(assam["grid_code"].unique())}')
print(f'  Grid code distribution:')
for code in sorted(assam["grid_code"].unique()):
    count = (assam["grid_code"] == code).sum()
    print(f'    Code {code}: {count} features')

# Check for Kamrup Metro area
kamrup_bbox = box(91.0, 25.5, 92.5, 26.5)
kamrup = assam[assam.geometry.intersects(kamrup_bbox)].copy()
print(f'\nKamrup Metro area:')
print(f'  Features: {len(kamrup)}')
print(f'  Grid code distribution:')
for code in sorted(kamrup["grid_code"].unique()):
    count = (kamrup["grid_code"] == code).sum()
    print(f'    Code {code}: {count} features')

# Load GSI data for Assam
gsi_path = os.path.join(EXTRACT_DIR, 'GSI_Landslide_Inventory', 'GSI_Landslide_Inventory.shp')
gsi = gpd.read_file(gsi_path)
assam_gsi = gsi[gsi['STATE'].str.upper() == 'ASSAM']
kamrup_gsi = assam_gsi[
    (assam_gsi['LONGITUDE'] >= 91.0) & (assam_gsi['LONGITUDE'] <= 92.5) &
    (assam_gsi['LATITUDE'] >= 25.5) & (assam_gsi['LATITUDE'] <= 26.5)
]

print(f'\nGSI Kamrup Metro landslides:')
print(f'  Count: {len(kamrup_gsi)}')
print(f'  Districts: {kamrup_gsi["DISTRICT"].value_counts().to_dict()}')
print(f'  TRIGGERING: {kamrup_gsi["TRIGGERING"].value_counts().head(5).to_dict()}')
print(f'  MOVEMENT_T: {kamrup_gsi["MOVEMENT_T"].value_counts().to_dict()}')
print(f'  MATERIAL_T: {kamrup_gsi["MATERIAL_T"].value_counts().to_dict()}')
print(f'  ACTIVITY: {kamrup_gsi["ACTIVITY"].value_counts().to_dict()}')
