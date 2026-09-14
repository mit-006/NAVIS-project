# NAVIS Progress & Handoff

## Status

* Current batch: 9 (Backend/API and security audit)
* Overall progress: Batch 1–6 completed; Batch 7 implemented locally; ML/backend/security audit remains open
* Current source/ZIP: NAVIS-project-batch7-gis-geometry-audit.zip
* Last updated: 2026-09-14
* Branch: fix/hygiene-branding (ZIP has no .git; commit/push locally)

## Batch 6 — Data & Methodology Audit

### Completed

* [x] Audited the current static flood GeoJSON structure and headline counts: 228 habitation features; 152 exposed and 76 never-exposed are internally consistent with the current dataset.
* [x] Cross-checked the five analysed flood years represented in the current data: 1998, 1999, 2004, 2012, 2013.
* [x] Verified the frontend flood-priority model uses the documented 40/30/30 weighting for maximum exposure, flood frequency, and population exposure.
* [x] Verified the relocation suitability implementation uses the documented 25/15/20/25/15 weighting: elevation, slope, road accessibility, amenities, and vulnerable-population proximity.
* [x] Added the relocation-suitability formula and component normalization rules to `frontend/src/pages/Methodology.jsx` so the methodology page documents what the frontend actually computes.
* [x] Corrected the real-time flood card label from `30d avg` to `14d avg`, matching the actual `slice(-14)` calculation in `floodDataService.js`.
* [x] Changed the real-time card footer label from `Updated` to `Fetched` because the displayed timestamp is the application's fetch time, not the upstream observation timestamp.
* [x] Removed the stale README claim of `28 / 28 browser checks passed` and replaced it with the currently supported verification statement; responsive/mobile QA remains explicitly pending.
* [x] Removed the duplicated sentence in the README disclaimer.

### Verification / honesty notes

* The current static flood dataset is internally consistent for the audited counts and frontend formulas. An older reference set had different derived exposure statistics; without provenance for that reference, the discrepancy is not treated as a confirmed bug in this batch.
* Real-time flood data is fetched client-side from Open-Meteo/GloFAS when available. The UI should not imply that its fetch timestamp is the source observation timestamp.
* Relocation suitability is a preliminary analytical score, not a government certification of safety, ownership, construction feasibility, or final relocation suitability.


## Batch 7 — GIS/CRS and Relocation Geometry Audit

### Completed

* [x] Found and fixed a frontend marker-placement defect: relocation polygons were reduced to a raw average of ring vertices, which can place a marker outside a concave polygon or in an unintended part of the geometry.
* [x] Relocation map markers now use a deterministic interior-point routine with polygon containment testing; MultiPolygon candidates use the largest polygon component.
* [x] Kept candidate polygons unchanged; only the displayed marker point is derived from the existing GeoJSON geometry.
* [x] Found and fixed a Python GIS CRS hazard in `phase3_candidate_analysis.py`: DEM sampling previously assumed habitation geometry coordinates were already in the DEM CRS. The pipeline now reprojects to `dem_src.crs` before centroid/pixel sampling.
* [x] Made DEM nodata handling explicit (`nodata is not None`) instead of relying on truthiness.

### Important limitation

* [x] Confirmed the candidate pipeline still has **no water-body GIS exclusion layer**. The repository does not currently contain a water polygon dataset used by candidate generation, so the system must NOT claim that every candidate is water-free or physically available land. The new frontend fix guarantees the marker is inside the candidate polygon; it does not certify that the polygon itself contains no water.
* [ ] Adding a real water-body exclusion remains a separate data-acquisition task and should only be implemented after an authoritative/traceable water GIS layer is added.

### Verification

* [x] Static GeoJSON CRS checked: flood exposure and relocation candidate outputs are EPSG:4326.
* [x] Candidate output contains 76 polygon features; candidate IDs are unique in the existing generated dataset.
* [x] Code-level review completed for the marker-generation and DEM-sampling paths.
* [ ] Browser verification of the new interior-marker logic and local `npm run build` still required.


## Batch 9 — Backend/API + Security Audit

### DONE

* [x] Confirmed the Node/Express backend is a stub and is not the source of current frontend risk/relocation results.
* [x] Removed the misleading behavior where `/api/risk/:regionId` returned HTTP 200 with a placeholder result after only checking Python `/health`.
* [x] Backend risk/redzone/relocation endpoints now return explicit `501 Not Implemented` responses until real integration exists.
* [x] Added strict `regionId` validation for the placeholder risk route.
* [x] Restricted Express CORS to configured origins instead of `*`; default development origin is `http://localhost:5173`.
* [x] Restricted FastAPI CORS to configured origins, GET methods, and required headers; removed wildcard origins/credentials.
* [x] Added a 100 KB JSON body limit and generic JSON/error handling to the Express app.
* [x] Disabled Express `X-Powered-By` header.
* [x] Corrected backend/Python timestamps to explicit UTC in the Python health response.
* [x] Corrected README wording so unverified responsive viewport claims are not presented as completed validation.

### VERIFIED

* [x] No committed secrets were found during the audit.
* [x] No database is actually connected by the current application flow.
* [x] No frontend service currently depends on the backend risk/redzone/relocation routes for the primary static-data dashboards.
* [x] Backend remains intentionally non-production until real API/data integration is implemented.

### BLOCKERS

* [ ] Real risk, redzone, and relocation API implementations do not exist.
* [ ] Authentication/authorization is not implemented because there is currently no protected backend workflow.
* [ ] Production deployment configuration is not present.

### NEXT

* [ ] Automated tests for deterministic scoring/GIS logic.
* [ ] UI/UX polish and responsive QA.
* [ ] Final end-to-end SIH demo/readiness audit.

## Next recommended batch

* [ ] GIS/CRS and relocation-candidate geometry audit: verify CRS assumptions, candidate polygons, water-body exclusion, representative points, and route endpoints against the actual project datasets.
* [ ] ML/statistical claim audit: identify any claimed ML model, accuracy, validation, leakage, or prediction numbers and verify that the repository actually contains the corresponding implementation/evidence.
* [ ] Backend/API/security audit after the static architecture is fully documented.
* [ ] Automated tests for deterministic GIS-derived scoring logic where practical.
* [ ] Mobile/responsive QA and bundle optimization after correctness work.

## Resume workflow on Windows

1. Preserve the user's `.git` directory.
2. Sync the next batch with `robocopy /MIR ... /XD .git`.
3. Run `npm install`, `npm run build`, and `npm run dev` from `NAVIS-project\frontend`.
4. Perform the requested browser checks before committing.
5. Commit and push to `fix/hygiene-branding` only after local verification.

## Git

Expected branch:

```powershell
git checkout fix/hygiene-branding
git status
git add -A
git commit -m "Audit data methodology and consistency"
git push origin fix/hygiene-branding
```
