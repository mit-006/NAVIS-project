"""Quick check of flood exposure GeoJSON columns"""
import geopandas as gpd
flood = gpd.read_file('C:/Users/DELL/OneDrive/Documents/Default Project/resqmap/data/processed/kamrup_metro_flood_exposure.geojson')
print("Flood GeoJSON columns:", list(flood.columns))
print("Shape:", flood.shape)
print("First row:")
print(flood.iloc[0].to_string())

hab = gpd.read_file('C:/Users/DELL/OneDrive/Documents/Default Project/resqmap/data/processed/kamrup_metro_habitations.geojson')
print("\nHabitation columns:", list(hab.columns))
print("Shape:", hab.shape)

# Check for common columns
common = set(flood.columns) & set(hab.columns)
print("\nCommon columns:", common)
