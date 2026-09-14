from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS

app = FastAPI(
    title='NAVIS Risk Engine',
    description='Python-based GIS and risk assessment engine for NAVIS',
    version='0.1.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=['GET'],
    allow_headers=['Content-Type'],
)

@app.get('/health')
async def health_check():
    return {
        'status': 'healthy',
        'service': 'navis-python-engine',
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'version': '0.1.0',
    }

@app.get('/')
async def root():
    return {
        'message': 'NAVIS Risk Engine API',
        'docs': '/docs',
        'health': '/health',
    }
