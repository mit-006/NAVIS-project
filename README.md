# NAVIS - A GIS based Disaster Management Decision Support Platform

**[Live Demo] : [https://navisweb.vercel.app/]**

## Project Purpose

NAVIS is an intelligent GIS-based disaster-management decision-support platform designed to:

- Identify hazard-based Red Zones using explainable mathematical weighted-risk models
- Assess relocation-site carrying capacity
- Prioritize vulnerable habitations for relocation
- Recommend safer evacuation routes

This repository contains the **prototype** for a selected high-risk pilot region. The architecture is designed to scale to multiple districts/states later.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│  Python Engine  │
│  (React/Vite)   │     │  (Node/Express) │     │  (FastAPI/GIS)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                        │
                              ▼                        ▼
                        ┌───────────┐           ┌───────────┐
                        │  MongoDB  │           │   Data    │
                        └───────────┘           └───────────┘
```

### Data Flow

1. **Frontend** sends user requests and displays results
2. **Backend** orchestrates data flow, handles API requests
3. **Python Engine** performs GIS processing and risk calculations
4. **MongoDB** stores processed data, configurations, and results
5. **Data Directory** holds static and sample datasets

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18, Vite, Tailwind CSS | UI framework and styling |
| Maps | Leaflet, React-Leaflet | Interactive GIS mapping |
| Backend | Node.js, Express.js | API server, orchestration |
| Risk Engine | Python, FastAPI | GIS processing, risk calculation |
| GIS Libraries | GeoPandas, Shapely, Rasterio | Spatial data processing |
| Database | MongoDB | Data storage |
| Routing | OSRM | Evacuation route generation |
| Base Maps | OpenStreetMap | Reference mapping |

## Project Structure

```
resqmap/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client services
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── public/             # Static assets
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite configuration
│
├── backend/                # Node.js API server
│   ├── src/
│   │   ├── routes/         # Express route handlers
│   │   ├── controllers/    # Business logic
│   │   ├── services/       # External service integrations
│   │   ├── config/         # Configuration management
│   │   └── index.js        # Server entry point
│   └── package.json        # Backend dependencies
│
├── python-engine/          # Python GIS/Risk engine
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py         # FastAPI application
│   │   └── config.py       # Configuration
│   ├── data/               # Engine-specific data
│   └── requirements.txt    # Python dependencies
│
├── data/                   # Shared data directory
│   ├── raw/                # Raw, unprocessed source datasets
│   ├── sample/             # Sample/mock data
│   └── templates/          # Data templates
│
├── docs/                   # Documentation
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## Core Modules (Planned)

1. **Data Ingestion & Preprocessing** - Load and validate input data
2. **Hazard/Risk Assessment** - Analyze hazard layers
3. **Mathematical Risk Engine** - Weighted risk calculation (explainable, not ML)
4. **GIS Red-Zone Mapping** - Visualize high-risk areas
5. **Vulnerable Habitation Analysis** - Identify at-risk communities
6. **Relocation Priority Classification** - Rank relocation needs
7. **Relocation-Site Assessment** - Evaluate safe locations
8. **Carrying-Capacity Assessment** - Determine site capacity
9. **Safe-Route Generation** - Calculate evacuation paths
10. **Government/Admin Dashboard** - Decision-support interface

## Data Sources

### Ingested Datasets

| Dataset | Region | Status | Location |
|---------|--------|--------|----------|
| Census 2011 PCA-TV | Kamrup Metropolitan, Assam | Raw / Unprocessed | `data/raw/kamrup_metropolitan_pca_tv_2011.xlsx` |
| NWIC Village Boundaries | Assam | Raw / Incompatible codes | `data/raw/nwic_assam_village_boundary/` |
| Village Code Reference | All India | Verified | `data/raw/assam_village_codes.csv` |

### Pending Downloads

| Dataset | Region | Status | Download Source |
|---------|--------|--------|-----------------|
| PC11 Village Polygons (SHRUG) | All India | **Awaiting manual download** | [AIKOSH](https://aikosh.indiaai.gov.in/home/datasets/details/2011_population_census_village_level_geometries.html) or [DDL](https://www.devdatalab.org/shrug_download) |

**Census 2011 PCA-TV Details:**
- **Full Name**: Primary Census Abstract at Town, Village and Ward Level (PCA-TV)
- **Source**: Office of the Registrar General & Census Commissioner, India
- **Data Type**: Demographic / Population
- **Purpose**: Baseline population and habitation data for vulnerability assessment
- **Note**: This dataset does not contain GIS geometry (latitude/longitude). Spatial data must be obtained from separate Census shapefiles or Survey of India sources.
- **Village codes**: 6-digit codes (e.g., 303398) — verified to match across sources

**PC11 Village Polygons (SHRUG/AIKOSH) Details:**
- **Full Name**: 2011 Population Census Village-Level Geometries
- **Source**: Development Data Lab (SHRUG) via AIKOSH platform
- **Data Type**: GIS Polygon Geometry
- **Purpose**: Village boundary polygons for mapping Census data
- **License**: CC BY-NC-SA 4.0 (non-commercial use only)
- **Village ID field**: `pc11_tv_id` — matches Census `Town/Village` codes
- **Download instructions**: See `docs/data-requirements/aikosh_census_geometry_verification.md`
- **Inspection script**: `python-engine/scripts/inspect_aikosh_geometry.py`

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- MongoDB (local or Atlas)
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd resqmap

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Install Python dependencies
cd ../python-engine
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

### Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI

# Python Engine
cp python-engine/.env.example python-engine/.env
```

### Running the Services

Open three terminals and run:

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3 - Python Engine:**
```bash
cd python-engine
# Activate virtual environment first
uvicorn app.main:app --reload --port 8000
# Runs on http://localhost:8000
# API docs at http://localhost:8000/docs
```

## API Endpoints

### Backend (Port 3000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| GET | /api/risk/:regionId | Get risk assessment |
| GET | /api/redzones | Get red zones data |
| GET | /api/relocationsites | Get relocation sites |

### Python Engine (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /docs | API documentation |

## Development Guidelines

### Code Principles

- **Modular Design**: Each service is independently maintainable
- **Explainable Models**: Risk calculations use transparent mathematical models
- **No Fake Data**: Never claim data is real unless verified
- **No Hardcoded Thresholds**: All hazard parameters are configurable
- **No ML at This Stage**: Focus on mathematical weighted-risk models

### Data Handling

- **Static Data**: Elevation, slope, population, historical disasters, infrastructure
- **Dynamic Data**: Weather/rainfall, river levels (auto-fetched via APIs in future)
- **Mock Data**: Use sample data for development, clearly labeled

## Next Steps (Planned)

1. Implement MongoDB connection and data models
2. Build data ingestion pipeline for sample datasets
3. Create risk calculation endpoints in Python engine
4. Implement Red-Zone visualization layer
5. Add habitation analysis and vulnerability scoring
6. Build relocation site assessment
7. Implement OSRM-based route generation
8. Complete dashboard with all layers and controls


