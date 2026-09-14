"""Fix Unicode characters in Python file"""
import re

f = 'C:/Users/DELL/OneDrive/Documents/Default Project/resqmap/python-engine/phase3_candidate_analysis.py'
with open(f, 'r', encoding='utf-8') as fh:
    content = fh.read()

# Replace Unicode characters
content = content.replace('\u2265', '>=')  # >=
content = content.replace('\u2264', '<=')  # <=
content = content.replace('\u2713', 'OK')  # checkmark
content = content.replace('\u2014', '-')    # em dash
content = content.replace('\u2013', '-')    # en dash
content = content.replace('\u00b0', ' deg')  # degree symbol

with open(f, 'w', encoding='utf-8') as fh:
    fh.write(content)

print("Fixed Unicode characters")
