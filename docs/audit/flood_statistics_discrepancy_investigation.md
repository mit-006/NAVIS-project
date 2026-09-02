# Flood Statistics Discrepancy — Investigation Report

**Investigation Date:** 30 August 2026  
**Status:** COMPLETE — DO NOT IMPLEMENT FIXES YET  
**Investigator:** Automated code + data trace

---

## 1. Problem Statement

The judge-ready audit flagged that the year-wise flood exposure statistics (average %, maximum %, estimated population) in the audit spec differ from values computed from the actual processed GeoJSON. The exposed habitation **counts** are correct and match across all sources.

---

## 2. Actual GeoJSON Fields

The processed GeoJSON (`data/processed/kamrup_metro_flood_exposure.geojson`) contains 228 features with 39 fields per feature. Relevant fields:

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `TOT_P` | int | 1761 | Total population (Census 2011) |
| `flood_pct_YYYY` | float | 0.1795... | % of habitation area flooded in year YYYY |
| `flood_area_YYYY` | float | 2253.34 | Flooded area in sq meters |
| `exposed_pop_YYYY` | int | 3 | Estimated exposed population = `TOT_P × flood_pct / 100` |
| `flood_years_exposed` | int | 3 | Count of years with exposure > 0 |
| `flood_frequency` | float | 0.6 | `flood_years_exposed / 5` |
| `max_flood_exposure_pct` | float | 20.37 | Maximum of `flood_pct_YYYY` across all 5 years |

**Computation chain (from processing script, line 148):**
```
exposed_pop_YYYY = round(TOT_P × flood_pct_YYYY / 100)
```

---

## 3. Independent Calculations from GeoJSON

### Definition A: Average among EXPOSED ONLY (flood_pct > 0)

This is what the **frontend** computes (see `floodData.js` line 63):
```javascript
avgExposure: exposedCount > 0 ? totalExposurePct / exposedCount : 0
```

| Year | Exposed | Avg Exposure % | Max Exposure % | Est. Exposed Pop |
|------|---------|----------------|----------------|-----------------|
| 1998 | 129 | 41.89% | 100.00% | 147,064 |
| 1999 | 131 | 28.77% | 93.81% | 111,668 |
| 2004 | 125 | 44.08% | 100.00% | 127,934 |
| 2012 | 102 | 31.26% | 100.00% | 67,831 |
| 2013 | 82 | 28.89% | 100.00% | 46,115 |

### Definition B: Average across ALL 228 habitations (including 76 zeros)

This is what the **processing script** uses in the inspection report (line 238):
```python
hab[pct_col].mean()  # mean across all 228 rows
```

| Year | Avg Exposure % (all 228) |
|------|--------------------------|
| 1998 | 23.70% |
| 1999 | 16.53% |
| 2004 | 24.16% |
| 2012 | 13.98% |
| 2013 | 10.39% |

### Population-weighted average

| Year | Pop-Weighted Avg % |
|------|--------------------|
| 1998 | 20.28% |
| 1999 | 15.39% |
| 2004 | 17.64% |
| 2012 | 9.35% |
| 2013 | 6.36% |

**None of these three definitions match the "previously reported" values from the audit spec.**

---

## 4. Frontend Calculation Logic

**File:** `frontend/src/data/floodData.js`

### `computeYearStats()` (lines 33-69)

```javascript
features.forEach((f) => {
    const pct = p[pctKey] || 0;
    const pop = p[popKey] || 0;
    if (pct > 0) {                           // ← ONLY exposed habitations
        exposedCount++;
        totalExposurePct += pct;              // ← sum of pct for exposed only
        totalExposedPop += pop;
    }
    if (pct > maxExposure) {                  // ← ALL habitations checked for max
        maxExposure = pct;
    }
});
return {
    avgExposure: totalExposurePct / exposedCount,  // ← exposed-only denominator
    maxExposure,                                     // ← correct
    totalExposedPop,                                 // ← sum of exposed_pop_YYYY
};
```

**Key observation:** The frontend computes `avgExposure` using **exposed-only** habitations as the denominator. This produces HIGHER values than averaging across all 228.

### `computeHabitationPriority()` (lines 109-143)

```javascript
const maxExposure = p.max_flood_exposure_pct || 0;   // per-habitation max
const frequency = p.flood_frequency || 0;
const normMaxExposure = maxExposure;
const normFrequency = (frequency * 100);
const normPop = maxTotalPop > 0 ? (maxExposedPop / maxTotalPop) * 100 : 0;
const score = (normMaxExposure * 0.4) + (normFrequency * 0.3) + (normPop * 0.3);
```

**Priority scores use per-habitation fields from the GeoJSON, NOT year-wise averages.** The disputed values (year-wise avg %, max %, population) do NOT affect priority scores.

---

## 5. Original Processing Logic

**File:** `python-engine/scripts/calculate_flood_exposure.py`

### Exposure calculation (line 137):
```python
hab[f'flood_pct_{year}'] = (inter_area / total_area) * 100
```
Area-based percentage, computed in UTM Zone 46N.

### Population estimation (line 148):
```python
hab[f'exposed_pop_{year}'] = (hab['TOT_P'] * hab[f'flood_pct_{year}'] / 100).round(0).astype(int)
```
Simple proportional estimate: `TOT_P × flood_pct / 100`.

### Inspection report generation (line 238):
```python
hab[pct_col].mean()  # ← pandas .mean() on ALL 228 values, including 76 zeros
```

This produces the "all-228" average, which is different from the frontend's "exposed-only" average.

---

## 6. Comparison Table

| Year | Metric | Audit Spec ("Prev.") | Inspection Report | Frontend (current) | Match? |
|------|--------|---------------------|-------------------|--------------------|----|
| 1998 | Exposed | 129 | 129 | 129 | ALL MATCH |
| 1998 | Avg % | **23.14%** | 23.70% | **41.89%** | NONE MATCH |
| 1998 | Max % | 100.00% | 100.00% | 100.00% | ALL MATCH |
| 1998 | Pop | **133,933** | 147,064 | 147,064 | Inspect=Frontend |
| 1999 | Exposed | 131 | 131 | 131 | ALL MATCH |
| 1999 | Avg % | **24.25%** | 16.53% | **28.77%** | NONE MATCH |
| 1999 | Max % | **100.00%** | 93.81% | 93.81% | Inspect=Frontend |
| 1999 | Pop | **136,550** | 111,668 | 111,668 | Inspect=Frontend |
| 2004 | Exposed | 125 | 125 | 125 | ALL MATCH |
| 2004 | Avg % | **20.36%** | 24.16% | **44.08%** | NONE MATCH |
| 2004 | Max % | 100.00% | 100.00% | 100.00% | ALL MATCH |
| 2004 | Pop | **116,135** | 127,934 | 127,934 | Inspect=Frontend |
| 2012 | Exposed | 102 | 102 | 102 | ALL MATCH |
| 2012 | Avg % | **13.92%** | 13.98% | **31.26%** | NONE MATCH |
| 2012 | Max % | **82.45%** | 100.00% | 100.00% | Inspect=Frontend |
| 2012 | Pop | **84,679** | 67,831 | 67,831 | Inspect=Frontend |
| 2013 | Exposed | 82 | 82 | 82 | ALL MATCH |
| 2013 | Avg % | **9.24%** | 10.39% | **28.89%** | NONE MATCH |
| 2013 | Max % | **63.76%** | 100.00% | 100.00% | Inspect=Frontend |
| 2013 | Pop | **52,059** | 46,115 | 46,115 | Inspect=Frontend |

---

## 7. Exact Root Cause

**There are TWO distinct issues:**

### Issue A: The "previously reported" values are stale

The audit spec's "previously verified" values (23.14%, 24.25%, etc.) do NOT match **any current source** — not the GeoJSON, not the frontend, not the inspection report. They appear to be from an **older version** of the data or an earlier processing run. Evidence:

- **Max exposure for 1999:** Audit spec says 100.00%, but current GeoJSON shows 93.81%. The current GeoJSON's value is correct (verified by re-computation from the raw processed data).
- **Max exposure for 2012:** Audit spec says 82.45%, current shows 100.00%.
- **Max exposure for 2013:** Audit spec says 63.76%, current shows 100.00%.
- **Population values:** Audit spec values don't match any computation method on the current data.

The GeoJSON was likely regenerated at some point (possibly when the flood polygon data was re-downloaded or re-processed), and the audit spec values were never updated.

### Issue B: The inspection report uses a different averaging denominator

The processing script (`calculate_flood_exposure.py` line 238) computes:
```python
hab[pct_col].mean()  # ALL 228 habitations
```

The frontend (`floodData.js` line 63) computes:
```javascript
totalExposurePct / exposedCount  // ONLY exposed habitations (pct > 0)
```

This produces systematically different values:
- **All-228 average** is LOWER (includes 76 zeros in denominator)
- **Exposed-only average** is HIGHER (only divides by exposed count)

Both are mathematically valid, but they answer different questions:
- All-228: "What fraction of total habitation area is exposed on average?" → useful for overall risk assessment
- Exposed-only: "When a habitation IS exposed, how much of it is flooded?" → useful for understanding severity among affected areas

---

## 8. Source of Truth

**The current processed GeoJSON is the source of truth.** It is:
- Reproducible from the processing script (`calculate_flood_exposure.py`)
- Consistent with the raw NDEM flood data
- Verified by independent computation

**Correct values from the GeoJSON (exposed-only average, as computed by the frontend):**

| Year | Exposed | Avg Exposure % | Max Exposure % | Est. Exposed Pop |
|------|---------|----------------|----------------|-----------------|
| 1998 | 129 | 41.89% | 100.00% | 147,064 |
| 1999 | 131 | 28.77% | 93.81% | 111,668 |
| 2004 | 125 | 44.08% | 100.00% | 127,934 |
| 2012 | 102 | 31.26% | 100.00% | 67,831 |
| 2013 | 82 | 28.89% | 100.00% | 46,115 |

---

## 9. Impact Assessment

### Does the discrepancy affect the deployed dashboard?

| Component | Affected? | Details |
|-----------|-----------|---------|
| Flood Map | **NO** | Displays per-habitation exposure from GeoJSON fields directly |
| Overview | **YES** | `computeYearStats()` shows the exposed-only average, max, and population. These ARE the correct values from the current GeoJSON. The audit spec's "previously verified" values were stale. |
| Historical Analysis | **YES** | Shows year-wise summary using `computeYearStats()`. Same as Overview. |
| Priority Analysis | **NO** | Uses per-habitation `max_flood_exposure_pct`, `flood_frequency`, and `exposed_pop_YYYY`. None of the disputed year-wise averages are used in priority scoring. |
| Habitation Explorer | **NO** | Shows per-habitation data from GeoJSON fields |
| Relocation Candidates | **NO** | Derived from flood_years_exposed (never-exposed filter). Not affected by avg/max/pop values. |

### Do priority scores depend on the disputed values?

**NO.** Priority scores are computed from:
- `max_flood_exposure_pct` — per-habitation maximum (correct in GeoJSON)
- `flood_frequency` — per-habitation frequency (correct in GeoJSON)
- `exposed_pop_YYYY` / `TOT_P` — per-habitation population ratio (correct in GeoJSON)

The year-wise averages and totals are **display-only** statistics, not inputs to scoring.

---

## 10. Recommended Fix

### What to fix:

1. **Update the inspection report** (`data/inspection/flood_exposure_inspection.md`) to use the **exposed-only** average (matching the frontend), OR document both definitions clearly.

2. **Update documentation** that references the stale "previously verified" values. The correct values are the ones currently computed by the frontend from the GeoJSON.

3. **Optionally add a clarifying note** to the Overview page explaining that "Avg Exposure %" means "average among exposed habitations only" (not all 228).

### What NOT to change:

- **Do NOT change the GeoJSON** — it is correct
- **Do NOT change the frontend code** — `computeYearStats()` correctly computes exposed-only averages
- **Do NOT change priority scores** — they are unaffected
- **Do NOT change relocation candidates** — they are unaffected
- **Do NOT change processing script** — it correctly generates the GeoJSON

### Specific fix for the inspection report:

Change line 238 of `calculate_flood_exposure.py` (the report generation) from:
```python
hab[pct_col].mean()
```
to:
```python
hab.loc[hab[pct_col] > 0, pct_col].mean()
```

And re-run the report generation to update `flood_exposure_inspection.md`.

---

## 11. Files That Would Need Modification

| File | Change | Priority |
|------|--------|----------|
| `python-engine/scripts/calculate_flood_exposure.py` | Line 238: Change `.mean()` to `.loc[>0].mean()` in report generation | Medium |
| `data/inspection/flood_exposure_inspection.md` | Regenerate with corrected averages | Medium |
| `docs/audit/resqmap_judge_ready_audit.md` | Update Section 1.3 to reflect corrected values | Low |

**No frontend files need modification.** The frontend is already correct.

---

## INVESTIGATION STATUS: COMPLETE

**ROOT CAUSE:** Two issues — (1) the audit spec's "previously verified" values are stale (from an older data version, not the current GeoJSON); (2) the inspection report uses all-228 averaging while the frontend uses exposed-only averaging, producing systematically different values.

**RECOMMENDED FIX:** Update the inspection report to use exposed-only averaging (matching the frontend). Update documentation to remove stale "previously verified" values. No code changes needed in the frontend.

**CODE CHANGED:** NO

**DATA CHANGED:** NO
