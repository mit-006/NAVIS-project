import fitz  # PyMuPDF
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.join(SCRIPT_DIR, '..', '..')
PDF_PATH = os.path.join(BASE_DIR, 'data', 'raw', 'landslide', 'asdma', '366_landslide_prone_areas_of_kamrup_metro.pdf')

print('='*70)
print('Extracting tables from ASDMA 366 Landslide PDF')
print('='*70)

doc = fitz.open(PDF_PATH)
print(f'Number of pages: {len(doc)}')

# Try to extract tables using PyMuPDF's table extraction
for page_num in range(len(doc)):
    page = doc[page_num]
    
    # Try extracting tables
    try:
        tabs = page.find_tables()
        if tabs and tabs.tables:
            print(f'\nPage {page_num + 1}: Found {len(tabs.tables)} table(s)')
            for tab_idx, tab in enumerate(tabs.tables):
                print(f'  Table {tab_idx + 1}:')
                data = tab.extract()
                # Print first 5 rows
                for row_idx, row in enumerate(data[:10]):
                    print(f'    Row {row_idx}: {row}')
                if len(data) > 10:
                    print(f'    ... ({len(data)} total rows)')
    except Exception as e:
        print(f'Page {page_num + 1}: Table extraction error: {e}')

doc.close()
