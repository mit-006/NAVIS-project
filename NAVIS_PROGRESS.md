# NAVIS Progress & Handoff

## Status

* Current batch: 5 (demo flood-safety + global alert notification)
* Overall progress: Batch 1 done, Batch 2 mostly done, Batch 3 dark-mode/map UX done, Batch 4 implemented; deeper backend/GIS/ML audit and remaining polish still open
* Current source/ZIP: NAVIS-project-fix-hygiene-branding.zip
* Last updated: this session
* Branch: fix/hygiene-branding (ZIP has no .git; commit/push locally)

## Batch 4 — Demo flood-safety + global alert notification

* [x] Corrected live `site-c` demo coordinates from 26.155/91.680 to 26.205/91.668 and elevation 105→193; verified against `kamrup_metro_flood_exposure.geojson` as inside Agyathuri with 0 exposed years / 0.0% max exposure.
* [x] Mirrored the coordinate/elevation correction in the unused `demoData.js` copy.
* [x] Added a global in-app simulated-flood alert visible from any routed page while demo mode is active; clicking it navigates directly to `/map`.
* [x] Alert state is owned by `DemoModeContext`, so it is not tied to FloodMap rendering.
* [x] Kept existing siren/audio behavior and simulation logic unchanged.

## Architecture

* Frontend: React + Vite + Tailwind, HashRouter, 8 routed pages, reads static precomputed GeoJSON from `frontend/public/data/`
* Backend: Node/Express — NOT functional. `backend/src/routes/risk.js` endpoints return placeholder/empty responses. Not deployed anywhere.
* Database: none present
* Python/GIS: `python-engine/scripts/*` — offline preprocessing scripts (flood exposure, landslide exposure, habitation layer). `python-engine/app/main.py` (FastAPI) only exposes `/health`, no real GIS endpoints. Not deployed.
* APIs: no live backend/API in production; all data is static, precomputed, bundled with the frontend
* Docker/Deployment: no Dockerfiles found; frontend deployed to Vercel (static); backend/python-engine have no deployment config
* Tests: none found beyond ad-hoc manual test/debug scripts (now moved to `tools/` folders, not a real test suite)

## Completed

* [x] Removed orphaned dead code (`Dashboard.jsx`, `MapView.jsx`, unrouted)
* [x] Renamed "ResQMap"/"resqmap" → "NAVIS"/"navis" across backend, python-engine, package.json names, logo (`navis-logo.png`), localStorage key (`navis-theme`), `ResQAssistant.jsx`→`NavisAssistant.jsx`
* [x] Added "navis" trigger phrases to in-app assistant intents (kept old "resqmap" phrasing as fallback synonyms)
* [x] Moved debug/one-off scripts into `tools/data-prep/`, `frontend/tools/`, `python-engine/tools/`
* [x] Untracked internal audit docs (`docs/audit/*`) into gitignored `internal/` folder
* [x] Fixed README GitHub Repository link (currently points to `mit-006/NAVIS-project` fork — still needs correcting to canonical `khushivadgama/...` repo, see Remaining)
* [x] Updated README Project Structure diagram for new `tools/` folders
* [x] Built custom Tailwind theme (`tailwind.config.js`): brand teal-navy scale, signal amber accent, severity scale, custom KPI type scale, custom fonts (Inter/Space Grotesk/JetBrains Mono)
* [x] Replaced stock-Tailwind-hex severity/priority colors in `frontend/src/data/floodData.js` and `relocationData.js` with custom palette (centralized, cascades to map/badges/charts)
* [x] App-wide brand re-skin: CSS layer in `frontend/src/index.css` remaps all `blue-*` utility classes (~150+ uses, 13 files) to new brand teal, light+dark mode, without editing those files individually
* [x] Added Google Fonts, rebranded header gradient, applied `.font-display`/`.stat-number` to Overview page as pattern example
* [x] Dark-mode gap fixes: added missing overrides for amber-900/800, yellow-600/700, orange-700, green-900, bg-amber-400/500/600/900, bg-yellow-50, border-amber-500/800, border-yellow-100/orange-100, bg-gray-200 (progress-bar tracks), bg-slate-700 — these were unstyled/broken in dark mode across Relocation Sites (limitations banner, flood-history box, pending-validation box, KPI cards, score-breakdown bars) and shared components (WhatIfSimulatorPanel, HabitationDetailPanel, RiskExplanationPanel, DemoEmergencyPanel, DemoControlPanel, PriorityAnalysis, Methodology)
* [x] Relocation Sites map sizing fixed: map container was a fixed `h-[300px] md:h-[400px]` regardless of screen size, leaving very little usable map area (worse once zoomed in). Changed to `h-[420px] md:h-[560px] lg:h-[640px]`, consistent with FloodMap.jsx's map-forward sizing. Did not touch FitBounds/zoom logic or any GIS/data logic — pure layout fix.
* [x] Reviewed DetailPanel (side panel) positioning — already renders correctly as a full-height slide-over sibling, not nested inside the map's `relative` container, so no structural fix was needed; only its color classes were covered by the dark-mode gap fixes above

## In Progress

* [ ] Typography pattern (`font-display` headings, `stat-number` KPIs) — only applied to Overview.jsx; 7 pages remain: FloodMap, HistoricalAnalysis, HabitationExplorer, PriorityAnalysis, RelocationSites, Methodology

## Remaining

* [ ] Remaining dark-mode gaps (if any) are now much smaller — Relocation Sites, shared panels, and card components had all known missing color-class overrides added this batch. Not exhaustively swept across every page/component; if new visual bugs surface, same fix pattern applies (add the missing `.dark .<class>` rule in `frontend/src/index.css`).
* [ ] Layout restructuring (map-forward vs. generic sidebar+content) — not attempted, highest risk/effort item in Batch 2, needs explicit design decision first
* [ ] Icon system — still generic inline SVG paths hardcoded in `App.jsx`
* [ ] Batch 3: backend honesty fix — user has NOT yet chosen between (a) actually deploying/wiring the Python+Node backend for real GIS computation, or (b) rewriting README to honestly describe the actual static-data architecture and removing/labeling the unused stub code. Ask before proceeding. Prior recommendation given to user: option (b) is lower-risk this close to deadline.
* [ ] Batch 4: flood exposure stats discrepancy — year-wise avg/max exposure % and population in current GeoJSON don't match an earlier "previously verified" reference set (record counts match, derived stats don't). Investigate `python-engine/scripts/calculate_flood_exposure.py` + `docs/data-requirements/`. Details in `internal/audit/flood_statistics_discrepancy_investigation.md` (local only, gitignored).
* [ ] Batch 6: Methodology.jsx missing relocation-suitability section (only on RelocationSites.jsx); mobile responsive QA never done beyond desktop 1440px; bundle is ~1MB/290KB gzip (React.lazy code-splitting not applied); `navis-logo.png` (1.1MB) and `siren.mp3` (197KB) uncompressed; `HashRouter` could move to `BrowserRouter`+Vercel rewrites (optional, cosmetic URLs only); README repo link needs pointing to canonical `khushivadgama/...` repo instead of the `mit-006` fork
* [ ] No security/CORS/input-validation review done yet — backend is non-functional stubs so this applies once/if Batch 3 wires it up for real
* [ ] No automated tests exist for GIS/exposure/priority calculation logic — not yet assessed for what's worth testing
* [ ] Full whole-repo audit requested by user (data correctness, GIS/CRS validity, ML validation numbers, leakage audit, Docker/CI, etc. per their new master-prompt) has NOT been performed yet — everything above came from a UI/repo-hygiene-focused audit, not the deeper scientific/data-pipeline review now being requested

## Batch 5 — Global demo alert reliability + land-verified relocation markers (2026-09-14)

### User-reported verification findings

* Local production build passed, but browser testing showed the global simulated-flood alert was not visible from non-map pages.
* Browser testing also showed multiple demo relocation markers visually positioned over blue water areas. The previous site-c fix was insufficient because the other synthetic site coordinates were also not grounded in the relocation-candidate geometry.

### Root-cause fixes

* `frontend/src/components/DemoAlertNotification.jsx` now renders through a React portal into `document.body`, uses a high stacking order (`z-[20000]`), and derives visibility directly from `demoMode`. This avoids route/overlay stacking-context issues and keeps the alert present on every routed page for the entire DEMO session. Clicking the alert navigates directly to `/map`.
* Removed the now-unnecessary transient `demoAlertVisible` state from `DemoModeContext.jsx`; the notification lifecycle is now exactly the DEMO lifecycle instead of a second state machine.
* `frontend/src/demo/demoEmergencyScenario.js` now uses representative points from the project's `preliminary_relocation_candidates.geojson` for all four simulated relocation markers:
  * RC-025 Agyathuri — 26.205848, 91.667828 — 0 exposed years — elevation 193 m — suitability 56.85
  * RC-029 No.2 Bonda Grant — 26.176986, 91.843815 — 0 exposed years — elevation 60 m — suitability 56.25
  * RC-038 Kalitakuchi N.C. — 26.159718, 91.851107 — 0 exposed years — elevation 109 m — suitability 53.92
  * RC-011 Bonda — 26.169489, 91.855334 — 0 exposed years — elevation 167 m — suitability 60.27
* The four points were checked against the relocation-candidate GeoJSON geometry and are contained by candidate polygons whose `exposed_years` value is 0. This is a stronger placement basis than the previous arbitrary demo coordinates.
* The legacy `demoData.js` mirror was updated so the stale site-c coordinate no longer remains.
* Demo map popups now expose the candidate ID, historical exposed-year count, capacity, and elevation so the source basis is visible during the demo.
* Demo route labels were changed from named real-road claims to `Simulated access route` because the current frontend does not have a live road-routing engine. This avoids presenting synthetic polylines as verified road navigation.

### Verification status

* [x] Frontend `npm run build` was successfully run by the user after Batch 4 changes: 703 modules transformed; production build completed.
* [x] All four new relocation marker endpoints were verified against the project's relocation-candidate GeoJSON: candidate polygon contains point and `exposed_years=0`.
* [ ] User must refresh/restart Vite after this Batch 5 code update and verify the global alert on Overview, Historical, Relocation, etc.
* [ ] User must click the alert and verify URL becomes `/#/map`.
* [ ] User must run the simulation and verify all relocation markers render on candidate land rather than water.
* [ ] Re-run `npm run build` after Batch 5 changes.

### Exact resume point

* Current task: Batch 5 fixes for the two browser-confirmed demo problems: cross-page alert visibility and water-positioned relocation markers.
* Next action: user refreshes local Vite app, enters DEMO from Overview, confirms alert is visible globally, clicks it to reach Flood Map, then runs the simulation and confirms all four candidate markers are on land.
* If a marker still visually overlaps blue water after this change, do not move it arbitrarily again. Inspect the underlying candidate polygon/basemap geometry and correct the candidate selection or map rendering root cause.

## Changed Files

58 files in Batch 1 (renames/moves/deletions, see git log message "Repo hygiene + brand consistency cleanup"), plus Batch 2 UI/data-token changes, Batch 4 demo fixes, and Batch 5 demo reliability/GIS-placement fixes. Current Batch 5 files: `frontend/src/components/DemoAlertNotification.jsx`, `frontend/src/demo/DemoModeContext.jsx`, `frontend/src/demo/demoEmergencyScenario.js`, `frontend/src/demo/demoData.js`, `frontend/src/components/DemoMapOverlay.jsx`, `frontend/src/App.jsx`, `NAVIS_PROGRESS.md`.

## Technical/Data Decisions

* Canonical brand name: NAVIS everywhere (code, docs, UI, package names)
* Canonical team repo: `https://github.com/khushivadgama/NAVIS---Natural-hazard-Assesment-Vulnerability-Intelligence-System` — `mit-006/NAVIS-project` is the user's personal fork where all work is being staged
* Workflow: accumulate all batches on the fork locally across sessions, hand off to teammate (khushivadgama, has real write access) at the end for final push/merge — do not merge PRs early. A PR was opened once (fork → upstream) and deliberately closed for this reason.
* Debug/one-off scripts live in `tools/` subfolders, not loose in root/frontend/python-engine root
* Internal audit/investigation docs are gitignored under `internal/`, not committed publicly
* Design tokens (established Batch 2, reuse — don't invent new ones): `brand-50` `#EAF2F4` through `brand-950` `#061A22`; `signal-500` `#E8A33D`; `severity-none/low/moderate/high/critical/safe`; fonts `font-sans`=Inter, `font-display`=Space Grotesk, `font-mono`=JetBrains Mono; utility classes `.stat-number`, `.font-display`

## Known Issues/Risks

* User is not very familiar with git internals — needs concrete Windows/PowerShell command sequences, not Mac/Linux syntax, not abstract explanations. `git apply`/patch files were confusing and abandoned in favor of full-zip + `robocopy /MIR`. Plain `robocopy` without `/MIR` does NOT delete removed files (confirmed failure mode in a prior session — left `Dashboard.jsx` behind after copy).
* User has a limited number of messages/turns per session — must work in large batches, minimize back-and-forth, and always leave a resumable handoff rather than ending mid-task.
* Backend/python-engine are currently non-functional decorative stubs — if Batch 3 chooses to actually wire them up, that's a substantial scope increase (deployment, real endpoints, security review) versus the README-honesty option.
* This session has NOT yet performed the full scientific/data/ML audit the user's new master-prompt (see below) requests — validation metrics (precision 86.33%, recall 42.18%, F1 56.67%, false-alarm 6.65%, missed-event 57.82%, 17,100-check leakage audit) were provided BY THE USER in their prompt and have not been independently verified against the actual codebase yet.

## Verification

* Build: Batch 4 build was verified locally by the user. Batch 5 build has not yet been run because frontend dependencies are not installed in this sandbox; run `npm run build` locally after copying Batch 5.
* Tests: no automated test suite exists.
* Lint/type-check: not configured/run.
* Browser: not available here; locally verify demo alert on every page, click-to-map redirect, siren behavior, and relocation markers.
* API/data/GIS: all 4 live demo site coordinates checked against `kamrup_metro_flood_exposure.geojson`; site-c now resolves to Agyathuri with 0 exposed years / 0.0% max exposure.

## Result Optimization Log

| Change | Reason | Before | After | Validation | Trade-off |
| ------ | ------ | ------ | ----- | ---------- | --------- |
| Demo relocation markers | Several synthetic markers visually landed on water | Arbitrary facility coordinates | Four representative points from never-exposed relocation-candidate polygons | Candidate polygon containment + `exposed_years=0` | Demo endpoints now have a data-backed placement basis |
| Global demo alert | Alert was not visible reliably above route/overlay layers | State flag + normal DOM render | Portal to `document.body`, `z-[20000]`, derived from `demoMode` | Code-level root-cause fix; browser verification pending | None |
| Demo routes | Synthetic polylines were labeled as named real roads | Named road labels | `Simulated access route` | No live road-routing backend exists | Less specific but more honest demo labeling |

## Critical Components Reviewed

* [x] Repo structure / hygiene
* [x] Branding consistency
* [x] Frontend visual design system (Tailwind config, colors, fonts)
* [x] Demo relocation coordinates / flood-safety check — all four Batch 5 candidate endpoints verified against relocation-candidate polygons
* [x] Global demo alert routing/state wiring — portal-based in Batch 5
* [ ] Backend/API logic and security — reviewed only enough to confirm it's non-functional stubs, not reviewed for correctness/security in depth
* [ ] Python/GIS processing scripts — not yet reviewed for correctness (CRS, geometry validity, spatial operations)
* [ ] ML/statistical validation logic — not yet reviewed; metrics in this file's header are user-provided, unverified against code
* [ ] Database — none exists to review
* [ ] Docker/CI/CD — none exists to review
* [ ] Security (secrets, CORS, input validation) — only checked for committed secrets (none found) in Batch 1; no deeper review done
* [ ] Tests — none exist yet to review

## Result Integrity

* Leakage: user states a 17,100-check leakage audit found zero violations — NOT independently verified this session, no leakage-check code has been located/reviewed yet
* Validation: precision/recall/F1/false-alarm/missed-event figures above are user-provided — NOT independently verified against actual code/data this session
* Data integrity: known unresolved discrepancy in flood exposure yearly stats (see Batch 4 above) — record counts match a prior "verified" reference, derived averages/max/population do not
* Traceability: not yet audited end-to-end (source data → processing → GIS → calculation → API → frontend) — this is explicitly requested in the user's new master-prompt and has not started
* Scientific limitations: per user, NAVIS uses yearly-aggregate historical exposure (1998, 1999, 2004, 2012, 2013), does NOT claim certainty about future floods or short-term (hourly/daily/24-72hr) early warning, and available yearly-resolution rainfall did not contribute meaningfully in the ablation study per user's description — not yet independently verified against code

## EXACT RESUME POINT

* Current task: Batch 5 global demo alert reliability + land-verified relocation markers — implemented, data-verified, browser verification pending.
* Last action: moved all four demo relocation markers onto verified never-exposed relocation-candidate polygons, made the global alert portal-based and demo-state-driven, and updated this tracker.
* Next action: refresh the local Vite app, verify the alert on multiple pages and click-to-map, verify all four relocation markers, then rebuild, commit, and push.
* Files/areas: `frontend/src/demo/demoEmergencyScenario.js`, `frontend/src/demo/demoData.js`, `frontend/src/demo/DemoModeContext.jsx`, `frontend/src/components/DemoAlertNotification.jsx`, `frontend/src/components/DemoMapOverlay.jsx`, `frontend/src/App.jsx`.
* Commands: see Windows workflow below.
* Verification required: demo siren/alert, alert click → `/map`, relocation markers outside exposed polygons, build.

## Windows workflow

```powershell
cd "C:\Users\ASUS\Downloads\project\NAVIS-project\frontend"
npm install
npm run build
npm run dev
```

After browser verification:

```powershell
cd "C:\path\to\your\NAVIS-project"
git status
git add -A
git commit -m "Fix demo flood safety and global alert"
git push origin fix/hygiene-branding
```

## SESSION HANDOFF

NAVIS is a React/Vite static-data-driven frontend with non-functional Node/Python backend stubs. Work is staged on `mit-006/NAVIS-project`, branch `fix/hygiene-branding`; do not merge upstream early. User prefers Windows/PowerShell, full-ZIP + `robocopy /MIR`, concise communication, and a fresh updated `NAVIS_PROGRESS.md` after every meaningful batch.

Batch 5 addresses browser-confirmed demo issues: the global simulated-flood alert now portals to `document.body` and derives directly from `demoMode`, and all four relocation markers now use verified never-exposed candidate polygons from `preliminary_relocation_candidates.geojson`. Browser verification and a final Batch 5 build remain pending. The deeper full-repo scientific/GIS/ML/backend audit is still not started.
