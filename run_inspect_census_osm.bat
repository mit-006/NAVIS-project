@echo off
cd /d "C:\Users\DELL\OneDrive\Documents\Default Project\resqmap"
set PYTHON=C:\Users\DELL\OneDrive\Documents\Default Project\resqmap\python-engine\venv\Scripts\python.exe
"%PYTHON%" inspect_census.py
echo.
echo ==========================================
echo.
"%PYTHON%" download_osm_overpass.py
