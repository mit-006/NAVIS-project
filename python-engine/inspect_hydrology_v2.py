import csv, json, statistics
from datetime import datetime
from collections import defaultdict

BBOX = {"south": 25.9730, "north": 26.3189, "west": 91.5053, "east": 92.2287}

def read_csv(path):
    with open(path, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.DictReader(f)
        return reader.fieldnames, list(reader)

def safe_float(v):
    if v is None or v.strip() == '':
        return None
    try:
        return float(v)
    except:
        return None

def safe_date(v):
    if v is None or v.strip() == '':
        return None
    v = v.strip()
    for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d',
                '%d-%m-%Y %H:%M:%S', '%d-%m-%Y %H:%M', '%d-%m-%Y',
                '%d/%m/%Y %H:%M:%S', '%d/%m/%Y %H:%M', '%d/%m/%Y',
                '%d-%b-%Y %H:%M', '%d-%b-%Y']:
        try:
            return datetime.strptime(v, fmt)
        except:
            continue
    return None

def is_in_bbox(lat, lon):
    if lat is None or lon is None:
        return None
    return (BBOX['south'] <= lat <= BBOX['north'] and
            BBOX['west'] <= lon <= BBOX['east'])

# ========================================
# INSPECT GWL (re-check with proper encoding)
# ========================================
print("=" * 60)
print("RE-CHECK: GWL")
print("=" * 60)
path_gwl = r"C:\Users\DELL\OneDrive\Documents\Default Project\resqmap\data\raw\hydrology\gwl_tel_6_hourly_assam_2026_2030.csv"
cols_gwl, rows_gwl = read_csv(path_gwl)
print(f"Columns: {len(cols_gwl)}")
print(f"Records: {len(rows_gwl)}")
if rows_gwl:
    print(f"First row: {rows_gwl[0]}")
else:
    # Check raw file content
    with open(path_gwl, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()
    print(f"Raw lines: {len(lines)}")
    print(f"First line: {repr(lines[0][:200])}")
    if len(lines) > 1:
        print(f"Second line: {repr(lines[1][:200])}")

print()
print("=" * 60)
print("RE-CHECK: RAINFALL MANUAL DAILY")
print("=" * 60)
path_rf = r"C:\Users\DELL\OneDrive\Documents\Default Project\resqmap\data\raw\hydrology\rainfall_manual_daily_assam_2026_2030.csv"
cols_rf, rows_rf = read_csv(path_rf)
print(f"Columns: {len(cols_rf)}")
print(f"Records: {len(rows_rf)}")
if rows_rf:
    print(f"First row: {rows_rf[0]}")
else:
    with open(path_rf, 'r', encoding='utf-8-sig') as f:
        lines = f.readlines()
    print(f"Raw lines: {len(lines)}")
    print(f"First line: {repr(lines[0][:200])}")
    if len(lines) > 1:
        print(f"Second line: {repr(lines[1][:200])}")

print()
print("=" * 60)
print("RE-CHECK: RAINFALL TELEMETRY HOURLY")
print("=" * 60)
path_rft = r"C:\Users\DELL\OneDrive\Documents\Default Project\resqmap\data\raw\hydrology\rainfall_tel_hr_assam_2026_2030.csv"
cols_rft, rows_rft = read_csv(path_rft)
print(f"Columns: {len(cols_rft)}, Records: {len(rows_rft)}")

# Parse timestamps properly
timestamps_rft = []
measurements_rft = []
stations_rft = {}
for row in rows_rft:
    sname = row.get('Station', '').strip()
    lat = safe_float(row.get('Latitude'))
    lon = safe_float(row.get('Longitude'))
    ts_raw = row.get('Data Acquisition Time', '').strip()
    mval = safe_float(row.get('Telemetry Hourly Rainfall (mm)'))
    
    dt = safe_date(ts_raw)
    if dt:
        timestamps_rft.append(dt)
    if mval is not None:
        measurements_rft.append(mval)
    
    if sname and sname not in stations_rft:
        in_bbox = is_in_bbox(lat, lon)
        stations_rft[sname] = {'lat': lat, 'lon': lon, 'records': 0, 'in_bbox': in_bbox, 'timestamps': []}
    if sname:
        stations_rft[sname]['records'] += 1
        if dt:
            stations_rft[sname]['timestamps'].append(dt)

timestamps_rft.sort()
print(f"Unique timestamps parsed: {len(set(timestamps_rft))}")
if timestamps_rft:
    print(f"Date range: {min(timestamps_rft)} to {max(timestamps_rft)}")
    
    # Check duration
    duration = max(timestamps_rft) - min(timestamps_rft)
    print(f"Duration: {duration.days} days ({duration.days/30.44:.1f} months)")
    
    # Days with data
    dates_only = sorted(set(t.date() for t in timestamps_rft))
    print(f"Unique dates: {len(dates_only)}")
    print(f"First 5 dates: {dates_only[:5]}")
    print(f"Last 5 dates: {dates_only[-5:]}")
    
    # Gap analysis
    gaps = []
    for i in range(1, len(dates_only)):
        gap = (dates_only[i] - dates_only[i-1]).days
        if gap > 1:
            gaps.append((dates_only[i-1], dates_only[i], gap))
    print(f"Date gaps > 1 day: {len(gaps)}")
    if gaps:
        for g in gaps[:10]:
            print(f"  {g[0]} to {g[1]}: {g[2]} days gap")

if measurements_rft:
    print(f"\nRainfall measurement stats:")
    print(f"  Count: {len(measurements_rft)}")
    print(f"  Min: {min(measurements_rft):.2f} mm")
    print(f"  Max: {max(measurements_rft):.2f} mm")
    print(f"  Mean: {statistics.mean(measurements_rft):.2f} mm")
    print(f"  Median: {statistics.median(measurements_rft):.2f} mm")
    
    # Check for suspicious values
    suspicious = [m for m in measurements_rft if m > 500]
    print(f"  Values > 500mm: {len(suspicious)} ({suspicious[:5]})")
    
    # Distribution
    bins = [0, 1, 5, 10, 25, 50, 100, 500, 10000]
    for i in range(len(bins)-1):
        count = sum(1 for m in measurements_rft if bins[i] <= m < bins[i+1])
        print(f"  [{bins[i]}, {bins[i+1]}): {count}")

print(f"\nKamrup Metro stations in RF telemetry:")
for sname, s in stations_rft.items():
    if s['in_bbox']:
        ts_range = f"{min(s['timestamps'])} to {max(s['timestamps'])}" if s['timestamps'] else 'N/A'
        print(f"  {sname}: ({s['lat']}, {s['lon']}) | {s['records']} records | {ts_range}")

print()
print("=" * 60)
print("RE-CHECK: RIVER WATER LEVEL")
print("=" * 60)
path_rwl = r"C:\Users\DELL\OneDrive\Documents\Default Project\resqmap\data\raw\hydrology\rwl_tel_hr_assam_2026_2030.csv"
cols_rwl, rows_rwl = read_csv(path_rwl)
print(f"Columns: {len(cols_rwl)}, Records: {len(rows_rwl)}")
print(f"Columns: {cols_rwl}")

# Check ALL columns for measurement
print(f"\nSample rows with ALL fields:")
for i, row in enumerate(rows_rwl[:3]):
    print(f"  Row {i}: River={row.get('River','')}, RWL={row.get('River Water Level Telemetry Hourly (meter)','')}, MSL={row.get('MeanSeaLevel','')}, RL={row.get('RL_of_zeroGauge','')}, Discharge={row.get('Is_DischargeDataAvailable','')}, Time={row.get('Data Acquisition Time','')}")

# Parse timestamps
timestamps_rwl = []
stations_rwl = {}
for row in rows_rwl:
    sname = row.get('Station', '').strip()
    lat = safe_float(row.get('Latitude'))
    lon = safe_float(row.get('Longitude'))
    ts_raw = row.get('Data Acquisition Time', '').strip()
    rwl_val = safe_float(row.get('River Water Level Telemetry Hourly (meter)'))
    
    dt = safe_date(ts_raw)
    if dt:
        timestamps_rwl.append(dt)
    
    if sname and sname not in stations_rwl:
        in_bbox = is_in_bbox(lat, lon)
        stations_rwl[sname] = {'lat': lat, 'lon': lon, 'records': 0, 'in_bbox': in_bbox, 'timestamps': [], 'rwl_values': []}
    if sname:
        stations_rwl[sname]['records'] += 1
        if dt:
            stations_rwl[sname]['timestamps'].append(dt)
        if rwl_val is not None:
            stations_rwl[sname]['rwl_values'].append(rwl_val)

timestamps_rwl.sort()
print(f"\nUnique timestamps parsed: {len(set(timestamps_rwl))}")
if timestamps_rwl:
    print(f"Date range: {min(timestamps_rwl)} to {max(timestamps_rwl)}")
    duration = max(timestamps_rwl) - min(timestamps_rwl)
    print(f"Duration: {duration.days} days ({duration.days/30.44:.1f} months)")
    dates_only = sorted(set(t.date() for t in timestamps_rwl))
    print(f"Unique dates: {len(dates_only)}")
    print(f"First 5 dates: {dates_only[:5]}")
    print(f"Last 5 dates: {dates_only[-5:]}")

print(f"\nStation details:")
for sname, s in stations_rwl.items():
    bbox_label = 'IN BBOX' if s['in_bbox'] == True else ('OUTSIDE' if s['in_bbox'] == False else 'NO COORDS')
    ts_range = f"{min(s['timestamps'])} to {max(s['timestamps'])}" if s['timestamps'] else 'N/A'
    rwl_vals = s['rwl_values']
    rwl_stats = ""
    if rwl_vals:
        rwl_stats = f"RWL min={min(rwl_vals):.3f} max={max(rwl_vals):.3f} mean={statistics.mean(rwl_vals):.3f}"
    print(f"  {sname}: ({s['lat']}, {s['lon']}) | {bbox_label} | {s['records']} records | {ts_range} | {rwl_stats}")

# Check River field values
rivers = set(row.get('River', '').strip() for row in rows_rwl)
print(f"\nRiver values: {rivers}")
