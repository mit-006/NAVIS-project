"""
Read-only GIS inspection of AIKOSH/SHRUG PC11 Village Polygon shapefile.
No modifications to any data.
"""
import json
import sys
from pathlib import Path

try:
    import geopandas as gpd
except ImportError:
    print("ERROR: geopandas not installed")
    sys.exit(1)

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl not installed")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
SHAPEFILE = PROJECT_ROOT / "data/raw/aikosh_census_village_geometry_2011/extracted/shrug-pc11-village-poly-shp/village_modified.shp"
CENSUS_FILE = PROJECT_ROOT / "data/raw/kamrup_metropolitan_pca_tv_2011.xlsx"

SEP = "=" * 70
LINE = "-" * 70

print(SEP)
print("AIKOSH/SHRUG PC11 Village Polygon - Read-Only GIS Inspection")
print(SEP)

# Load shapefile
print()
print("Loading: " + SHAPEFILE.name)
gdf = gpd.read_file(str(SHAPEFILE))
print("  Loaded successfully")

# Basic info
print()
print(LINE)
print("BASIC INFORMATION")
print(LINE)
print("  Features (rows):    " + f"{len(gdf):,}")
print("  Columns (fields):   " + str(len(gdf.columns)))
print("  Geometry type:      " + str(gdf.geom_type.unique().tolist()))
print("  CRS:                " + str(gdf.crs))
print("  Bounds:             " + str(gdf.total_bounds.tolist()))
print("  Valid geometry:     " + f"{gdf.geometry.is_valid.sum():,} / {len(gdf):,}")

# All columns
print()
print(LINE)
print("ALL ATTRIBUTE FIELDS")
print(LINE)
for col in gdf.columns:
    dtype = str(gdf[col].dtype)
    non_null = gdf[col].notna().sum()
    sample = gdf[col].dropna().head(2).tolist()
    print(f"  {col:30s} | {dtype:10s} | {non_null:>7,} non-null | sample: {sample}")

# Key fields check
print()
print(LINE)
print("KEY IDENTIFIER FIELDS CHECK")
print(LINE)
key_fields = ['pc11_d_id', 'pc11_sd_id', 'pc11_tv_id', 'tv_name']
for field in key_fields:
    if field in gdf.columns:
        non_null = gdf[field].notna().sum()
        unique = gdf[field].nunique()
        print(f"  {field:20s} : PRESENT ({non_null:,} non-null, {unique:,} unique)")
    else:
        print(f"  {field:20s} : ** NOT FOUND **")

# District code analysis
print()
print(LINE)
print("DISTRICT CODE ANALYSIS")
print(LINE)
if 'pc11_d_id' in gdf.columns:
    district_counts = gdf['pc11_d_id'].value_counts().head(20)
    print("  Unique districts: " + str(gdf['pc11_d_id'].nunique()))
    print()
    print("  Top 20 districts by feature count:")
    for dist_id, count in district_counts.items():
        print(f"    District {dist_id}: {count:,} features")

    # Check for Kamrup Metro (322)
    kamrup_mask = gdf['pc11_d_id'].astype(str) == '322'
    kamrup_count = kamrup_mask.sum()
    print()
    print("  Features with pc11_d_id = 322 (Kamrup Metro): " + f"{kamrup_count:,}")

    if kamrup_count > 0:
        kamrup_gdf = gdf[kamrup_mask]
        print("  Kamrup Metro pc11_tv_id range: " + str(kamrup_gdf['pc11_tv_id'].min()) + " to " + str(kamrup_gdf['pc11_tv_id'].max()))
        print("  Kamrup Metro pc11_sd_id values: " + str(sorted(kamrup_gdf['pc11_sd_id'].unique().tolist())))
        print("  Kamrup Metro tv_name sample: " + str(kamrup_gdf['tv_name'].head(10).tolist()))
else:
    alt_cols = [c for c in gdf.columns if 'district' in c.lower() or 'd_id' in c.lower()]
    print("  pc11_d_id NOT FOUND. Alternative district columns: " + str(alt_cols))

# Save inspection results as JSON
results = {
    "total_features": len(gdf),
    "total_columns": len(gdf.columns),
    "columns": list(gdf.columns),
    "geometry_types": gdf.geom_type.unique().tolist(),
    "crs": str(gdf.crs),
    "bounds": gdf.total_bounds.tolist(),
    "valid_geometry_count": int(gdf.geometry.is_valid.sum()),
    "invalid_geometry_count": int((~gdf.geometry.is_valid).sum()),
    "key_fields_present": {f: f in gdf.columns for f in key_fields},
}

if 'pc11_d_id' in gdf.columns:
    kamrup_mask = gdf['pc11_d_id'].astype(str) == '322'
    kamrup_gdf = gdf[kamrup_mask]
    results["kamrup_feature_count"] = int(kamrup_mask.sum())
    if kamrup_mask.sum() > 0:
        results["kamrup_tv_ids"] = sorted(kamrup_gdf['pc11_tv_id'].astype(str).unique().tolist())
        results["kamrup_sd_ids"] = sorted(kamrup_gdf['pc11_sd_id'].astype(str).unique().tolist())
        results["kamrup_names"] = kamrup_gdf['tv_name'].tolist()
        results["kamrup_tv_id_duplicates"] = int(kamrup_gdf['pc11_tv_id'].duplicated().sum())

output_path = PROJECT_ROOT / "data/inspection/aikosh_inspection_results.json"
with open(output_path, "w") as f:
    json.dump(results, f, indent=2, default=str)
print()
print("Results saved to: " + str(output_path))

print()
print(SEP)
print("GIS INSPECTION COMPLETE - Proceeding to Census verification")
print(SEP)
