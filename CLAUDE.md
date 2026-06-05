# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MarkStat is a full-stack application for analyzing exam results and student performance. It allows users to upload exam data (PDF or XLSX files), parse student results, and generate analytics including rankings, distributions, and summary statistics.

**Stack:**
- **Backend:** Python 3.x with FastAPI, SQLAlchemy ORM, PostgreSQL
- **Frontend:** React 19 with Vite, Tailwind CSS
- **Architecture:** Monorepo with separate backend and frontend directories

## Getting Started

### Prerequisites
- Python 3.x with pip
- Node.js and npm
- PostgreSQL database (local or remote)

### Backend Setup
```bash
# From backend directory
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Unix/macOS

pip install -r requirements.txt
python -m alembic upgrade head  # Run migrations
```

### Frontend Setup
```bash
# From frontend directory
cd frontend
npm install
```

## Running the Application

### Backend
```bash
# From backend directory (with venv activated)
uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

### Frontend
```bash
# From frontend directory
npm run dev
# Runs on http://localhost:5173
```

### Health Check
```bash
curl http://localhost:8000/health
```

## Development Commands

### Backend
- **Lint:** Code follows PEP-8; no automated linter currently configured
- **Database migrations:** 
  - Create new migration: `alembic revision --autogenerate -m "description"`
  - Apply migrations: `alembic upgrade head`
  - Revert migration: `alembic downgrade -1`

### Frontend
- **Lint:** `npm run lint`
- **Build:** `npm run build`
- **Preview production build:** `npm run preview`

### Testing
No test framework currently set up. Manual testing via API endpoints and frontend UI recommended.

## Architecture

### Database Models
Located in `backend/app/models.py`:
- **User:** Authentication, stores full_name, email, password_hash
- **Exam:** Uploaded exam file metadata (title, subject, filename, uploaded_at)
- **StudentResult:** Parsed student scores from exams, stores individual scores as JSONB and total_marks as Decimal

### Backend Structure
```
backend/app/
├── main.py              # FastAPI app initialization, router registration
├── config.py            # Settings management with environment variables
├── database.py          # SQLAlchemy setup, session factory
├── models.py            # ORM models (User, Exam, StudentResult)
├── schemas.py           # Pydantic request/response schemas
├── security.py          # JWT auth, password hashing, token validation
├── routers/             # API endpoint handlers
│   ├── auth.py          # POST /auth/register, /auth/login, GET /auth/me
│   ├── exams.py         # GET /exams (list user's exams)
│   ├── uploads.py       # POST /uploads/analyze, /{exam_id}/import
│   └── analytics.py     # GET /analytics/exams/{exam_id}/{summary,rankings,distribution}
└── services/            # Business logic
    ├── uploads.py       # File upload, parsing, result import
    ├── file_parser.py   # Extract data from PDF/XLSX files
    └── analytics.py     # Compute summary, rankings, distributions
```

### Frontend Structure
```
frontend/src/
├── main.jsx             # React app entry point
├── App.jsx              # Root component (currently stub)
├── App.css              # Styles
└── index.css            # Global styles
```

## Data Flow: File Import Pipeline

1. User uploads file via `POST /uploads/analyze`
2. File saved to `storage/uploads/exam_{exam_id}/`
3. `file_parser.py` extracts tabular data (PDF or XLSX)
4. Returns preview of columns and first 5 rows
5. User submits column mapping via `POST /uploads/{exam_id}/import`
6. `import_exam_results()` maps columns to StudentResult fields and bulk inserts
7. Analytics computed on-demand from StudentResult table

**Supported Formats:**
- PDF: Uses pdfplumber for table extraction
- XLSX: Uses openpyxl for sheet/cell reading

## Configuration

Environment variables in `.env` (backend):
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=markstat
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
SQLALCHEMY_ECHO=true
JWT_SECRET_KEY=change-me-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
UPLOAD_STORAGE_DIR=storage/uploads
```

## Authentication & Authorization

- JWT tokens issued on login/register
- Tokens include user ID and email
- Protected endpoints verify token via `get_current_user` dependency
- All exams/results scoped to authenticated user

## Key Implementation Details

### File Parsing
- `extract_tabular_file()` returns ParsedTabularFile with file_type, sheet_names, columns, rows
- PDF tables extracted via pdfplumber; XLSX read via openpyxl
- Decimal conversion via `to_decimal()` for score columns

### Analytics
- **Summary:** Calculates count, average, highest, lowest per metric
- **Rankings:** Sorts by score (desc) then student_id for ties, assigns ranks
- **Distribution:** Buckets scores into BUCKET_SIZE (10) point ranges
- Metrics are flexible: "total" (default) or any score column name

### Storage
- Files stored on disk: `storage/uploads/exam_{exam_id}/{filename}`
- Cleanup on failed import, soft deletion not implemented

## Common Tasks

### Adding a New API Endpoint
1. Define request/response schema in `schemas.py`
2. Create handler in appropriate router file (`routers/*.py`)
3. Register in `main.py` with `app.include_router()`
4. Use `Depends(get_current_user)` and `Depends(get_db)` for auth/db access

### Modifying Database Schema
1. Update model class in `models.py`
2. Run `alembic revision --autogenerate -m "description"`
3. Review generated migration in `alembic/versions/`
4. Apply with `alembic upgrade head`

### Debugging
- Backend: Set `SQLALCHEMY_ECHO=true` in .env to see SQL queries
- Frontend: Browser DevTools for network requests and console
- Check `storage/` directory for uploaded files

## Notes

- No CORS configured; frontend/backend on same origin or adjust if needed
- File storage is ephemeral (not cloud-backed); consider S3 for production
- Alembic migrations in `alembic/versions/` track schema changes
- Frontend UI is minimal placeholder; main development is backend APIs
