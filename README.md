# Library Management System with AI Assistant

Production-grade full-stack library management system featuring an intelligent AI assistant powered by LangChain and OpenAI. The system combines a FastAPI backend with a modern React frontend to provide comprehensive library operations and AI-driven insights.

## Features

### Core Functionality
- Complete CRUD operations for books, members, and borrowing records
- Automatic book availability management
- Real-time borrowing tracking and history
- Advanced search and filtering capabilities
- Responsive dashboard with statistics

### AI Assistant
- Intelligent book search and recommendations using RAG (Retrieval Augmented Generation)
- Natural language queries for library operations
- Semantic book discovery with ChromaDB vector storage
- Real-time tool call visualization
- Contextual conversation with session management
- Powered by GPT-4o-mini via LangChain

## Technology Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Relational database (Dockerized)
- **LangChain** - AI agent orchestration framework
- **OpenAI GPT-4o-mini** - Language model
- **ChromaDB** - Vector database for embeddings
- **Langfuse** - LLM observability and tracing
- **Alembic** - Database migrations

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state management
- **React Router** - Client-side routing
- **Framer Motion** - Animation library
- **Axios** - HTTP client

## Architecture

```
Library_System/
├── app/                      # Backend application
│   ├── ai/                   # AI module
│   │   ├── agent.py         # LangChain agent setup
│   │   ├── tools.py         # Custom library tools
│   │   ├── rag.py           # RAG pipeline with ChromaDB
│   │   ├── prompts.py       # System prompts
│   │   └── router.py        # AI API endpoints
│   ├── db/                  # Database configuration
│   ├── models/              # SQLAlchemy models
│   ├── schemas/             # Pydantic schemas
│   ├── crud/                # Database operations
│   └── routers/             # API endpoints
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── ai/          # AI chat components
│   │   │   ├── layout/      # Layout components
│   │   │   └── ui/          # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API clients
│   │   ├── types/           # TypeScript interfaces
│   │   └── lib/             # Utilities
│   └── ...
├── alembic/                  # Database migrations
├── tests/                    # Test suite
├── main.py                   # FastAPI entry point
├── docker-compose.yml        # PostgreSQL configuration
└── requirements.txt          # Python dependencies
```

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **Docker & Docker Compose**
- **OpenAI API Key**
- **(Optional) Langfuse API Keys** for observability

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repository-url>
cd Library_System
```

### 2. Backend Setup

#### Start PostgreSQL Database

```bash
docker-compose up -d
```

This starts PostgreSQL 14 with:
- User: `shiva`
- Password: `shiva1234`
- Database: `library_db`
- Port: `5432`

#### Create Virtual Environment

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://shiva:shiva1234@localhost:5432/library_db
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Langfuse for observability
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
LANGFUSE_SECRET_KEY=your_langfuse_secret_key
LANGFUSE_HOST=https://cloud.langfuse.com
```

**Note**: The `OPENAI_API_KEY` is required for the AI assistant to function.

#### Run Database Migrations

```bash
alembic upgrade head
```

#### Start Backend Server

```bash
uvicorn main:app --reload
```

Backend will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs

### 3. Frontend Setup

#### Navigate to Frontend Directory

```bash
cd frontend
```

#### Install Dependencies

```bash
npm install
```

#### Start Development Server

```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

## API Endpoints

### Books
- `POST /books` - Create new book
- `GET /books` - List books (supports `available_only` filter)
- `GET /books/{id}` - Get book by ID
- `PUT /books/{id}` - Update book
- `DELETE /books/{id}` - Delete book

### Members
- `POST /members` - Register new member
- `GET /members` - List all members
- `GET /members/{id}` - Get member by ID
- `PUT /members/{id}` - Update member
- `DELETE /members/{id}` - Delete member

### Borrows
- `POST /borrows` - Create borrow record
- `GET /borrows` - List borrow records (supports `active_only` filter)
- `GET /borrows/{id}` - Get borrow by ID
- `PUT /borrows/{id}/return` - Return borrowed book

### AI Assistant
- `POST /ai/chat` - Send message to AI assistant
- `POST /ai/sessions/{session_id}/clear` - Clear conversation history
- `POST /ai/rag/refresh` - Refresh RAG vector store
- `GET /ai/health` - Check AI service health

## AI Assistant Capabilities

The AI assistant uses LangChain with custom tools to help with library operations:

### Available Tools
1. **search_books** - Find books by title or author
2. **recommend_books** - Get AI-powered recommendations using RAG
3. **check_book_availability** - Check if a book is available
4. **get_member_borrow_history** - View member borrowing history
5. **get_library_statistics** - Get library analytics
6. **get_all_available_books** - List all available books

### Example Queries
- "Show me all books by J.K. Rowling"
- "Recommend some science fiction books"
- "Is the book with ID 5 available?"
- "What are the current library statistics?"
- "Show me all available books"

## Testing

### Backend Tests

The project includes comprehensive test coverage using pytest:

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest tests/

# Run with verbose output
pytest tests/ -v

# Run specific test file
pytest tests/test_books.py
```

**Test Coverage:**
- Members CRUD operations
- Books CRUD operations
- Borrow/return workflows
- Input validation
- Error handling
- Business logic

All tests run against an isolated SQLite database.

### Frontend Development

```bash
cd frontend

# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### Adding Sample Data

Use the interactive API docs at http://localhost:8000/docs to add sample books and members.

### Using the AI Assistant

1. Navigate to the AI Assistant page at http://localhost:5173/ai
2. Ask questions in natural language
3. View tool calls and intermediate steps in expandable sections
4. Conversation history is maintained per session

## Database Migrations

### Create New Migration

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply Migrations

```bash
alembic upgrade head
```

### Rollback

```bash
alembic downgrade -1
```

## Troubleshooting

### Database Connection Issues

**Error**: `database "library_db" does not exist`

```bash
docker exec library_container psql -U shiva -d postgres -c "CREATE DATABASE library_db;"
```

### Backend Port Conflict

If port 8000 is already in use, modify the uvicorn command:

```bash
uvicorn main:app --reload --port 8001
```

Update the frontend API baseURL in `frontend/src/services/api.ts` accordingly.

### Frontend Port Conflict

Vite will automatically try the next available port or you can specify:

```bash
npm run dev -- --port 3000
```

### AI Assistant Not Responding

1. Verify `OPENAI_API_KEY` is set in `.env`
2. Check backend logs for errors
3. Ensure backend is running
4. Refresh RAG vector store via `/ai/rag/refresh` endpoint

## Production Deployment

### Backend

1. Set production environment variables
2. Disable debug mode and auto-reload
3. Configure CORS for specific origins
4. Use production-grade WSGI server (e.g., Gunicorn)
5. Set up SSL/TLS certificates
6. Implement authentication and authorization
7. Configure rate limiting
8. Set up monitoring and logging

### Frontend

```bash
cd frontend
npm run build
```

Deploy the `dist/` directory to your hosting service (Vercel, Netlify, AWS S3, etc.)

Update API base URL for production in `frontend/src/services/api.ts`.

## Performance Considerations

- Backend implements connection pooling for PostgreSQL
- Frontend uses React Query for efficient data caching
- ChromaDB provides fast semantic search with embeddings
- Lazy loading and code splitting in frontend
- Optimistic UI updates for better UX

## Security Notes

- Never commit `.env` files with API keys
- Implement proper authentication before production
- Validate all user inputs
- Use environment-specific configurations
- Regular security audits and dependency updates

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
