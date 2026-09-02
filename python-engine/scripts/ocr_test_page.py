import sys, os
sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
PDF_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'landslide', 'asdma', '366_landslide_prone_areas_of_kamrup_metro.pdf')
OUTPUT_DIR = os.path.join(BASE_DIR, 'data', 'inspection')
os.makedirs(OUTPUT_DIR, exist_ok=True)

import fitz
import easyocr
import numpy as np

print('Init reader...')
reader = easyocr.Reader(['en'], gpu=False, verbose=False)
print('Reader ready.')

doc = fitz.open(PDF_PATH)

# Process just page 2 (first table page)
page = doc[1]
print(f'Processing page 2...')

mat = fitz.Matrix(300/72, 300/72)
pix = page.get_pixmap(matrix=mat)
img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, 3)

results = reader.readtext(img_data, detail=1)
print(f'Got {len(results)} results')

results_sorted = sorted(results, key=lambda r: (r[0][0][1], r[0][0][0]))

output_lines = []
for bbox, text, conf in results_sorted:
    if conf > 0.2 and text.strip():
        y_center = (bbox[0][1] + bbox[2][1]) / 2
        x_center = (bbox[0][0] + bbox[2][0]) / 2
        line = f'[{conf:.2f}] ({x_center:.0f},{y_center:.0f}) {text.strip()}'
        output_lines.append(line)
        print(line)

doc.close()

out_path = os.path.join(OUTPUT_DIR, 'asdma_page2_ocr.txt')
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))
print(f'\nSaved {len(output_lines)} lines to {out_path}')
