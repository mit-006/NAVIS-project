# NAVIS Progress & Handoff

## Status

* Current batch: 3 (dark-mode completion + Relocation Sites map UX)
* Overall progress: Batch 1 done, Batch 2 mostly done (typography rollout to remaining pages still open), Batch 3 (this one) done for its stated scope, Batches "backend honesty"/4/5 not started
* Current source/ZIP: navis-project-updated.zip (this file ships inside it, at repo root)
* Last updated: this session
* Branch: fix/hygiene-branding (local + pushed to fork, not merged upstream)

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
* [ ] Batch 5: Methodology.jsx missing relocation-suitability section (only on RelocationSites.jsx); mobile responsive QA never done beyond desktop 1440px; bundle is ~1MB/290KB gzip (React.lazy code-splitting not applied); `navis-logo.png` (1.1MB) and `siren.mp3` (197KB) uncompressed; `HashRouter` could move to `BrowserRouter`+Vercel rewrites (optional, cosmetic URLs only); README repo link needs pointing to canonical `khushivadgama/...` repo instead of the `mit-006` fork
* [ ] No security/CORS/input-validation review done yet — backend is non-functional stubs so this applies once/if Batch 3 wires it up for real
* [ ] No automated tests exist for GIS/exposure/priority calculation logic — not yet assessed for what's worth testing
* [ ] Full whole-repo audit requested by user (data correctness, GIS/CRS validity, ML validation numbers, leakage audit, Docker/CI, etc. per their new master-prompt) has NOT been performed yet — everything above came from a UI/repo-hygiene-focused audit, not the deeper scientific/data-pipeline review now being requested

## Changed Files

58 files in Batch 1 (renames/moves/deletions, see git log message "Repo hygiene + brand consistency cleanup"), plus in Batch 2 (uncommitted as of this handoff, staged only in sandbox — user still needs to copy zip → commit locally): `tailwind.config.js`, `frontend/src/index.css`, `frontend/src/data/floodData.js`, `frontend/src/data/relocationData.js`, `frontend/index.html`, `frontend/src/App.jsx`, `frontend/src/pages/Overview.jsx`

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

* Build: `npm run build` in `frontend/` passes as of end of this batch (Batch 2 + Batch 3 dark-mode/map fixes)
* Tests: no automated test suite exists
* Lint/type-check: not run this session
* Browser: not manually verified in this sandbox (no headless browser available here) — user must verify locally after copying: check Relocation Sites map now shows more usable area, dark mode on Relocation Sites (limitations banner, flood-history box, pending-validation box, KPI cards, score bars) reads correctly, light mode and other pages unaffected
* API/data/GIS: not verified this session — flagged as open item (Batch 4, and the new full-repo audit request)

## Result Optimization Log

| Change | Reason | Before | After | Validation | Trade-off |
| ------ | ------ | ------ | ----- | ---------- | --------- |
| Severity/priority color values changed | Visual design only — hex values for EXPOSURE_CATEGORIES/PRIORITY_LEVELS were stock Tailwind colors | `#dc2626`/`#ea580c`/etc. | Custom palette (`#A62B26` etc.) | Visual only, no change to thresholds, scoring logic, or which category a value falls into | None — cosmetic only, underlying min/max score boundaries untouched |

No result-generating logic (scoring, thresholds, GIS calculations) has been touched yet. Everything above is UI/branding/repo-hygiene only.

## Critical Components Reviewed

* [x] Repo structure / hygiene
* [x] Branding consistency
* [x] Frontend visual design system (Tailwind config, colors, fonts)
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

* Current task: dark-mode completion + Relocation Sites map UX fix — done for stated scope, packaged for handoff
* Last action: Generated `navis-project-updated.zip` (all batches to date) and this progress file
* Next action: (1) User copies zip to local repo, commits, pushes. (2) User must browser-verify the checklist above (dark mode on Relocation Sites, map area size, light mode intact, no regressions on other pages) since this sandbox has no browser. (3) Ask user to choose Batch 3-proper direction (wire up backend vs. honest README) before starting it. (4) Remaining open work: typography rollout to 7 pages, layout restructuring decision, OR pivot to the deeper full-stack/GIS/ML audit from the user's master-prompt — clarify priority with user.
* Files/areas: see "Remaining" section above for the full list, organized by batch
* Commands (Windows/PowerShell, user's established working pattern):
  ```powershell
  robocopy "C:\path\to\extracted\NAVIS-project" "C:\Users\ASUS\Downloads\project\NAVIS-project" /MIR /XD .git
  cd "C:\Users\ASUS\Downloads\project\NAVIS-project"
  git status
  git add -A
  git commit -m "<batch description>"
  git push origin fix/hygiene-branding
  ```
* Verification: after copying, run `cd frontend; npm install; npm run dev` and manually check pages/dark-mode/chat assistant in browser before committing

## SESSION HANDOFF

NAVIS is a React/Vite frontend (deployed, static-data-driven) with non-functional Node/Python backend stubs (undeployed), for an SIH hackathon disaster-management tool now past an initial round, prepping for final selection. User (not very git-savvy, Windows/PowerShell only, limited turns per session) is working through a prioritized fix list across multiple sessions/accounts, staging all changes on their GitHub fork (`mit-006/NAVIS-project`, branch `fix/hygiene-branding`) without merging to the real team repo (`khushivadgama/...`) until a teammate does the final push at the end.

Batch 1 (repo hygiene, ResQMap→NAVIS rebrand) is fully done and already committed/pushed by the user. Batch 2 (custom design system: Tailwind theme, severity colors, brand re-skin, fonts) is partially done — verified building, but not yet copied/committed by the user, and several sub-items remain (typography on remaining pages, dark-mode cleanup, layout work). Batches 3-5 (backend honesty decision, flood-data discrepancy, misc polish) are not started.

The user just supplied a much more extensive "master prompt" (uploaded as a document this turn) asking for a full-stack/GIS/ML/security/DevOps audit of the ENTIRE project — not just UI/hygiene — including verification of stated validation metrics (precision 86.33%, recall 42.18%, F1 56.67%, 17,100-check leakage audit with zero violations), GIS/CRS correctness, result traceability, and production-readiness across backend, database (none exists), Python/GIS pipeline, Docker/CI (none exists), and testing (none exists). This is a significantly larger scope than what's been done so far and has NOT been started. The next session should clarify with the user whether to keep finishing the current UI/hygiene-focused batch plan first, or pivot to this deeper audit — and should adopt the user's requested formats going forward: maintain this exact `NAVIS_PROGRESS.md` file at project root (not the previous `NAVIS_FIX_TRACKER.md` format used in earlier sessions), and report each batch tersely using DONE / CHANGED / VERIFIED / BLOCKERS / NEXT headers with no extra narration, per the user's explicit instructions.
