import urllib.request
import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
OUTPUT_DIR = os.path.join(BASE_DIR, 'data', 'raw', 'erosion')
os.makedirs(OUTPUT_DIR, exist_ok=True)

print('='*70)
print('Testing NeSDR WMS Services for Riverbank Erosion Data')
print('='*70)

# NeSDR WMS endpoints from search results
wms_urls = {
    'bankline_erosion_2011_2015': 'https://www.nesdr.gov.in/geoportal/NERDRRWS?service=WMS&version=1.1.1&request=GetCapabilities',
    'brahmaputra_bankline_2011': 'https://www.nesdr.gov.in/geoportal/NERDRRWS?service=WMS&version=1.1.1&request=GetCapabilities',
}

# Test WMS GetCapabilities
for name, url in wms_urls.items():
    print(f'\nTesting {name}...')
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read().decode('utf-8')
            print(f'  Response length: {len(data)} chars')
            # Save first 2000 chars
            print(f'  Preview: {data[:500]}...')
    except Exception as e:
        print(f'  Error: {e}')

# Try direct WMS GetMap for Brahmaputra Bankline 2011
print('\n\nTesting WMS GetMap for Brahmaputra Bankline 2011...')
# Kamrup Metro bounding box (approx)
# MinX: 91.4, MinY: 25.9, MaxX: 91.9, MaxY: 26.3
bbox = '91.4,25.9,91.9,26.3'
wms_getmap = f'https://www.nesdr.gov.in/geoportal/NERDRRWS?service=WMS&version=1.1.1&request=GetMap&layers=Brahmaputra_Bankline_2011&styles=&bbox={bbox}&width=800&height=600&srs=EPSG:4326&format=image/png'

print(f'URL: {wms_getmap[:100]}...')
try:
    req = urllib.request.Request(wms_getmap, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read()
        out_path = os.path.join(OUTPUT_DIR, 'nesdr_bankline_2011_kamrup_metro.png')
        with open(out_path, 'wb') as f:
            f.write(data)
        print(f'  Saved image: {out_path} ({len(data)} bytes)')
except Exception as e:
    print(f'  Error: {e}')

# Try WFS for vector data
print('\n\nTesting WFS for vector data...')
wfs_url = 'https://www.nesdr.gov.in/geoportal/NERDRRWS?service=WFS&version=1.1.0&request=GetCapabilities'
try:
    req = urllib.request.Request(wfs_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        data = response.read().decode('utf-8')
        print(f'  WFS Response length: {len(data)} chars')
        # Look for layer names
        import re
        layers = re.findall(r'<Name>(.*?)</Name>', data)
        print(f'  Available layers: {layers[:20]}')
except Exception as e:
    print(f'  Error: {e}')
