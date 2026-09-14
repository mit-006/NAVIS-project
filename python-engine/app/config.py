import os
from dotenv import load_dotenv

load_dotenv()

PYTHON_ENGINE_PORT = int(os.getenv('PYTHON_ENGINE_PORT', '8000'))
PYTHON_ENGINE_HOST = os.getenv('PYTHON_ENGINE_HOST', '0.0.0.0')
DATA_DIR = os.getenv('DATA_DIR', './data')
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
    if origin.strip()
]
