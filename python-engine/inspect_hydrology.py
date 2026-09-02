import csv, json, statistics
from datetime import datetime
from collections import defaultdict

BBOX = {"south": 25.9730, "north": 26.3189, "west": 91.5053, "east": 92.2287}

DATASETS = [
    {
        "name": "Ground Water Level — Telemetry Six-Hourly",
        "filename": "gwl_tel_6_hourly_assam_2026_2030.csv",
        "desc": "GWL telemetry"
    },
    {
        "name": "Rainfall — Manual Daily",
        "filename": "rainfall_manual_daily_assam_2026_2030.csv",
        "desc": "RF manual daily"
    },
    {
        "name": "Rainfall — Telemetry Hourly",
        "filename": "rainfall_tel_hr_assam_2026_2030.csv",
        "desc": "RF telemetry hourly"
    },
    {
        "name": "River Water Level — Telemetry Hourly",
        "filename": "rwl_tel_hr_assam_2026_2030.csv",
        "desc": "RWL telemetry"
    },
]

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
    for fmt in ['%Y-%m-%d %H:%M:%S', '%Y-%m-%d %H:%M', '%Y-%m-%d', '%d-%m-%Y %H:%M:%S', '%d-%m-%Y %H:%M', '%d-%m-%Y', '%d/%m/%Y %H:%M:%S', '%d/%m/%Y %H:%M', '%d/%m/%Y']:
        try:
            return datetime.strptime(v, fmt)
        except:
            continue
    return None

def detect_station_col(cols):
    for c in cols:
        cl = c.lower().strip()
        if 'station' in cl and ('name' in cl or 'id' in cl):
            return c
    for c in cols:
        cl = c.lower().strip()
        if 'station' in cl or 'site' in cl or 'loc' in cl:
            return c
    return None

def detect_lat_col(cols):
    for c in cols:
        cl = c.lower().strip()
        if cl in ('lat', 'latitude', 'lat_deg'):
            return c
    for c in cols:
        cl = c.lower().strip()
        if 'lat' in cl and 'lon' not in cl:
            return c
    return None

def detect_lon_col(cols):
    for c in cols:
        cl = c.lower().strip()
        if cl in ('lon', 'lng', 'longitude', 'lon_deg'):
            return c
    for c in cols:
        cl = c.lower().strip()
        if 'lon' in cl or 'lng' in cl:
            return c
    return None

def detect_date_col(cols):
    for c in cols:
        cl = c.lower().strip()
        if cl in ('date', 'observation_date', 'record_date', 'data_date'):
            return c
    for c in cols:
        cl = c.lower().strip()
        if 'date' in cl and 'time' not in cl:
            return c
    return None

def detect_time_col(cols):
    for c in cols:
        cl = c.lower().strip()
        if cl in ('time', 'observation_time', 'record_time'):
            return c
    for c in cols:
        cl = c.lower().strip()
        if 'time' in cl and 'date' not in cl:
            return c
    return None

def detect_timestamp_col(cols):
    for c in cols:
        cl = c.lower().strip()
        if 'timestamp' in cl or cl == 'datetime' or 'obs_date' in cl:
            return c
    return None

def detect_measurement_col(cols):
    for c in cols:
        cl = c.lower().strip()
        if 'water_level' in cl or 'waterlevel' in cl or 'rwlevel' in cl or 'rw_level' in cl:
            return c
    for c in cols:
        cl = c.lower().strip()
        if 'rainfall' in cl or 'precip' in cl or 'rf' == cl:
            return c
    for c in cols:
        cl = c.lower().strip()
        if 'level' in cl or 'value' in cl or 'measurement' in cl or 'reading' in cl:
            return c
    return None

def detect_unit_col(cols):
    for c in cols:
        cl = c.lower().strip()
        if 'unit' in cl:
            return c
    return None

def detect_station_id_col(cols):
    for c in cols:
        cl = c.lower().strip()
        if cl in ('station_id', 'site_id', 'location_id', 'stn_id'):
            return c
    return None

def is_in_bbox(lat, lon):
    if lat is None or lon is None:
        return None
    return (BBOX['south'] <= lat <= BBOX['north'] and
            BBOX['west'] <= lon <= BBOX['east'])

results = {}

for ds in DATASETS:
    print(f"\n{'='*60}")
    print(f"INSPECTING: {ds['name']}")
    print(f"{'='*60}")
    
    path = f"C:\\Users\\DELL\\OneDrive\\Documents\\Default Project\\resqmap\\data\\raw\\hydrology\\{ds['filename']}"
    
    cols, rows = read_csv(path)
    print(f"Columns ({len(cols)}): {cols}")
    print(f"Records: {len(rows)}")
    
    station_col = detect_station_col(cols)
    station_id_col = detect_station_id_col(cols)
    lat_col = detect_lat_col(cols)
    lon_col = detect_lon_col(cols)
    date_col = detect_date_col(cols)
    time_col = detect_time_col(cols)
    ts_col = detect_timestamp_col(cols)
    meas_col = detect_measurement_col(cols)
    unit_col = detect_unit_col(cols)
    
    print(f"Station name col: {station_col}")
    print(f"Station ID col: {station_id_col}")
    print(f"Lat col: {lat_col}")
    print(f"Lon col: {lon_col}")
    print(f"Date col: {date_col}")
    print(f"Time col: {time_col}")
    print(f"Timestamp col: {ts_col}")
    print(f"Measurement col: {meas_col}")
    print(f"Unit col: {unit_col}")
    
    if cols:
        print(f"\nFirst 3 rows:")
        for i, row in enumerate(rows[:3]):
            print(f"  Row {i}: { {k: row[k] for k in cols} }")
    
    # Collect station info
    stations = {}
    timestamps = []
    measurements = []
    missing_coords = 0
    missing_measurement = 0
    duplicate_station_ts = 0
    station_ts_pairs = set()
    
    for row in rows:
        # Station info
        sname = row.get(station_col, '').strip() if station_col else 'UNKNOWN'
        sid = row.get(station_id_col, '').strip() if station_id_col else sname
        
        lat = safe_float(row.get(lat_col)) if lat_col else None
        lon = safe_float(row.get(lon_col)) if lon_col else None
        
        if lat is None or lon is None:
            missing_coords += 1
        
        if sid and sid not in stations:
            stations[sid] = {
                'name': sname,
                'lat': lat,
                'lon': lon,
                'record_count': 0,
                'timestamps': []
            }
        if sid:
            stations[sid]['record_count'] += 1
        
        # Timestamp
        date_val = row.get(date_col, '').strip() if date_col else ''
        time_val = row.get(time_col, '').strip() if time_col else ''
        ts_raw = row.get(ts_col, '').strip() if ts_col else ''
        
        dt = None
        if ts_raw:
            dt = safe_date(ts_raw)
        if dt is None and date_val:
            if time_val:
                dt = safe_date(date_val + ' ' + time_val)
            else:
                dt = safe_date(date_val)
        
        if dt:
            timestamps.append(dt)
            if sid:
                stations[sid]['timestamps'].append(dt)
            pair_key = (sid, dt)
            if pair_key in station_ts_pairs:
                duplicate_station_ts += 1
            station_ts_pairs.add(pair_key)
        
        # Measurement
        mval = safe_float(row.get(meas_col)) if meas_col else None
        if mval is not None:
            measurements.append(mval)
        else:
            missing_measurement += 1
    
    # Stats
    n_stations = len(stations)
    unique_dates = sorted(set(timestamps))
    
    coords_in_bbox = sum(1 for s in stations.values() if is_in_bbox(s['lat'], s['lon']) == True)
    coords_outside = sum(1 for s in stations.values() if is_in_bbox(s['lat'], s['lon']) == False)
    coords_missing = sum(1 for s in stations.values() if is_in_bbox(s['lat'], s['lon']) is None)
    
    print(f"\nUnique stations: {n_stations}")
    print(f"Station IDs: {list(stations.keys())[:20]}")
    print(f"Stations in bbox: {coords_in_bbox}")
    print(f"Stations outside bbox: {coords_outside}")
    print(f"Stations missing coords: {coords_missing}")
    print(f"Missing coordinates records: {missing_coords}")
    print(f"Missing measurement records: {missing_measurement}")
    print(f"Duplicate station+timestamp pairs: {duplicate_station_ts}")
    
    print(f"\nDate range: {unique_dates[0] if unique_dates else 'N/A'} to {unique_dates[-1] if unique_dates else 'N/A'}")
    print(f"Unique timestamps: {len(unique_dates)}")
    
    if measurements:
        print(f"\nMeasurement stats:")
        print(f"  Count: {len(measurements)}")
        print(f"  Min: {min(measurements):.4f}")
        print(f"  Max: {max(measurements):.4f}")
        print(f"  Mean: {statistics.mean(measurements):.4f}")
        print(f"  Median: {statistics.median(measurements):.4f}")
        print(f"  Std: {statistics.stdev(measurements):.4f}" if len(measurements) > 1 else "  Std: N/A")
    
    # Station details
    print(f"\nStation details:")
    for sid, sinfo in stations.items():
        in_bbox = is_in_bbox(sinfo['lat'], sinfo['lon'])
        bbox_label = 'IN BBOX' if in_bbox == True else ('OUTSIDE' if in_bbox == False else 'NO COORDS')
        ts_min = min(sinfo['timestamps']) if sinfo['timestamps'] else 'N/A'
        ts_max = max(sinfo['timestamps']) if sinfo['timestamps'] else 'N/A'
        print(f"  {sid}: {sinfo['name']} | ({sinfo['lat']}, {sinfo['lon']}) | {bbox_label} | {sinfo['record_count']} records | {ts_min} to {ts_max}")
    
    # Unit
    units = set()
    for row in rows:
        u = row.get(unit_col, '').strip() if unit_col else ''
        if u:
            units.add(u)
    print(f"Units found: {units}")
    
    # Store results
    kamrup_stations = {sid: s for sid, s in stations.items() if is_in_bbox(s['lat'], s['lon']) == True}
    results[ds['filename']] = {
        'columns': cols,
        'n_cols': len(cols),
        'n_records': len(rows),
        'n_stations': n_stations,
        'station_ids': list(stations.keys()),
        'station_col': station_col,
        'lat_col': lat_col,
        'lon_col': lon_col,
        'date_col': date_col,
        'time_col': time_col,
        'ts_col': ts_col,
        'meas_col': meas_col,
        'unit_col': unit_col,
        'units': list(units),
        'min_date': str(unique_dates[0]) if unique_dates else 'N/A',
        'max_date': str(unique_dates[-1]) if unique_dates else 'N/A',
        'unique_timestamps': len(unique_dates),
        'missing_coords': missing_coords,
        'missing_measurement': missing_measurement,
        'duplicate_station_ts': duplicate_station_ts,
        'stations_in_bbox': coords_in_bbox,
        'stations_outside_bbox': coords_outside,
        'stations_missing_coords': coords_missing,
        'kamrup_stations': {sid: {'name': s['name'], 'lat': s['lat'], 'lon': s['lon'], 'records': s['record_count']} for sid, s in kamrup_stations.items()},
        'min_measurement': min(measurements) if measurements else None,
        'max_measurement': max(measurements) if measurements else None,
        'mean_measurement': round(statistics.mean(measurements), 4) if measurements else None,
        'median_measurement': round(statistics.median(measurements), 4) if measurements else None,
    }

# Save results
with open("C:\\Users\\DELL\\OneDrive\\Documents\\Default Project\\resqmap\\data\\raw\\hydrology\\inspection_results.json", 'w') as f:
    json.dump(results, f, indent=2, default=str)

print(f"\n{'='*60}")
print("ALL INSPECTIONS COMPLETE")
print(f"Results saved to inspection_results.json")
print(f"{'='*60}")
