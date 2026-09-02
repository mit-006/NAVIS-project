import fitz  # PyMuPDF
import os
import re
import sys

# Set stdout encoding
sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
PDF_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'landslide', 'asdma', '366_landslide_prone_areas_of_kamrup_metro.pdf')

print('='*70)
print('Extracting text from ASDMA 366 Landslide PDF')
print('='*70)

doc = fitz.open(PDF_PATH)
print(f'Number of pages: {len(doc)}')

# Extract ALL text
all_text = ''
for page_num in range(len(doc)):
    page = doc[page_num]
    text = page.get_text()
    all_text += text + '\n\n'

# Save full text
text_path = os.path.join(BASE_DIR, 'data', 'inspection', 'asdma_landslide_raw_text.txt')
os.makedirs(os.path.dirname(text_path), exist_ok=True)
with open(text_path, 'w', encoding='utf-8') as f:
    f.write(all_text)
print(f'Saved full text to: {text_path}')
print(f'Total text length: {len(all_text)} characters')

# Print first 5000 chars
print('\n--- First 5000 characters ---')
print(all_text[:5000])

doc.close()
