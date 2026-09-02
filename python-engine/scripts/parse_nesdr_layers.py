import urllib.request
import xml.etree.ElementTree as ET
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
OUTPUT_DIR = os.path.join(BASE_DIR, 'data', 'raw', 'erosion')

print('='*70)
print('Parsing NeSDR WMS Capabilities')
print('='*70)

# Get WMS capabilities
url = 'https://www.nesdr.gov.in/geoportal/NERDRRWS?service=WMS&version=1.1.1&request=GetCapabilities'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, timeout=30) as response:
    xml_data = response.read().decode('utf-8')

# Parse XML
root = ET.fromstring(xml_data)

# Find all layers
print('\nAvailable layers:')
layers = []
for layer in root.iter('Layer'):
    name_elem = layer.find('Name')
    title_elem = layer.find('Title')
    if name_elem is not None and title_elem is not None:
        name = name_elem.text
        title = title_elem.text
        # Check for bbox
        bbox = layer.find('LatLonBoundingBox')
        bbox_str = ''
        if bbox is not None:
            bbox_str = f' ({bbox.get("minx")},{bbox.get("miny")},{bbox.get("maxx")},{bbox.get("maxy")})'
        layers.append({'name': name, 'title': title, 'bbox': bbox_str})
        print(f'  {name}: {title}{bbox_str}')

# Filter for erosion/bankline layers
print('\n\nErosion/Bankline related layers:')
for layer in layers:
    name_lower = layer['name'].lower()
    title_lower = layer['title'].lower()
    if any(kw in name_lower or kw in title_lower for kw in ['erosion', 'bank', 'bankline', 'cropdam', 'landloss']):
        print(f'  {layer["name"]}: {layer["title"]}{layer["bbox"]}')

# Try to get WMS GetMap for erosion layers
print('\n\nDownloading erosion-related layers for Kamrup Metro area...')
# Kamrup Metro bbox: approx 91.4E to 91.9E, 25.9N to 26.3N
bbox = '91.4,25.9,91.9,26.3'

erosion_layers = [l for l in layers if any(kw in l['name'].lower() or kw in l['title'].lower() 
                   for kw in ['erosion', 'bank', 'bankline', 'cropdam', 'landloss'])]

for layer in erosion_layers[:5]:  # Limit to 5
    print(f'\n  Downloading: {layer["name"]}...')
    wms_url = f'https://www.nesdr.gov.in/geoportal/NERDRRWS?service=WMS&version=1.1.1&request=GetMap&layers={layer["name"]}&styles=&bbox={bbox}&width=800&height=600&srs=EPSG:4326&format=image/png'
    
    try:
        req = urllib.request.Request(wms_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            out_path = os.path.join(OUTPUT_DIR, f'nesdr_{layer["name"]}_kamrup_metro.png')
            with open(out_path, 'wb') as f:
                f.write(data)
            print(f'    Saved: {out_path} ({len(data)} bytes)')
    except Exception as e:
        print(f'    Error: {e}')
