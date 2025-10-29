#!/usr/bin/env python3
import os
from dotenv import load_dotenv

# Load environment variables first
load_dotenv()

# Check environment variables
print("=== Environment Check ===")
db_url = os.getenv("DATABASE_URL")
api_key = os.getenv("OPENAI_API_KEY")

print(f"DATABASE_URL: {'✓ Set' if db_url else '✗ Not set'}")
print(f"OPENAI_API_KEY: {'✓ Set' if api_key and api_key != 'your_openai_api_key_here' else '✗ Not set (AI features will be disabled)'}")
print()

print("=== Testing Imports ===")
try:
    from app.routers import book, member, borrow
    print("✓ Basic routers imported successfully")
except Exception as e:
    print(f"✗ Failed to import basic routers: {e}")

try:
    from app.ai.router import router as ai_router
    print("✓ AI router imported successfully")
except Exception as e:
    print(f"✗ Failed to import AI router: {e}")

try:
    from main import app
    print("✓ FastAPI app created successfully")
except Exception as e:
    print(f"✗ Failed to create FastAPI app: {e}")

print()
print("=== Backend Status ===")
if 'app' in locals():
    print("✓ Backend is ready to start")
    print()
    print("To start the backend, run:")
    print("  uvicorn main:app --reload")
else:
    print("✗ Backend has errors that need to be fixed")