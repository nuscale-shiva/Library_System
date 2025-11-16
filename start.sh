#!/bin/bash

# Library System Startup Script

echo "🚀 Starting Library Management System..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Start PostgreSQL database
echo "📦 Starting PostgreSQL database..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 3

# Check if .venv exists
if [ ! -d ".venv" ]; then
    echo "❌ Error: Virtual environment not found. Please run: python -m venv .venv"
    exit 1
fi

# Activate virtual environment and start backend
echo "🐍 Starting FastAPI backend..."
source .venv/bin/activate

# Check if migrations need to be run
if [ ! -d "alembic/versions" ] || [ -z "$(ls -A alembic/versions)" ]; then
    echo "🔄 Running database migrations..."
    alembic upgrade head
fi

# Start backend in background
uvicorn main:app --reload &
BACKEND_PID=$!

echo "✅ Backend started (PID: $BACKEND_PID)"
echo "📚 API available at: http://localhost:8000"
echo "📖 API docs at: http://localhost:8000/docs"

# Start frontend
echo "⚛️  Starting React frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✨ Application is starting up!"
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; docker-compose down; echo '✅ All services stopped'; exit" INT

# Keep script running
wait
