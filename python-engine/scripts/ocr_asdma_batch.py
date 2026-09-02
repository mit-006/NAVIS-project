import sys, os, re, csv, json, time
sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
PDF_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'landslide', 'asdma', '366_landslide_prone_areas_of_kamrup_metro.pdf')
OUTPUT_DIR = os.path.join(BASE_DIR, 'data', 'inspection')
os.makedirs(OUTPUT_DIR, exist_ok=True)

import fitz
import easyocr
import numpy as np

print('='*70)
print('ASDMA 366 Landslide - Batch OCR (3 pages at a time)')
print('='*70)

reader = easyocr.Reader(['en'], gpu=False, verbose=False)
doc = fitz.open(PDF_PATH)
total_pages = len(doc)
print(f'PDF: {total_pages} pages')

# Skip page 1 (cover) and page 2 (already done)
# Process pages 3-24 (indices 2-23)
BATCH_SIZE = 2  # 2 pages per batch to avoid timeout
all_records = []

# Load existing records if any
existing_path = os.path.join(OUTPUT_DIR, 'asdma_landslide_366_locations.csv')
if os.path.exists(existing_path):
    with open(existing_path, 'r', encoding='utf-8') as f:
        reader_csv = csv.DictReader(f)
        all_records = list(reader_csv)
    print(f'Loaded {len(all_records)} existing records')

def parse_page_results(items, page_num):
    """Parse OCR items into structured records"""
    records = []
    
    # Group into rows
    rows = []
    current_row = []
    current_y = None
    
    for item in items:
        if current_y is None or abs(item['y'] - current_y) < 25:
            current_row.append(item)
            current_y = item['y'] if current_y is None else (current_y + item['y']) / 2
        else:
            if current_row:
                current_row.sort(key=lambda r: r['x'])
                rows.append(current_row)
            current_row = [item]
            current_y = item['y']
    if current_row:
        current_row.sort(key=lambda r: r['x'])
        rows.append(current_row)
    
    for row in rows:
        row_text = ' | '.join(r['text'] for r in row)
        
        # Skip non-data rows
        if any(kw in row_text.upper() for kw in ['SL.', 'PIN', 'SITE LOC', 'LATITUDE', 'LONGITUDE', 'ASSAM STATE', 'GOVERNMENT', 'HILLOCK']):
            continue
        if 'LANDSLIDE' in row_text.upper() and 'PRONE' in row_text.upper():
            continue
        
        sl_no = None
        pin_code = None
        hillock_no = None
        site_location = None
        latitude = None
        longitude = None
        
        for item in row:
            x = item['x']
            t = item['text']
            
            if x < 420 and re.match(r'^\d{1,3}$', t):
                sl_no = int(t)
            elif 440 < x < 600 and re.match(r'^\d{2,3}$', t):
                pin_code = t
            elif (680 < x < 820 or 880 < x < 1020) and re.match(r'^\d{1,3}$', t):
                hillock_no = t
            elif 1100 < x < 1480 and len(t) > 2 and not re.match(r'^\d+$', t):
                if site_location is None:
                    site_location = t
                else:
                    site_location += ' ' + t
            elif 1650 < x < 1820 and re.search(r'[°*\d].*[NSns]', t):
                latitude = t
            elif 1900 < x < 2100 and re.search(r'[°*\d].*[EWew]', t):
                longitude = t
        
        if sl_no is not None:
            records.append({
                'sl_no': str(sl_no),
                'pin_code': pin_code or '',
                'hillock_no': hillock_no or '',
                'site_location': site_location or '',
                'latitude': latitude or '',
                'longitude': longitude or '',
                'page': str(page_num),
                'raw': row_text
            })
    
    return records

# Get existing SL numbers
existing_sls = set()
for r in all_records:
    try:
        existing_sls.add(int(r['sl_no']))
    except:
        pass

print(f'Existing SL.NO count: {len(existing_sls)}')

# Process remaining pages
for page_idx in range(1, total_pages):  # skip cover (index 0)
    page_num = page_idx + 1
    
    page = doc[page_num - 1]
    print(f'\nPage {page_num}...', end=' ', flush=True)
    
    t0 = time.time()
    mat = fitz.Matrix(250/72, 250/72)  # Lower DPI for speed
    pix = page.get_pixmap(matrix=mat)
    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    
    results = reader.readtext(img_data, detail=1)
    elapsed = time.time() - t0
    print(f'{len(results)} items in {elapsed:.1f}s', end=' ')
    
    # Extract items
    items = []
    for bbox, text, conf in results:
        if conf > 0.2 and text.strip():
            y_center = (bbox[0][1] + bbox[2][1]) / 2
            x_center = (bbox[0][0] + bbox[2][0]) / 2
            items.append({
                'x': x_center,
                'y': y_center,
                'text': text.strip(),
                'confidence': conf
            })
    
    new_records = parse_page_results(items, page_num)
    
    # Filter duplicates
    added = 0
    for rec in new_records:
        sl = int(rec['sl_no'])
        if sl not in existing_sls:
            all_records.append(rec)
            existing_sls.add(sl)
            added += 1
    
    print(f'-> {len(new_records)} parsed, {added} new (total: {len(all_records)})')
    
    # Save after each page
    csv_path = os.path.join(OUTPUT_DIR, 'asdma_landslide_366_locations.csv')
    with open(csv_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['sl_no', 'pin_code', 'hillock_no', 'site_location', 'latitude', 'longitude', 'page', 'raw'])
        writer.writeheader()
        writer.writerows(all_records)

doc.close()

# Final summary
print(f'\n{"="*70}')
print(f'FINAL RESULTS')
print(f'{"="*70}')
print(f'Total records: {len(all_records)}')
print(f'With coordinates: {sum(1 for r in all_records if r["latitude"] and r["longitude"])}')
print(f'With site location: {sum(1 for r in all_records if r["site_location"])}')
print(f'With pin code: {sum(1 for r in all_records if r["pin_code"])}')
print(f'With hillock no: {sum(1 for r in all_records if r["hillock_no"])}')

sl_nos = sorted([int(r['sl_no']) for r in all_records if r['sl_no'].isdigit()])
if sl_nos:
    print(f'SL.NO range: {min(sl_nos)}-{max(sl_nos)}')
    missing = set(range(min(sl_nos), max(sl_nos)+1)) - set(sl_nos)
    print(f'Missing SL.NO ({len(missing)}): {sorted(missing)[:30]}...' if len(missing) > 30 else f'Missing SL.NO ({len(missing)}): {sorted(missing)}')

print(f'\nFirst 10:')
for r in all_records[:10]:
    print(f'  #{r["sl_no"]}: PIN={r["pin_code"]}, H={r["hillock_no"]}, {r["site_location"][:45] if r["site_location"] else "?"}, ({r["latitude"]}, {r["longitude"]})')

print(f'\nLast 10:')
for r in all_records[-10:]:
    print(f'  #{r["sl_no"]}: PIN={r["pin_code"]}, H={r["hillock_no"]}, {r["site_location"][:45] if r["site_location"] else "?"}, ({r["latitude"]}, {r["longitude"]})')

# Save JSON
json_path = os.path.join(OUTPUT_DIR, 'asdma_landslide_366_locations.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(all_records, f, indent=2, ensure_ascii=False)
print(f'\nSaved: {csv_path}')
print(f'Saved: {json_path}')
