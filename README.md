# NAVIS
### Natural Hazard Assessment & Vulnerability Intelligence System

**Live Demo:** [https://navisweb.vercel.app/]

**GitHub Repository:** https://github.com/khushivadgama/NAVIS---Natural-hazard-Assesment-Vulnerability-Intelligence-System

---

## Project Description

NAVIS is a GIS-based multi-hazard risk assessment and relocation decision-support platform designed to help disaster management authorities identify vulnerable habitations, analyze hazard exposure, prioritize high-risk areas, and evaluate suitable relocation options.

The platform integrates geospatial datasets, historical hazard information, population vulnerability, terrain characteristics, accessibility, and explainable weighted scoring to transform complex geographic data into actionable disaster-management insights.

NAVIS focuses on the complete decision-support workflow:

**Identify Risk → Assess Vulnerability → Prioritize Habitations → Evaluate Relocation Sites → Support Relocation Decisions**

---

## Key Features

- Multi-hazard risk assessment and visualization
- Historical flood exposure analysis
- Habitation-level risk and vulnerability analysis
- Population exposure assessment
- Risk-based habitation prioritization
- Explainable weighted scoring model
- Interactive GIS-based hazard maps
- Habitation explorer with detailed information
- Historical hazard analysis and visualization
- Relocation site identification
- Relocation site suitability assessment
- Elevation and slope-based site analysis
- Road accessibility analysis
- Alternative relocation site comparison
- Relocation route visualization
- Actionable decision-support for relocation planning
- Real-time flood situational awareness using official data sources
- Interactive charts and analytical dashboards
- Responsive desktop and mobile interface
- Emergency demonstration/simulation mode

---

## Technology Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Leaflet
- Leaflet
- Recharts
- React Router

### Backend

- Node.js
- Express.js

### Geospatial & Data Processing

- Python
- GeoPandas
- Shapely
- Rasterio
- PyProj
- Pandas
- NumPy

### GIS Analysis

- Spatial Intersection
- Spatial Overlay
- Buffer Analysis
- Proximity Analysis
- Elevation Analysis
- Slope Analysis
- Historical Flood Exposure Analysis
- Population Exposure Analysis

---

## Decision Model

NAVIS uses an explainable mathematical weighted scoring approach for risk prioritization.

### Flood Priority Score

The current flood-priority model considers:

- Maximum Exposure — 40%
- Flood Frequency — 30%
- Population Exposure — 30%

### Relocation Suitability

Potential relocation sites are evaluated using factors including:

- Elevation
- Slope
- Road Accessibility
- Available Amenities
- Vulnerable Population Proximity

The scoring approach is designed to remain transparent and interpretable rather than relying on a black-box decision model.

---

## Data Sources

NAVIS integrates and processes data from multiple geospatial and government-linked sources, including:

- Census India 2011
- AIKOSH
- NDEM / NRSC / ISRO
- SRTM Digital Elevation Model
- OpenStreetMap
- National Water Data Portal (NWIC)
- Central Water Commission (CWC)
- Assam State Disaster Management Authority (ASDMA)

---

## Study Area

The current implementation focuses on:

**Kamrup Metropolitan District, Assam, India**

The validated habitation dataset contains:

**228 habitations**

Historical flood exposure analysis currently covers:

- 1998
- 1999
- 2004
- 2012
- 2013

Current processed results include:

- Total Habitations: 228
- Exposed Habitations: 152
- Historical Exposure: 66.7%
- Relocation Candidates: 76

### Historical Flood Exposure

| Year | Exposed Habitations |
|------|---------------------|
| 1998 | 129 |
| 1999 | 131 |
| 2004 | 125 |
| 2012 | 102 |
| 2013 | 82 |

---

## System Workflow

```text
Multi-Source Data
        ↓
Data Processing & Validation
        ↓
GIS Spatial Analysis
        ↓
Hazard & Exposure Assessment
        ↓
Population & Vulnerability Analysis
        ↓
Weighted Risk Scoring
        ↓
Habitation Prioritization
        ↓
Relocation Suitability Analysis
        ↓
Actionable Decision Support
        ↓
Interactive GIS Dashboard

##Project Structure
NAVIS/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── ...
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── config/
│   │   └── index.js
│   └── package.json
│
├── python-engine/
│   └── phase3_candidate_analysis.py
│
├── data/
│   ├── raw/
│   └── processed/
│
└── README.md

## Actionable Decision Support

NAVIS connects hazard and vulnerability assessment with relocation planning to support practical disaster-management decisions.

For a selected habitation, the platform provides:

- Assessed hazard exposure
- Historical risk information
- Vulnerability indicators
- Risk priority level
- Recommended action
- Suitable relocation site
- Alternative relocation sites
- Accessibility information
- Route visualization where reliable routing data is available

The recommendations are generated using available datasets and analytical models. They are intended to support, not replace, decisions made by authorized disaster-management authorities.

---

## Real-Time Flood Situational Awareness

NAVIS supports the integration of official real-time environmental information to provide current flood-related situational awareness.

The system can display:

- River water level
- River-level trend
- Recent rainfall
- Current monitoring status
- Last updated time
- Data source

Real-time information is provided for situational awareness only and does not represent a guaranteed prediction of future flooding.

---

## GIS Capabilities

NAVIS uses geospatial analysis to transform raw geographic datasets into habitation-level insights.

Key GIS capabilities include:

- Spatial intersection and overlay
- Buffer and proximity analysis
- Terrain analysis
- Elevation extraction
- Slope analysis
- Historical hazard exposure analysis
- Population exposure analysis
- Relocation site suitability analysis

---

## Validation

The current application has been tested across multiple screen sizes to verify responsiveness and interface stability.

### Tested Viewports

- 1440 × 900
- 768 × 1024
- 390 × 844
- 360 × 800

### Validation Results

- **28 / 28** browser checks passed
- **0** horizontal overflow issues
- **0** console errors
- Production build passed

---

## Project Status

**Status:** Active Development

**Platform:** Web-based GIS Decision Support System

**Study Area:** Kamrup Metropolitan, Assam, India

**Focus:** Multi-Hazard Risk Assessment and Relocation Decision Support

---

## Disclaimer

NAVIS is developed for research, educational, demonstration, and decision-support purposes.

The information and recommendations generated by the platform are based on available datasets, analytical models, and predefined criteria.

NAVIS does not provide official evacuation orders, emergency warnings, or guaranteed predictions of future natural disasters.

Final decisions regarding evacuation, relocation, or emergency response should be made by authorized disaster-management authorities using verified real-time information and appropriate field-level assessment. evacuation, relocation, or emergency response must be taken by authorized disaster-management authorities using verified real-time information and appropriate field-level assessment.

