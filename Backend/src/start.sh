#!/bin/bash
set -e

echo "Running pre-start script to check database..."
python src/app/pre_start.py

echo "Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
