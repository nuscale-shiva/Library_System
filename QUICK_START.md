# Quick Start Guide - Library Management System

This guide will help you get the system running in under 5 minutes.

## Prerequisites Check

```bash
# Check Python (need 3.9+)
python --version

# Check Node.js (need 18+)
node --version

# Check Docker
docker --version
```

## Step 1: Start Database

```bash
docker-compose up -d
```

Wait 5 seconds for PostgreSQL to fully start.

## Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your OpenAI API key (optional)
# If you don't have one, the app will still work without AI features
```

**Important**: If you don't have an OpenAI API key:
- The library management features will work perfectly
- Only the AI Assistant will show a message that it needs configuration

## Step 3: Setup Backend

```bash
# Create virtual environment
python -m venv .venv

# Activate it
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Test the backend setup
python test_backend.py

# Start the backend
uvicorn main:app --reload
```

Backend should now be running at: http://localhost:8000

Test it by visiting: http://localhost:8000/docs

## Step 4: Setup Frontend

Open a new terminal and run:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Clear any cache
rm -rf node_modules/.vite

# Start development server
npm run dev
```

Frontend should now be running at: http://localhost:5173

## Step 5: Test Everything

1. **Frontend**: Open http://localhost:5173
   - You should see the Dashboard with a dark theme
   - Navigate through Books, Members, Borrows pages

2. **Add Sample Data**: Visit http://localhost:8000/docs
   - Add a few books via POST /books
   - Add a few members via POST /members
   - Create a borrow record via POST /borrows

3. **Test AI Assistant** (if API key configured):
   - Go to AI Assistant page
   - Try: "Show me all available books"
   - Try: "What are the library statistics?"

## Common Issues & Solutions

### Backend Won't Start

```bash
# Check if port 8000 is in use
lsof -i :8000

# If occupied, kill the process or use different port
uvicorn main:app --reload --port 8001
```

### Frontend Shows Blank Page

```bash
# Clear all caches
cd frontend
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

### Database Connection Error

```bash
# Check if PostgreSQL is running
docker ps

# If not running, start it
docker-compose up -d

# Create database manually if needed
docker exec library_container psql -U shiva -d postgres -c "CREATE DATABASE library_db;"
```

### AI Assistant Not Working

Check your .env file has:
```
OPENAI_API_KEY=sk-proj-...your-actual-key...
```

Then restart the backend.

## Verify Everything is Working

Run this checklist:

- [ ] Backend API docs accessible at http://localhost:8000/docs
- [ ] Frontend loads at http://localhost:5173
- [ ] Can navigate to all pages (Dashboard, Books, Members, Borrows, AI)
- [ ] Can create a new book
- [ ] Can create a new member
- [ ] Can create a borrow record
- [ ] Dashboard shows correct statistics
- [ ] AI Assistant responds (if API key configured)

## Next Steps

1. **Add Sample Data**: Use the API docs to add books and members
2. **Test CRUD Operations**: Try adding, editing, deleting records
3. **Explore AI Features**: Ask the AI assistant about your library
4. **Check Borrowing Flow**: Borrow a book and return it

## Support

If you encounter any issues:

1. Check the console/terminal for error messages
2. Ensure all prerequisites are installed
3. Make sure ports 8000 and 5173 are available
4. Verify your .env file has the correct database URL

## Success! 🎉

If everything is working, you should have:
- A dark-themed modern UI
- Full CRUD operations for library management
- Real-time borrowing system
- AI-powered assistant (if configured)
- Professional dashboard with statistics

Enjoy your Library Management System!