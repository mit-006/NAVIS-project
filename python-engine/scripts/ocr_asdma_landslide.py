import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
PDF_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'landslide', 'asdma', '366_landslide_prone_areas_of_kamrup_metro.pdf')
OUTPUT_DIR = os.path.join(BASE_DIR, 'data', 'inspection')
os.makedirs(OUTPUT_DIR, exist_ok=True)

print('='*70)
print('ASDMA 366 Landslide PDF - OCR Extraction')
print('='*70)

try:
    import fitz  # PyMuPDF
    import pytesseract
    from PIL import Image
    import io
except ImportError as e:
    print(f'Missing package: {e}')
    print('Install: pip install pymupdf pytesseract pillow')
    sys.exit(1)

# Open PDF
doc = fitz.open(PDF_PATH)
print(f'PDF pages: {len(doc)}')

# OCR each page
all_text = []
for page_num in range(len(doc)):
    page = doc[page_num]
    print(f'\nProcessing page {page_num + 1}/{len(doc)}...')
    
    # Render page at 300 DPI
    mat = fitz.Matrix(300/72, 300/72)
    pix = page.get_pixmap(matrix=mat)
    
    # Convert to PIL Image
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    
    # OCR
    text = pytesseract.image_to_string(img, lang='eng')
    all_text.append(f'--- Page {page_num + 1} ---\n{text}')
    
    # Show first 500 chars
    print(f'  Extracted {len(text)} chars')
    if text.strip():
        print(f'  Preview: {text[:300]}...')

doc.close()

# Save all OCR text
ocr_text = '\n\n'.join(all_text)
ocr_path = os.path.join(OUTPUT_DIR, 'asdma_landslide_366_ocr_raw.txt')
with open(ocr_path, 'w', encoding='utf-8') as f:
    f.write(ocr_text)
print(f'\nSaved raw OCR to: {ocr_path}')
print(f'Total OCR text: {len(ocr_text)} chars')

# Parse for structured data
print('\n' + '='*70)
print('PARSING OCR RESULTS')
print('='*70)

lines = ocr_text.split('\n')

# Look for patterns
locations = []
coordinates = []
ward_numbers = []
table_data = []

for i, line in enumerate(lines):
    line_stripped = line.strip()
    if not line_stripped:
        continue
    
    # Look for coordinate patterns (lat/lon)
    coord_match = re.search(r'(\d{1,3})[°.]\s*(\d{1,2})[\'′.]\s*(\d{1,2})[\"″.]?\s*([NS])\s*,?\s*(\d{1,3})[°.]\s*(\d{1,2})[\'′.]\s*(\d{1,2})[\"″.]?\s*([EW])', line_stripped)
    if coord_match:
        coordinates.append(line_stripped)
        print(f'  COORDINATE: {line_stripped}')
    
    # Look for ward numbers
    ward_match = re.search(r'[Ww]ard\s*(?:No\.?|Number|#)?\s*(\d+)', line_stripped)
    if ward_match:
        ward_numbers.append(ward_match.group(0))
    
    # Look for numbered items (likely locations)
    loc_match = re.match(r'^(\d+)\.?\s+(.+)', line_stripped)
    if loc_match and len(loc_match.group(2)) > 3:
        locations.append({
            'number': loc_match.group(1),
            'name': loc_match.group(2)
        })

print(f'\nLocations found: {len(locations)}')
print(f'Coordinates found: {len(coordinates)}')
print(f'Ward references: {len(ward_numbers)}')

if locations:
    print('\nFirst 20 locations:')
    for loc in locations[:20]:
        print(f"  {loc['number']}. {loc['name']}")

if coordinates:
    print('\nCoordinates found:')
    for coord in coordinates[:10]:
        print(f'  {coord}')

if ward_numbers:
    print('\nWard references:')
    for ward in ward_numbers[:10]:
        print(f'  {ward}')
