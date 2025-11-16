#!/bin/bash

# Library System Stop Script

echo "🛑 Stopping Library Management System..."

# Stop backend (uvicorn)
echo "Stopping backend..."
pkill -f "uvicorn main:app"

# Stop frontend (Vite)
echo "Stopping frontend..."
pkill -f "vite"

# Stop database
echo "Stopping database..."
docker-compose down

echo "✅ All services stopped successfully!"
