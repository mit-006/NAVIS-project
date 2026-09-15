# NAVIS

### Natural Hazard Assessment & Vulnerability Intelligence System

**Live Demo:** https://navisweb.vercel.app/

**GitHub Repository:** https://github.com/mit-006/NAVIS-project

---

## Project Description

NAVIS is an **explainable GIS-based flood disaster decision-support platform** designed to help disaster-management authorities identify historically exposed habitations, assess population exposure, prioritize vulnerable areas, and evaluate preliminary relocation candidates.

The platform combines historical flood inundation data, Census population and infrastructure information, habitation geometries, terrain characteristics, road accessibility, live weather, and official alert information to transform geographic data into interpretable disaster-management insights.

NAVIS focuses on the following decision-support workflow:

**Identify Exposure → Assess Vulnerability → Prioritize Habitations → Evaluate Relocation Candidates → Support Disaster-Management Decisions**

> **Current scope:** The active hazard-analysis workflow is primarily focused on historical flood exposure and flood-related situational awareness for Kamrup Metropolitan, Assam.

---

## Key Features

* Historical flood exposure analysis
* Habitation-level flood exposure assessment
* Estimated population exposure
* Historical flood-frequency analysis
* Explainable habitation priority scoring
* Interactive GIS-based flood maps
* Habitation explorer with detailed information
* Historical analysis and visualization
* Risk-priority analysis
* Preliminary relocation candidate identification
* Relocation suitability assessment
* Elevation-based site analysis
* Slope-based site analysis
* Road accessibility analysis
* Census-based amenity analysis
* Vulnerable-population proximity analysis
* Alternative relocation candidate comparison
* Live weather information
* GloFAS-derived flood situational awareness
* IMD CAP alert integration
* Action-level decision-support indicators
* What-If scenario analysis
* Deterministic domain-specific NAVIS Assistant
* Emergency demonstration/simulation mode
* Interactive charts and analytical dashboards
* Responsive web interface

---

## Important Scope and Implementation Note

NAVIS is currently a **decision-support MVP**.

The current production deployment is primarily **frontend and precomputed-data driven**.

The main GIS computations are performed offline through a Python/GeoPandas processing workflow. The verified results are stored in GeoJSON files and loaded by the React frontend.

The repository also contains Node.js/Express and Python/FastAPI backend layers. These currently serve as **scaffolded API infrastructure and are not deployed as the production computation layer**.

Therefore, the current architecture should not be interpreted as a fully live three-tier backend-driven system.

---

# Technology Stack

## Frontend

* React 18
* Vite
* Tailwind CSS
* Leaflet
* React-Leaflet
* Recharts
* React Router DOM
* HashRouter
* Playwright for browser/QA tooling

The frontend uses plain React state and context where required. No Redux, Zustand, or external UI component library is required by the current implementation.

---

## Backend

### Node.js / Express

The repository contains a Node.js/Express backend with:

* Express
* CORS
* dotenv
* Mongoose
* Axios
* Nodemon for development

Current API routes include:

```text
/api/health
/api/risk/:regionId
/api/redzones
/api/relocationsites
```

The risk, redzone, and relocation API endpoints currently return `501 Not Implemented` rather than pretending to provide a live backend implementation.

MongoDB/Mongoose infrastructure is scaffolded, but there is currently **no active production MongoDB database connection powering the application**.

---

## Python / GIS Processing

The Python processing layer contains:

* Python
* GeoPandas
* Shapely
* Rasterio
* PyProj
* Pandas
* NumPy
* FastAPI
* Uvicorn
* Pydantic

The Python GIS pipeline is the computational core used for offline data preparation and analysis.

---

# GIS Analysis Capabilities

NAVIS uses geospatial processing to convert raw geographic datasets into habitation-level disaster insights.

Key operations include:

* Spatial intersection
* Spatial overlay
* Buffer analysis
* Proximity analysis
* Nearest-feature analysis
* Reprojection
* Area calculation
* Distance calculation
* Elevation extraction
* Slope calculation
* Historical flood exposure analysis
* Population exposure estimation
* Relocation suitability analysis
* Point-in-polygon flood exclusion

For spatial area and distance calculations, geometries are processed in an appropriate projected CRS rather than directly calculating metric quantities from latitude/longitude degrees.

The current flood-exposure workflow uses **EPSG:32646 (UTM Zone 46N)** for metric spatial calculations.

---

# Decision Model

NAVIS uses an **explainable deterministic weighted scoring model**.

The current risk-priority model is not a trained machine-learning model.

The scoring methodology is intentionally transparent so that a priority result can be traced back to measurable inputs and explicit weights.

---

## Flood Priority Score

The current habitation priority score uses three factors:

| Factor                        | Weight |
| ----------------------------- | -----: |
| Maximum Historical Exposure   |    40% |
| Flood Frequency               |    30% |
| Estimated Population Exposure |    30% |

### Formula

```text
Priority Score
=
(Max Historical Exposure × 0.40)
+
(Flood Frequency % × 0.30)
+
(Population Exposure % × 0.30)
```

### Priority Classification

```text
Score ≥ 70  → Critical
Score ≥ 50  → High
Score ≥ 30  → Medium
Score < 30   → Low
```

These weights and thresholds are **NAVIS analytical assumptions**, not official government risk-classification standards.

---

# Flood Exposure Calculation

Historical flood exposure is calculated spatially by intersecting habitation polygons with historical flood-inundation polygons.

### Formula

```text
Flood Exposure %
=
(Flooded Area / Total Habitation Area) × 100
```

For example:

```text
Habitation Area = 100 hectares
Flooded Area    = 30 hectares

Flood Exposure = 30%
```

---

## Estimated Population Exposure

The platform estimates population exposure from the spatial flood-exposure percentage.

### Formula

```text
Estimated Exposed Population
=
Population × (Flood Exposure % / 100)
```

This is a **spatial estimate**.

It should not be interpreted as a confirmed count of people who were physically affected during a flood event.

---

## Historical Flood Frequency

The current analysis covers five documented historical flood years:

* 1998
* 1999
* 2004
* 2012
* 2013

### Formula

```text
Flood Frequency
=
Number of Exposed Analysed Years / 5
```

For example:

```text
3 exposed years / 5 analysed years
=
0.60
=
60%
```

> NAVIS currently analyses five selected historical flood years spanning 1998–2013. It does not represent 15 consecutive annual observations.

---

# Relocation Candidate Analysis

NAVIS currently contains:

### 76 preliminary relocation candidates

The candidates are derived from habitation areas that were historically not exposed in the analysed flood years and have valid elevation information.

The candidates are intended for **preliminary suitability assessment**.

They are **not** automatically:

* Vacant land
* Government-owned land
* Legally available land
* Approved relocation land
* Guaranteed flood-safe land

Final relocation decisions require legal, land-use, planning, ownership, field, and engineering verification.

---

# Relocation Suitability Score

Potential relocation candidates are evaluated using five analytical factors.

| Factor                          | Maximum Points |
| ------------------------------- | -------------: |
| Elevation                       |             25 |
| Slope                           |             15 |
| Road Accessibility              |             20 |
| Amenities                       |             25 |
| Vulnerable-Population Proximity |             15 |
| **Total**                       |        **100** |

These weights are **NAVIS analytical assumptions**, not official government relocation standards.

---

## Elevation Score

Maximum:

**25 points**

```text
Elevation Score
=
min(Elevation / 300, 1) × 25
```

Examples:

```text
0 m       → 0 points
150 m     → 12.5 points
300 m+    → 25 points
```

---

## Slope Score

Maximum:

**15 points**

```text
Slope Score
=
max(0, 1 - Slope / 30) × 15
```

Examples:

```text
0°        → 15 points
15°       → 7.5 points
30°+      → 0 points
```

---

## Road Accessibility Score

Maximum:

**20 points**

Closer access to major roads receives a higher score.

```text
Road Score
=
max(0, 1 - Distance to Major Road / 10) × 20
```

Conceptually:

```text
0 km      → 20 points
10 km+    → 0 points
```

Metric distance calculations use a projected CRS rather than latitude/longitude degrees.

---

## Amenities Score

Maximum:

**25 points**

Census infrastructure indicators include categories such as:

### Education

* Primary school
* Middle school
* Secondary school

### Health

* CHC
* PHC
* Sub-centre
* Hospital

### Water

* Hand pump
* Tube/bore well
* Tap water

### Transport

* Bus service
* Railway station

### Banking

* Bank
* ATM

### Communication

* Telephone
* Mobile communication

---

## Vulnerable-Population Proximity

The relocation workflow evaluates proximity to exposed habitations and vulnerable population within a surrounding context.

The purpose is to identify candidate locations that may be practically useful for populations requiring relocation.

---

# Relocation Capacity Limitation

NAVIS does **not currently calculate actual carrying capacity** for relocation candidates.

The current dataset may contain capacity-related fields with null values because reliable capacity calculation requires additional information such as:

* Actual available land area
* Land-use/LULC classification
* Ownership and legal status
* Planning and zoning restrictions
* Population-density assumptions
* Site-development constraints
* Ground verification

Therefore, relocation candidates should not be interpreted as sites with confirmed accommodation capacity.

---

# Historical Flood Data

The current validated study area contains:

### 228 habitations

Historical flood analysis covers:

| Year | Exposed Habitations |
| ---- | ------------------: |
| 1998 |                 129 |
| 1999 |                 131 |
| 2004 |                 125 |
| 2012 |                 102 |
| 2013 |                  82 |

Across the five analysed years:

* **Total habitations:** 228
* **Ever exposed:** 152
* **Never exposed:** 76
* **Total population represented:** 725,375
* **Preliminary relocation candidates:** 76

The 152 ever-exposed habitations represent approximately **66.7%** of the 228 habitation dataset.

---

# Data Sources

NAVIS uses multiple government-linked and open geospatial datasets during its offline processing workflow.

| Dataset                     | Source                                                       | Purpose                                 |
| --------------------------- | ------------------------------------------------------------ | --------------------------------------- |
| Village/Habitation Geometry | AIKOSH / Development Data Lab / SHRUG-linked Census geometry | Habitation boundaries                   |
| Historical Flood Inundation | NDEM / NRSC / ISRO workflow                                  | Historical flood extents                |
| Population & Demographics   | Census 2011                                                  | Population and vulnerability indicators |
| Village Infrastructure      | Census 2011                                                  | Amenities and infrastructure            |
| Elevation                   | SRTM 30m DEM                                                 | Elevation analysis                      |
| Slope                       | SRTM 30m DEM                                                 | Terrain suitability                     |
| Roads                       | OpenStreetMap / Overpass                                     | Road accessibility                      |
| Live Weather                | Open-Meteo                                                   | Current weather                         |
| Flood Situational Awareness | GloFAS-derived data through Open-Meteo Flood API             | Simulated river-discharge awareness     |
| Official Alerts             | IMD CAP                                                      | Weather/disaster alert information      |
| Map Basemap                 | OpenStreetMap                                                | Interactive map basemap                 |

### Important source distinction

NWIC, CWC, and ASDMA may be referenced in broader project/research documentation, but they are **not active browser-runtime APIs in the current frontend implementation**.

---

# Processed GIS Data

The primary precomputed datasets loaded by the frontend are:

```text
frontend/
└── public/
    └── data/
        ├── kamrup_metro_flood_exposure.geojson
        └── preliminary_relocation_candidates.geojson
```

### `kamrup_metro_flood_exposure.geojson`

Contains the processed habitation-level flood exposure dataset.

It includes the spatial habitation features and calculated historical exposure attributes used by the frontend.

### `preliminary_relocation_candidates.geojson`

Contains the processed preliminary relocation candidate polygons and associated suitability information.

These GeoJSON files are generated from offline processing of the underlying datasets.

---

# Live Environmental Information

## Open-Meteo Weather

NAVIS retrieves current weather information from Open-Meteo.

The current workflow uses weather information such as:

* Temperature
* Relative humidity
* Precipitation
* Rain
* WMO weather code
* Wind speed
* Wind direction

Weather information is refreshed approximately every five minutes.

The weather interpretation shown by NAVIS uses application-level heuristics and should not be confused with official IMD warning categories.

---

# GloFAS Flood Situational Awareness

NAVIS uses **GloFAS-derived simulated river discharge through the Open-Meteo Flood API** for flood-related situational awareness.

This is **not a direct physical river-gauge water-level feed**.

NAVIS compares recent discharge conditions against a recent 14-day mean and applies application-level thresholds:

```text
Ratio ≥ 2.0  → Danger
Ratio ≥ 1.5  → Alert
Ratio ≥ 1.2  → Watch
Otherwise    → Normal
```

These thresholds are NAVIS heuristics and are not official river-stage thresholds.

---

# IMD CAP Alerts

NAVIS integrates India Meteorological Department alert information through the CAP/RSS mechanism.

The alert workflow:

```text
IMD CAP/RSS
      ↓
CAP XML
      ↓
Assam / Kamrup / Guwahati Relevance
      ↓
Severity + Urgency
      ↓
NAVIS Alert Interpretation
```

The application assigns internal numerical values to severity and urgency for prioritization.

These values represent **NAVIS application logic**, not an official IMD numerical risk score.

---

# Action-Level Decision Support

NAVIS combines current environmental information with historical habitation risk to generate an action-level indicator.

Inputs include:

* Weather score
* Alert score
* Historical priority score
* Historical risk information

The current action levels are:

```text
≥70       → IMMEDIATE ATTENTION
45–69     → PREPARE
20–44     → MONITOR
<20       → NORMAL
```

These are **decision-support indicators**, not official emergency directives.

---

# NAVIS Assistant

NAVIS includes a deterministic, domain-specific assistant.

The current assistant uses:

* Keyword/intent matching
* Input normalization
* NAVIS dataset lookup
* Direct calculations

The current implementation does **not** demonstrate:

* OpenAI API
* Gemini API
* Claude API
* LangChain
* Retrieval-Augmented Generation (RAG)
* Vector database

Therefore, the current assistant should be described as a **deterministic domain-specific assistant**, not a generative AI chatbot.

---

# What-If Simulator

The What-If simulator allows scenario assumptions to be modified and the deterministic priority logic to be recalculated.

It is intended for:

* Scenario comparison
* Sensitivity exploration
* Decision-support experimentation

It is **not a machine-learning prediction engine**.

---

# Emergency Demonstration Mode

NAVIS includes an emergency demonstration/simulation workflow.

The current demo scenario contains predefined:

* Affected habitations
* Candidate sites
* Distances
* Travel times
* Route visualizations

The routes are **predefined demonstration routes**.

The current implementation does not integrate:

* OSRM
* Google Directions
* Mapbox Directions
* GraphHopper
* OpenRouteService

Therefore, the emergency mode should not be interpreted as a live emergency dispatch or dynamically calculated shortest-path routing system.

---

# Frontend Pages

The current application provides the following major pages:

| Route          | Purpose                                                          |
| -------------- | ---------------------------------------------------------------- |
| `/`            | Overview, system summary, analytics and evidence                 |
| `/map`         | Interactive flood map, layers, alerts, weather and demo workflow |
| `/historical`  | Historical flood exposure analysis                               |
| `/explorer`    | Habitation search, filtering and detailed information            |
| `/priority`    | Priority ranking and score distribution                          |
| `/relocation`  | Preliminary relocation candidates and suitability analysis       |
| `/methodology` | Methodology, formulas, sources, limitations and disclaimers      |

The application uses **HashRouter**, which is suitable for static/Vercel hosting because client-side routes do not require server-side rewrite configuration.

---

# System Architecture

The current verified architecture is:

```text
                    OFFLINE DATA PREPARATION
                    ========================

NDEM Flood Data ──────────┐
Census Data ──────────────┤
AIKOSH Geometry ──────────┤
SRTM DEM ─────────────────┤
OSM Road Data ────────────┤
                           ↓
                    Python GIS Engine
                GeoPandas / Shapely
                Rasterio / NumPy
                           ↓
                  Processed GeoJSON
                    ┌──────────────┐
                    │              │
                    ↓              ↓
       kamrup_metro_flood_   preliminary_relocation_
       exposure.geojson      candidates.geojson
                    │              │
                    └──────┬───────┘
                           ↓
                    React Frontend
                           ↓
                         Vercel


                    LIVE DATA SOURCES
                    =================

Open-Meteo Weather ────────→ React Frontend
GloFAS/Open-Meteo ─────────→ React Frontend
IMD CAP Alerts ────────────→ React Frontend
OpenStreetMap Tiles ───────→ React Frontend


                    BACKEND SCAFFOLDING
                    ===================

Node.js + Express ─────────→ Not deployed
Python + FastAPI ──────────→ Not deployed
MongoDB/Mongoose ──────────→ Not active in production
```

### Architecture principle

The current production MVP intentionally serves verified precomputed GIS results through the frontend rather than pretending that an undeployed backend is performing live risk computation.

---

# Project Structure

The repository contains the frontend, backend, Python processing workflow, data-preparation utilities, and documentation.

A simplified structure is:

```text
NAVIS/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── data/
│   │   ├── contexts/
│   │   ├── App.jsx
│   │   └── ...
│   │
│   ├── public/
│   │   └── data/
│   │       ├── kamrup_metro_flood_exposure.geojson
│   │       └── preliminary_relocation_candidates.geojson
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   └── index.js
│   │
│   └── package.json
│
├── python-engine/
│   ├── phase3_candidate_analysis.py
│   ├── calculate_flood_exposure.py
│   └── ...
│
├── tools/
│   └── data-prep/
│
├── data/
│   ├── raw/
│   └── processed/
│
└── README.md
```

The exact repository structure may evolve as development continues; the architecture above reflects the current implementation and processing workflow.

---

# Actionable Decision Support

NAVIS connects historical flood exposure, vulnerability indicators and relocation suitability into a single decision-support workflow.

For a selected habitation, the platform can provide:

* Historical flood exposure
* Flood-frequency information
* Estimated population exposure
* Priority score
* Priority classification
* Environmental situational awareness
* Recommended action level
* Preliminary relocation candidates
* Relocation suitability information
* Accessibility information
* Demonstration route information where available

The recommendations are generated from available datasets and predefined analytical models.

They are intended to **support**, not replace, decisions made by authorized disaster-management authorities.

---

# Validation

The current application has undergone development-stage build and behavior verification.

### Current validation includes

* Production frontend build verification
* Major route behavior checks
* Demo alert behavior
* Emergency simulation behavior
* Relocation marker behavior
* GeoJSON data loading
* Development-stage responsive checks

The project has recorded viewport testing across:

```text
320 px
375 px
390 px
430 px
768 px
1440 px
```

The tested frontend build has successfully completed the production build process.

Final manual browser validation across all pages, device sizes, dark mode, and the complete emergency demonstration flow should be performed before the final SIH presentation.

---

# Current Project Status

**Status:** SIH Demonstration MVP / Active Refinement

**Platform:** Web-based GIS Decision-Support System

**Study Area:** Kamrup Metropolitan District, Assam, India

**Primary Hazard Focus:** Historical Flood Exposure and Flood-Related Situational Awareness

**Habitation Dataset:** 228

**Ever Exposed:** 152

**Never Exposed:** 76

**Preliminary Relocation Candidates:** 76

**Historical Flood Years:** 1998, 1999, 2004, 2012, 2013

---

# Known Limitations

The following limitations are part of the current implementation and should be considered when interpreting results:

1. The active hazard-analysis workflow is primarily flood-focused.
2. Historical flood analysis covers five selected years rather than continuous annual observations from 1998–2013.
3. Population exposure is a spatial estimate and not a confirmed count of affected individuals.
4. The current priority model is deterministic weighted scoring, not machine learning.
5. The scoring weights are NAVIS analytical assumptions and are not official government weights.
6. Relocation candidates are preliminary and require land-use, ownership, zoning, legal, engineering and field validation.
7. Relocation candidates are not certified as guaranteed-safe land.
8. Actual relocation carrying capacity is not currently calculated.
9. Reliable land availability and ownership verification are not currently part of the relocation workflow.
10. Water-body exclusion is not currently implemented as an authoritative candidate-generation layer.
11. Emergency routes are predefined demonstration routes rather than dynamically calculated shortest routes.
12. GloFAS-derived discharge is not equivalent to direct physical river-gauge water-level measurements.
13. NAVIS weather severity labels are application-level heuristics and are not official IMD warning categories.
14. The current Node.js/Express and Python/FastAPI APIs are scaffolded and are not the active production computation layer.
15. MongoDB/Mongoose is not currently used as an active production database.
16. The current deterministic assistant is not a generative AI/LLM system.
17. Final browser-level responsive and end-to-end demonstration validation should be completed before final presentation.
18. Relocation score explanations should use exactly the same normalization logic as the generated relocation score.

---

# Important Analytical Transparency

NAVIS deliberately separates **implemented functionality**, **analytical assumptions**, and **future enhancements**.

### Implemented

* Historical flood GIS analysis
* Habitation-level exposure
* Population exposure estimation
* Deterministic priority scoring
* Preliminary relocation scoring
* Terrain analysis
* Road accessibility
* Census amenity integration
* Interactive GIS visualization
* Live weather
* GloFAS-derived situational awareness
* IMD CAP alert integration
* Scenario analysis
* Emergency demonstration workflow

### Not currently implemented as production functionality

* Trained ML risk model
* Live backend risk computation
* Active MongoDB risk database
* Dynamic shortest-path emergency routing
* Verified relocation land ownership
* Actual relocation carrying-capacity calculation
* Guaranteed-safe relocation certification
* Continuous annual flood forecasting

This distinction is intentional so that the platform's capabilities remain technically auditable and defensible.

---

# What NAVIS Does Not Claim

NAVIS does **not** claim to provide:

* Official government risk classifications
* Official evacuation orders
* Guaranteed future flood predictions
* Machine-learning prediction in the current MVP
* Guaranteed-safe relocation sites
* Government ownership or legal availability of candidate land
* Confirmed relocation carrying capacity
* Live emergency dispatch
* Dynamically optimal emergency routes
* Direct physical river-gauge measurements
* Confirmed counts of people actually affected by historical floods

NAVIS is a **decision-support system**, not a replacement for official disaster-management authorities, emergency services, field verification, or government decision-making.

---

# Future Enhancement Opportunities

Potential future development areas include:

* Live backend GIS computation
* Production API integration
* Database-backed spatial data management
* Authoritative water-body/LULC integration
* Land ownership and zoning verification
* Relocation carrying-capacity estimation
* Dynamic routing integration
* Additional hazard layers
* More extensive historical datasets
* Validated machine-learning models when suitable labelled data becomes available
* Automated model evaluation and validation
* Advanced field-verification workflows

Any future ML implementation should be supported by appropriate labelled historical outcomes, independent validation, leakage controls, and reproducible evaluation.

---

# Disclaimer

NAVIS is developed for research, educational, demonstration, and disaster-management decision-support purposes.

The information and recommendations generated by the platform are based on available datasets, predefined analytical criteria, and deterministic scoring methods.

Historical exposure and estimated population exposure should not be interpreted as confirmed real-world impact measurements.

Relocation candidates are preliminary analytical candidates and are not certified as legally available, government-owned, vacant, or guaranteed-safe land.

Live weather and alert information is provided for situational awareness and should be interpreted alongside official sources and field information.

NAVIS does not provide official evacuation orders, emergency warnings, guaranteed future-disaster predictions, or live emergency dispatch.

Final decisions regarding evacuation, relocation, emergency response, land allocation, and disaster management should be made by authorized authorities using verified information, applicable regulations, and appropriate field-level assessment.

---

# One-Line Project Definition

> **NAVIS is an explainable GIS-based disaster decision-support platform that combines historical flood exposure, population, terrain, infrastructure, and live environmental awareness to prioritize vulnerable habitations and evaluate preliminary relocation candidates.**
