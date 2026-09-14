from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from .config import PYTHON_ENGINE_PORT

app = FastAPI(
    title="NAVIS Risk Engine",
    description="Python-based GIS and risk assessment engine for NAVIS",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "navis-python-engine",
        "timestamp": datetime.now().isoformat(),
        "version": "0.1.0"
    }

@app.get("/")
async def root():
    return {
        "message": "NAVIS Risk Engine API",
        "docs": "/docs",
        "health": "/health"
    }
