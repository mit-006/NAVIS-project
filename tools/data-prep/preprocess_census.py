"""Pre-process Census amenities to a smaller CSV"""
import pandas as pd
import os

BASE = 'C:/Users/DELL/OneDrive/Documents/Default Project/resqmap'
census_file = f'{BASE}/data/raw/relocation/census_amenities/DH_PartXIIA_Village_KamrupMetro.xlsx'

print("Reading Census header...")
header = pd.read_excel(census_file, sheet_name='Village_Data_1800', nrows=0, engine='openpyxl')
all_cols = list(header.columns)
print(f"Total columns: {len(all_cols)}")

# Critical columns only
critical = [
    'District Code', 'Village Code',
    'Total Geographical Area (in Hectares)',
    'Total   Households ', 'Total Population of Village',
    'Total Scheduled Castes Population of Village',
    'Total Scheduled Tribes Population of Village',
    'Govt Primary School (Status A(1)/NA(2))',
    'Govt  Middle School (Status A(1)/NA(2))',
    'Govt Secondary School (Status A(1)/NA(2))',
    'Community Health Centre (Numbers)',
    'Primary Health Centre (Numbers)',
    'Primary Heallth Sub Centre (Numbers)',
    'Hospital Allopathic (Numbers)',
    'Dispensary (Numbers)',
    'Tap Water (Numbers)',
    'Hand Pump (Numbers)',
    'Tube well/ Bore well (Numbers)',
    'Bus Service (Numbers)',
    'Nearest Railway Station (Numbers)',
    'Bank (Numbers)',
    'ATM (Numbers)',
    'Telephone (Numbers)',
    'Mobile (Numbers)',
]
avail = [c for c in critical if c in all_cols]
print(f"Available: {len(avail)}/{len(critical)}")

# Read all, then filter (pandas read_excel doesn't support chunksize)
print("Reading full file (may take a minute)...")
census_all = pd.read_excel(census_file, sheet_name='Village_Data_1800', 
                           usecols=avail, engine='openpyxl')
print(f"Total villages: {len(census_all)}")

# Filter to Kamrup Metro (District Code = 322)
kamrup = census_all[census_all['District Code'] == 322].copy()
print(f"Kamrup Metro villages: {len(kamrup)}")

# Save as CSV for faster loading
output = f'{BASE}/data/processed/kamrup_metro_census_amenities.csv'
kamrup.to_csv(output, index=False)
print(f"Saved: {output} ({os.path.getsize(output):,} bytes)")

# Show sample
print("\nSample data:")
print(kamrup.head(3).to_string())
