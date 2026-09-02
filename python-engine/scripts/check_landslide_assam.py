import geopandas as gpd
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
EXTRACT_DIR = os.path.join(BASE_DIR, 'data', 'raw', 'landslide', 'extracted')

# Check NDEM for Assam data
print('='*70)
print('NDEM LANDSLIDE HAZARD - ASSAM CHECK')
print('='*70)
ndem_path = os.path.join(EXTRACT_DIR, 'NDEM_Landslide_Hazard', 'NDEM_Landslide_Hazard.shp')
ndem = gpd.read_file(ndem_path)

# Check zone values
print(f'Total features: {len(ndem)}')
print(f'\nUnique zone values: {ndem["zone"].unique()}')
print(f'\nUnique grid_code values: {sorted(ndem["grid_code"].unique())}')

# Filter for Assam area (approx lon 89-96, lat 24-28)
# The 'zone' column might have state codes
assam_zones = ndem[ndem['zone'].str.lower().isin(['as', 'assam', 'asm'])]
print(f'\nFeatures with Assam zone codes: {len(assam_zones)}')

# Also check by spatial bounds
from shapely.geometry import box
assam_bbox = box(89.0, 24.0, 96.0, 28.5)
assam_spatial = ndem[ndem.geometry.intersects(assam_bbox)]
print(f'Features intersecting Assam bbox: {len(assam_spatial)}')
if len(assam_spatial) > 0:
    print(f'  Zone values: {assam_spatial["zone"].unique()}')
    print(f'  Grid codes: {sorted(assam_spatial["grid_code"].unique())}')

# Check GSI for Assam data
print('\n' + '='*70)
print('GSI LANDSLIDE INVENTORY - ASSAM CHECK')
print('='*70)
gsi_path = os.path.join(EXTRACT_DIR, 'GSI_Landslide_Inventory', 'GSI_Landslide_Inventory.shp')
gsi = gpd.read_file(gsi_path)

print(f'Total features: {len(gsi)}')
print(f'\nUnique STATE values: {gsi["STATE"].unique()}')

# Filter for Assam
assam_gsi = gsi[gsi['STATE'].str.upper() == 'ASSAM']
print(f'\nAssam landslides: {len(assam_gsi)}')
if len(assam_gsi) > 0:
    print(f'  Districts: {assam_gsi["DISTRICT"].unique()}')
    print(f'  TRIGGERING: {assam_gsi["TRIGGERING"].value_counts().to_dict()}')
    print(f'  MOVEMENT_T: {assam_gsi["MOVEMENT_T"].value_counts().to_dict()}')
    print(f'  MATERIAL_T: {assam_gsi["MATERIAL_T"].value_counts().to_dict()}')
    
    # Check Kamrup Metro area (approx lon 91.5-92.0, lat 26.0-26.5)
    kamrup_gsi = assam_gsi[
        (assam_gsi['LONGITUDE'] >= 91.0) & (assam_gsi['LONGITUDE'] <= 92.5) &
        (assam_gsi['LATITUDE'] >= 25.5) & (assam_gsi['LATITUDE'] <= 26.5)
    ]
    print(f'\n  Landslides in Kamrup Metro area: {len(kamrup_gsi)}')
    if len(kamrup_gsi) > 0:
        print(f'    Districts: {kamrup_gsi["DISTRICT"].unique()}')
        print(f'    TRIGGERING: {kamrup_gsi["TRIGGERING"].value_counts().to_dict()}')
