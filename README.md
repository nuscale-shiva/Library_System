# Library Borrowing System Backend

Production-grade REST API for managing library operations including book inventory, member management, and borrowing activities.

## Stack

- FastAPI
- SQLAlchemy ORM
- PostgreSQL (Dockerized)
- Pydantic for validation
- uvicorn server

## Architecture

The codebase follows a clean, modular architecture with clear separation of concerns:

```
.
├── main.py                 # Application entry point, CORS, router registration
├── app/
│   ├── db/
│   │   └── database.py     # Database connection, session management
│   ├── models/             # SQLAlchemy ORM models
│   │   ├── book.py
│   │   ├── member.py
│   │   └── borrow.py
│   ├── schemas/            # Pydantic schemas for request/response validation
│   │   ├── book.py
│   │   ├── member.py
│   │   └── borrow.py
│   ├── crud/               # Database operations layer
│   │   ├── book.py
│   │   ├── member.py
│   │   └── borrow.py
│   └── routers/            # API endpoint definitions
│       ├── book.py
│       ├── member.py
│       └── borrow.py
├── docker-compose.yml      # PostgreSQL service configuration
├── requirements.txt        # Python dependencies
└── .env                    # Environment variables
```

### Layer Responsibilities

**Models**: Define database schema using SQLAlchemy ORM. Each model represents a table with columns, relationships, and constraints.

**Schemas**: Pydantic models for request validation and response serialization. Separate schemas for create, update, and read operations.

**CRUD**: Business logic layer handling database operations. Abstracts SQLAlchemy queries from route handlers.

**Routers**: HTTP endpoint definitions with request/response handling. Uses dependency injection for database sessions.

**Database**: Centralized configuration for database connection pooling and session management.

## Prerequisites

- Python 3.9+
- Docker and Docker Compose
- uv package manager (recommended) or pip

## Setup Instructions

### 1. Clone Repository

```bash
git clone <repository-url>
cd Library_System
```

### 2. Start PostgreSQL Database

```bash
docker-compose up -d
```

This starts a PostgreSQL 14 instance with:
- User: shiva
- Password: shiva1234
- Database: library_db
- Port: 5432

### 3. Create Virtual Environment

Using uv:
```bash
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

Or using venv:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 4. Install Dependencies

Using uv:
```bash
uv pip install -r requirements.txt
```

Or using pip:
```bash
pip install -r requirements.txt
```

### 5. Configure Environment

Ensure `.env` file contains:
```
DATABASE_URL=postgresql://shiva:shiva1234@localhost:5432/library_db
```

### 6. Run Application

```bash
uvicorn main:app --reload
```

The API will be available at:
- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## API Endpoints

### Books
- `POST /books` - Create new book
- `GET /books` - List all books (supports `available_only=true` query param)
- `GET /books/{book_id}` - Get book by ID
- `PUT /books/{book_id}` - Update book
- `DELETE /books/{book_id}` - Delete book

### Members
- `POST /members` - Register new member
- `GET /members` - List all members
- `GET /members/{member_id}` - Get member by ID
- `PUT /members/{member_id}` - Update member
- `DELETE /members/{member_id}` - Delete member

### Borrow Operations
- `POST /borrow` - Borrow a book
- `GET /borrow` - List all borrow records (supports `active_only=true` query param)
- `GET /borrow/{borrow_id}` - Get borrow record by ID
- `GET /borrow/member/{member_id}` - Get all borrows for a member
- `POST /borrow/{borrow_id}/return` - Return a borrowed book

## Features

### Automatic Book Availability Management
When a book is borrowed, its availability status is automatically set to false. Upon return, availability is restored.

### Data Validation
All input is validated using Pydantic schemas. Invalid requests return detailed error messages.

### Database Transactions
CRUD operations handle database transactions with proper commit/rollback behavior.

### CORS Support
API is configured to allow all origins for development. Adjust CORS settings in `main.py` for production.

## Development

### Database Migrations

Schema changes are automatically applied on application startup via SQLAlchemy's `create_all()`. For production, consider using Alembic for versioned migrations.

### Code Style

The codebase maintains minimal comments, focusing on clean, self-documenting code. Comments are reserved for complex business logic only.

### Testing

Access interactive API documentation at `/docs` to test endpoints directly in the browser.

## Production Considerations

1. Update CORS settings to restrict allowed origins
2. Implement proper authentication and authorization
3. Use environment-specific configuration
4. Add comprehensive logging
5. Implement rate limiting
6. Use Alembic for database migrations
7. Set up proper error monitoring
8. Configure PostgreSQL connection pooling based on load

## Troubleshooting

**Database connection fails**: Ensure PostgreSQL container is running (`docker ps`) and credentials match `.env` configuration.

**Port already in use**: Change the port in docker-compose.yml or stop the conflicting service.

**Import errors**: Verify virtual environment is activated and dependencies are installed.
