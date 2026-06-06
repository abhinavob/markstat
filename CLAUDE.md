# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MarkStat is a full-stack application for analyzing exam results and student performance. It allows users to upload exam data (PDF or XLSX files), parse student results, and generate analytics including rankings, distributions, and summary statistics.

**Stack:**
- **Backend:** Python 3.x with FastAPI, SQLAlchemy ORM, PostgreSQL
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Recharts
- **Architecture:** Monorepo with separate `backend/` and `frontend/` directories

## Getting Started

### Option A: Docker (recommended)

Requires Docker Desktop. Runs Postgres, backend, and frontend with a single command — no local Python or Node needed.

```bash
docker compose up
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

The backend entrypoint (`backend/entrypoint.sh`) automatically runs `alembic upgrade head` before starting uvicorn, so the database is always migrated on startup.

To reset the database (wipe volume and re-migrate):
```bash
docker compose down --volumes && docker compose up
```

### Option B: Local Setup

#### Prerequisites
- Python 3.x with pip
- Node.js and npm
- PostgreSQL database (local or remote)

#### Backend Setup
```bash
# From backend directory
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Unix/macOS

pip install -r requirements.txt
python -m alembic upgrade head  # Run migrations
```

#### Frontend Setup
```bash
# From frontend directory
cd frontend
npm install
```

## Running the Application (local)

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
- **Type check:** `npm run typecheck`
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
├── types/api.ts              # All API request/response TypeScript types
├── api/                      # API integration layer (all fetch calls go through here)
│   ├── client.ts             # Base fetch wrapper: auth header injection, error handling, 401 auto-logout
│   ├── auth.ts               # login(), register(), getMe()
│   ├── exams.ts              # listExams()
│   ├── uploads.ts            # analyzeUpload(), importResults()
│   └── analytics.ts          # getSummary(), getRankings(), getDistribution()
├── context/AuthContext.tsx   # Auth state (user + token), persisted to localStorage
├── hooks/
│   ├── useAuth.ts            # Shorthand for useContext(AuthContext)
│   ├── useExams.ts           # Fetches exam list with loading/error state
│   ├── useExamAnalytics.ts   # Parallel-fetches summary + rankings + distribution
│   └── useUploadWizard.ts    # Upload wizard state machine (select → map → done)
├── router/
│   ├── AppRouter.tsx         # All route definitions, wraps AuthProvider + BrowserRouter
│   └── ProtectedRoute.tsx    # Redirects to /login if no token
├── components/
│   ├── layout/               # AppLayout (top nav + content), TopNav, AuthLayout
│   ├── ui/                   # Button, Input, Card, Spinner, Badge, StatCard, ErrorMessage
│   ├── exam/                 # ExamCard, ExamEmptyState
│   └── upload/               # FileDropzone, PreviewTable, ColumnMappingForm
├── pages/                    # LoginPage, RegisterPage, DashboardPage, UploadPage, ExamDetailPage
├── App.tsx                   # Renders AppRouter
├── main.tsx                  # React entry point
└── index.css                 # Tailwind CSS v4 import
```

**Routes:**
- `/login`, `/register` — public, wrapped in `AuthLayout` (centered card)
- `/dashboard` — exam list grid; "Upload Exam" button navigates to `/upload`
- `/upload` — 3-step wizard: select file → map columns → done
- `/exams/:examId` — analytics view: 4 stat cards, distribution bar chart, rankings table
- `*` — redirects to `/dashboard`

**API proxy:** Vite dev server proxies `/api/*` → `http://localhost:8000`. The `client.ts` base URL is `/api`, so no hardcoded localhost and no CORS issues during development (`vite.config.ts` → `server.proxy`).

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

- **CORS:** Handled via Vite proxy during development — no CORS middleware needed on the backend in dev. For production, configure FastAPI CORS or serve from same origin.
- **Exam metadata on detail page:** `ExamDetailPage` reads exam title/subject from React Router location state (passed by `ExamCard`). On direct URL access or refresh, it falls back to calling `GET /exams` and finding by ID.
- **Analytics metric:** The `metric` query param defaults to `"total"`. Users can type any score column name into the metric input on the detail page to view per-subject analytics.
- **No `GET /exams/:id` endpoint:** The backend only exposes `GET /exams` (list). If a dedicated single-exam endpoint is added later, update `ExamDetailPage` to use it on the fallback path.
- File storage is ephemeral (not cloud-backed); consider S3 for production.
- Alembic migrations in `alembic/versions/` track schema changes.
