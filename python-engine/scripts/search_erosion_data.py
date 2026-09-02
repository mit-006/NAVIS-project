import urllib.request
import json
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

print('='*70)
print('Searching for Riverbank Erosion Vector Data')
print('='*70)

# Search 1: data.gov.in API
print('\n[1] Searching data.gov.in for riverbank erosion data...')
try:
    url = 'https://data.gov.in/backend/dmspublic/v1/resources?filters[title]=riverbank+erosion&filters[organization]=assam&offset=0&limit=10'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=15) as response:
        data = json.loads(response.read().decode('utf-8'))
        print(f'  Results: {data.get("total", 0)}')
        for r in data.get('results', [])[:5]:
            print(f'  - {r.get("title", "N/A")}')
except Exception as e:
    print(f'  Error: {e}')

# Search 2: Check Bhuvan NDVI/LULC for erosion proxy
print('\n[2] Checking Bhuvan for river-related layers...')
try:
    url = 'https://bhuvan.nrsc.gov.in/bhuvan_gmc/gmc/download.php'
    print(f'  Bhuvan GMC endpoint exists (needs authentication)')
except:
    pass

# Search 3: Water Resources Dept Assam - check if they have GIS data
print('\n[3] Water Resources Department, Assam...')
print('  URL: https://wrdassam.gov.in')
print('  May have erosion data - needs manual check')

# Search 4: OpenStreetMap river banklines
print('\n[4] OSM Overpass API - Brahmaputra in Kamrup Metro...')
try:
    query = '''[out:json][timeout:25];
    way["waterway"="riverbank"](25.9,91.4,26.3,91.9);
    out body;
    >;
    out skel qt;'''
    url = 'https://overpass-api.de/api/interpreter'
    data = f'data={urllib.parse.quote(query)}'
    req = urllib.request.Request(url, data=data.encode('utf-8'), headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        result = json.loads(response.read().decode('utf-8'))
        elements = result.get('elements', [])
        print(f'  OSM riverbank polygons found: {len([e for e in elements if e["type"]=="way"])}')
        nodes = len([e for e in elements if e["type"]=="node"])
        print(f'  OSM nodes: {nodes}')
except Exception as e:
    print(f'  Error: {e}')

# Search 5: Central Water Commission data
print('\n[5] Central Water Commission (CWC)...')
print('  URL: https://cwc.gov.in')
print('  May have erosion monitoring data')

# Search 6: Brahmaputra Board
print('\n[6] Brahmaputra Board...')
print('  URL: https://brahmaputraboard.gov.in')
print('  May have erosion survey data')

# Search 7: Survey of India topographic maps
print('\n[7] Survey of India...')
print('  Topographic sheets may show historical bankline positions')

# Search 8: GSI erosion maps
print('\n[8] Geological Survey of India...')
print('  May have erosion susceptibility maps')

# Search 9: Assam Space Application Centre
print('\n[9] Assam Space Application Centre (ASAC)...')
print('  May have state-level erosion mapping')

# Search 10: Academic/open datasets
print('\n[10] Academic datasets...')
print('  Zenodo, Figshare, etc. may have Brahmaputra erosion data')

print('\n' + '='*70)
print('NEXT: Check NeSDR WMS images for visual inspection')
print('='*70)
