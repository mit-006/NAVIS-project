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
print('ASDMA 366 Landslide PDF - EasyOCR Extraction')
print('='*70)

import fitz  # PyMuPDF
import easyocr
from PIL import Image
import numpy as np

# Initialize EasyOCR
print('Initializing EasyOCR (this may take a moment)...')
reader = easyocr.Reader(['en'], gpu=False, verbose=False)
print('EasyOCR initialized.')

# Open PDF
doc = fitz.open(PDF_PATH)
print(f'PDF pages: {len(doc)}')

# Process first 6 pages (intro + start of table)
NUM_PAGES = min(6, len(doc))
all_ocr_results = []

for page_num in range(NUM_PAGES):
    page = doc[page_num]
    print(f'\n--- Processing page {page_num + 1}/{NUM_PAGES} ---')
    
    # Render at 300 DPI
    mat = fitz.Matrix(300/72, 300/72)
    pix = page.get_pixmap(matrix=mat)
    
    # Convert to numpy array
    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    
    # OCR
    results = reader.readtext(img_data, detail=1)
    
    print(f'  Found {len(results)} text regions')
    
    # Sort by vertical position then horizontal
    results_sorted = sorted(results, key=lambda r: (r[0][0][1], r[0][0][0]))
    
    for bbox, text, conf in results_sorted:
        if conf > 0.3 and text.strip():
            y_center = (bbox[0][1] + bbox[2][1]) / 2
            x_center = (bbox[0][0] + bbox[2][0]) / 2
            all_ocr_results.append({
                'page': page_num + 1,
                'x': x_center,
                'y': y_center,
                'text': text.strip(),
                'confidence': conf
            })

doc.close()

# Save all OCR results
print(f'\nTotal OCR results: {len(all_ocr_results)}')

# Print page by page
for page_num in range(1, NUM_PAGES + 1):
    page_results = [r for r in all_ocr_results if r['page'] == page_num]
    print(f'\n--- Page {page_num}: {len(page_results)} items ---')
    
    # Sort by y then x
    page_results.sort(key=lambda r: (r['y'], r['x']))
    
    for r in page_results[:30]:  # Show first 30
        print(f'  [{r["confidence"]:.2f}] ({r["x"]:.0f},{r["y"]:.0f}) {r["text"]}')

# Parse for locations and coordinates
print('\n' + '='*70)
print('PARSING FOR STRUCTURED DATA')
print('='*70)

# Collect all text per page
page_texts = {}
for r in all_ocr_results:
    if r['page'] not in page_texts:
        page_texts[r['page']] = []
    page_texts[r['page']].append(r)

# Reconstruct text lines
all_lines = []
for page_num in sorted(page_texts.keys()):
    items = sorted(page_texts[page_num], key=lambda r: (r['y'], r['x']))
    
    # Group by y-position (same line)
    lines_on_page = []
    current_line = []
    current_y = None
    
    for item in items:
        if current_y is None or abs(item['y'] - current_y) < 15:
            current_line.append(item)
            current_y = item['y'] if current_y is None else (current_y + item['y']) / 2
        else:
            if current_line:
                current_line.sort(key=lambda r: r['x'])
                line_text = ' '.join(r['text'] for r in current_line)
                all_lines.append({'page': page_num, 'y': current_y, 'text': line_text})
            current_line = [item]
            current_y = item['y']
    
    if current_line:
        current_line.sort(key=lambda r: r['x'])
        line_text = ' '.join(r['text'] for r in current_line)
        all_lines.append({'page': page_num, 'y': current_y, 'text': line_text})

# Save reconstructed text
reconstructed = '\n'.join(f"[P{line['page']}] {line['text']}" for line in all_lines)
recon_path = os.path.join(OUTPUT_DIR, 'asdma_landslide_366_ocr_reconstructed.txt')
with open(recon_path, 'w', encoding='utf-8') as f:
    f.write(reconstructed)
print(f'Saved reconstructed text to: {recon_path}')
print(f'Total lines: {len(all_lines)}')

# Search for coordinates
print('\nSearching for coordinates...')
coord_patterns = [
    r'(\d{1,3})\s*[°\.]\s*(\d{1,2})\s*[\'′]\s*(\d{1,2})\s*[\"″]?\s*([NS])',
    r'(\d{1,3})\s*[°\.]\s*(\d{1,2})\s*[\'′]\s*(\d{1,2})\s*[\"″]?\s*([EW])',
    r'(\d{2}\.\d{4,})\s*,\s*(\d{2,3}\.\d{4,})',  # decimal degrees
]

found_coords = []
for line in all_lines:
    for pattern in coord_patterns:
        matches = re.findall(pattern, line['text'])
        if matches:
            found_coords.append({'page': line['page'], 'text': line['text'], 'matches': matches})

if found_coords:
    print(f'Found {len(found_coords)} lines with coordinates:')
    for c in found_coords[:10]:
        print(f'  Page {c["page"]}: {c["text"][:100]}')
else:
    print('No coordinate patterns found')

# Search for numbered items
print('\nSearching for numbered locations...')
numbered_items = []
for line in all_lines:
    match = re.match(r'^.*?(\d{1,3})\s*[.)\]\s]\s*(.+)', line['text'])
    if match:
        num = match.group(1)
        name = match.group(2).strip()
        if len(name) > 2 and int(num) <= 400:
            numbered_items.append({'page': line['page'], 'number': int(num), 'name': name})

print(f'Found {len(numbered_items)} numbered items')
if numbered_items:
    for item in numbered_items[:20]:
        print(f'  #{item["number"]} (P{item["page"]}): {item["name"][:80]}')

# Search for ward/area keywords
print('\nSearching for ward/area/locations...')
keywords = ['ward', 'village', 'locality', 'area', 'prone', 'hill', 'slope', 'gaon', 'mouza']
keyword_matches = []
for line in all_lines:
    text_lower = line['text'].lower()
    for kw in keywords:
        if kw in text_lower:
            keyword_matches.append({'page': line['page'], 'keyword': kw, 'text': line['text']})
            break

print(f'Found {len(keyword_matches)} lines with keywords')
for m in keyword_matches[:15]:
    print(f'  [{m["keyword"]}] P{m["page"]}: {m["text"][:100]}')

# Save full results
print('\nDone.')
