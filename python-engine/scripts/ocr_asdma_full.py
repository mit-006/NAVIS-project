import sys, os, re, csv, json
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
print('ASDMA 366 Landslide - Full OCR Extraction (All Pages)')
print('='*70)

print('Init reader...')
reader = easyocr.Reader(['en'], gpu=False, verbose=False)
print('Reader ready.')

doc = fitz.open(PDF_PATH)
total_pages = len(doc)
print(f'PDF pages: {total_pages}')

# Table headers from page 2
# SL. NO | PIN CODE | HILLOCK NO. | SITE LOCATION | LATITUDE | LONGITUDE
# We need to parse each row into these fields

all_records = []
page_labels = {
    1: 'Cover',
    2: 'Fatasil (Ward 25)',
}

for page_num in range(total_pages):
    page = doc[page_num]
    print(f'\n--- Page {page_num + 1}/{total_pages} ---')
    
    mat = fitz.Matrix(300/72, 300/72)
    pix = page.get_pixmap(matrix=mat)
    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)
    
    results = reader.readtext(img_data, detail=1)
    print(f'  Got {len(results)} text regions')
    
    # Sort by y then x
    results_sorted = sorted(results, key=lambda r: (r[0][0][1], r[0][0][0]))
    
    # Extract all text items with positions
    items = []
    for bbox, text, conf in results_sorted:
        if conf > 0.2 and text.strip():
            y_center = (bbox[0][1] + bbox[2][1]) / 2
            x_center = (bbox[0][0] + bbox[2][0]) / 2
            x_left = bbox[0][0]
            items.append({
                'x': x_center,
                'y': y_center,
                'x_left': x_left,
                'text': text.strip(),
                'confidence': conf
            })
    
    # Group into rows by y-proximity
    rows = []
    current_row = []
    current_y = None
    
    for item in items:
        if current_y is None or abs(item['y'] - current_y) < 20:
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
    
    print(f'  {len(rows)} rows detected')
    
    # Parse rows for data
    # Column positions (approximate from page 2):
    # SL.NO: x ~370
    # PIN CODE: x ~515
    # HILLOCK NO: x ~744 (sometimes ~945)
    # SITE LOCATION: x ~1200-1350
    # LATITUDE: x ~1720-1730
    # LONGITUDE: x ~1995-2005
    
    for row in rows:
        row_text = ' | '.join(r['text'] for r in row)
        
        # Check if this looks like a data row (has a number as first item)
        first_text = row[0]['text']
        
        # Skip header rows
        if any(kw in row_text.upper() for kw in ['SL.', 'PIN', 'SITE', 'LATITUDE', 'LONGITUDE', 'ASSAM STATE', 'GOVERNMENT', 'HILLOCK']):
            continue
        
        # Try to extract structured data
        sl_no = None
        pin_code = None
        hillock_no = None
        site_location = None
        latitude = None
        longitude = None
        
        for item in row:
            x = item['x']
            t = item['text']
            
            # SL.NO column (x ~370)
            if x < 420 and re.match(r'^\d{1,3}$', t):
                sl_no = int(t)
            # PIN CODE column (x ~515)
            elif 440 < x < 600 and re.match(r'^\d{2,3}$', t):
                pin_code = t
            # HILLOCK NO column (x ~744 or ~945)
            elif (680 < x < 800 or 880 < x < 1000) and re.match(r'^\d{1,3}$', t):
                hillock_no = t
            # SITE LOCATION (x ~1200-1400)
            elif 1100 < x < 1450 and len(t) > 3 and not re.match(r'^\d+$', t):
                if site_location is None:
                    site_location = t
                else:
                    site_location += ' ' + t
            # LATITUDE (x ~1720)
            elif 1650 < x < 1800 and re.search(r'[°*\d].*[NS]', t):
                latitude = t
            # LONGITUDE (x ~1995)
            elif 1920 < x < 2100 and re.search(r'[°*\d].*[EW]', t):
                longitude = t
        
        if sl_no is not None:
            record = {
                'page': page_num + 1,
                'sl_no': sl_no,
                'pin_code': pin_code,
                'hillock_no': hillock_no,
                'site_location': site_location,
                'latitude': latitude,
                'longitude': longitude,
                'raw': row_text
            }
            all_records.append(record)

doc.close()

print(f'\nTotal records extracted: {len(all_records)}')

# Save as CSV
csv_path = os.path.join(OUTPUT_DIR, 'asdma_landslide_366_locations.csv')
with open(csv_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['sl_no', 'pin_code', 'hillock_no', 'site_location', 'latitude', 'longitude', 'page', 'raw'])
    writer.writeheader()
    writer.writerows(all_records)
print(f'Saved CSV to: {csv_path}')

# Save as JSON
json_path = os.path.join(OUTPUT_DIR, 'asdma_landslide_366_locations.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(all_records, f, indent=2, ensure_ascii=False)
print(f'Saved JSON to: {json_path}')

# Summary stats
print(f'\n--- Summary ---')
print(f'Total records: {len(all_records)}')
print(f'Records with coordinates: {sum(1 for r in all_records if r["latitude"] and r["longitude"])}')
print(f'Records with site location: {sum(1 for r in all_records if r["site_location"])}')
print(f'Records with pin code: {sum(1 for r in all_records if r["pin_code"])}')
print(f'Records with hillock no: {sum(1 for r in all_records if r["hillock_no"])}')

# Show first 20
print(f'\nFirst 20 records:')
for r in all_records[:20]:
    print(f'  #{r["sl_no"]}: PIN={r["pin_code"]}, H={r["hillock_no"]}, {r["site_location"][:40] if r["site_location"] else "?"}, ({r["latitude"]}, {r["longitude"]})')

# Show last 10
print(f'\nLast 10 records:')
for r in all_records[-10:]:
    print(f'  #{r["sl_no"]}: PIN={r["pin_code"]}, H={r["hillock_no"]}, {r["site_location"][:40] if r["site_location"] else "?"}, ({r["latitude"]}, {r["longitude"]})')

# Check for gaps in sequence
sl_nos = [r['sl_no'] for r in all_records]
if sl_nos:
    max_sl = max(sl_nos)
    missing = set(range(1, max_sl + 1)) - set(sl_nos)
    print(f'\nSL.NO range: 1-{max_sl}')
    print(f'Missing SL.NO: {sorted(missing) if missing else "None"}')
