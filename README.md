# NAVIS
### Natural Hazard Assessment & Vulnerability Intelligence System

**[Live Demo] [https://navisweb.vercel.app/]

NAVIS is a GIS-based multi-hazard risk assessment and relocation decision-support platform designed to help disaster management authorities identify vulnerable habitations, analyze hazard exposure, prioritize high-risk areas, and evaluate suitable relocation sites.

The platform combines geospatial data processing, historical hazard analysis, population vulnerability assessment, terrain analysis, accessibility analysis, and explainable weighted scoring to transform complex geographic data into actionable disaster-management insights.

## Features

- Multi-hazard risk assessment and visualization
- Historical flood exposure analysis
- Habitation-level vulnerability assessment
- Population exposure analysis
- Risk-based habitation prioritization
- Explainable weighted scoring model
- Interactive GIS-based hazard maps
- Habitation explorer with detailed risk information
- Relocation site identification and suitability analysis
- Comparison of alternative relocation sites
- Elevation and slope-based site assessment
- Road accessibility analysis
- Relocation route visualization
- Actionable decision support for relocation planning
- Real-time flood situational awareness using official data sources
- Interactive charts and analytical dashboards
- Responsive interface for desktop and mobile devices
- Emergency demonstration/simulation mode for presentations

## Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Leaflet
- Leaflet
- Recharts
- React Router

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

## Decision Model

NAVIS uses an explainable mathematical weighted scoring approach for prioritizing vulnerable habitations.

### Flood Priority Score

- Maximum Exposure: 40%
- Flood Frequency: 30%
- Population Exposure: 30%

### Relocation Suitability

Potential relocation sites are evaluated using factors such as:

- Elevation
- Slope
- Road Accessibility
- Available Amenities
- Proximity to Vulnerable Population

## Data Sources

- Census India 2011
- AIKOSH
- NDEM / NRSC / ISRO
- SRTM DEM
- OpenStreetMap
- National Water Data Portal (NWIC)
- Central Water Commission (CWC)
- Assam State Disaster Management Authority (ASDMA)

## Study Area

Current implementation focuses on **Kamrup Metropolitan District, Assam, India**.

The current processed dataset contains **228 validated habitations**, with historical flood exposure analysis covering:

- 1998
- 1999
- 2004
- 2012
- 2013

## Core Workflow

```text
Data Sources
     ↓
Data Processing & Validation
     ↓
GIS Spatial Analysis
     ↓
Hazard & Exposure Assessment
     ↓
Vulnerability Analysis
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

##Project Status

Active Development
