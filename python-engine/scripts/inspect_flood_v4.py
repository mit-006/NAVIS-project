import geopandas as gpd
import json
import os

f = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'raw', 'flood', 'extracted',
                 'NDEM_AS_Yearly_Aggregate_Flood_Innundation_1998_to_2013_2021.geojsonl')

print('Loading with geopandas (streaming first 5000 records)...')
import fiona
# Check what layers/encoding
print('=== Schema from fiona ===')
with fiona.open(f) as src:
    print(f'  CRS: {src.crs}')
    print(f'  Schema: {src.schema}')
    print(f'  Count (fiona): {len(src)}')
    print(f'  Bounds: {src.bounds}')
    print(f'  First 3 records:')
    for i, feat in enumerate(src):
        if i >= 3:
            break
        print(f'    {feat}')

print('\n=== Reading with geopandas (first 5000 rows) ===')
gdf = gpd.read_file(f, rows=5000)
print(f'  Shape: {gdf.shape}')
print(f'  CRS: {gdf.crs}')
print(f'  Columns: {list(gdf.columns)}')
print(f'  Geometry type: {gdf.geometry.geom_type.value_counts().to_dict()}')
print(f'  Bounds: {gdf.total_bounds}')
print(f'  Year values: {sorted(gdf["year"].unique())}')
print(f'  Value counts: {gdf["value"].value_counts().to_dict()}')
print(f'  RGB values:')
for _, row in gdf.drop_duplicates(subset=["red","green","blue"]).iterrows():
    print(f'    RGB({row["red"]},{row["green"]},{row["blue"]}) value={row["value"]}')
