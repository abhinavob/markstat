# MarkStat

A full-stack web application for uploading exam results, parsing student scores, and generating performance analytics — rankings, score distributions, and summary statistics.

## Features

- Upload exam data as **PDF** or **XLSX** files
- Interactive **column mapping wizard** to match file columns to score fields
- Per-exam analytics: **summary stats**, **score distribution chart**, and **student rankings**
- Multi-subject support — analyze total marks or any individual subject score
- JWT-based authentication with per-user exam scoping

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | Python 3, FastAPI, SQLAlchemy, PostgreSQL, Alembic |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Recharts |
| File Parsing | pdfplumber (PDF), openpyxl (XLSX) |
| Auth | JWT via python-jose, bcrypt password hashing |
| Containers | Docker, Docker Compose |

## Getting Started

### Option A: Docker (recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
git clone <repo-url>
cd MarkStat
docker compose up
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

Database migrations run automatically on every startup — no manual setup needed.

To reset the database:

```bash
docker compose down --volumes && docker compose up
```

### Option B: Local setup

#### Prerequisites

- Python 3.x with pip
- Node.js and npm
- PostgreSQL

#### 1. Clone the repo

```bash
git clone <repo-url>
cd MarkStat
```

#### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=markstat
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<your-postgres-password>
JWT_SECRET_KEY=<your-jwt-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
UPLOAD_STORAGE_DIR=storage/uploads
```

Run database migrations:

```bash
python -m alembic upgrade head
```

#### 3. Frontend setup

```bash
cd frontend
npm install
```

#### 4. Run the app

Start both servers in separate terminals:

```bash
# Terminal 1 — backend (from backend/ with venv active)
uvicorn app.main:app --reload
# Runs on http://localhost:8000

# Terminal 2 — frontend (from frontend/)
npm run dev
# Runs on http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend, so no CORS configuration is needed during development.

## How It Works

1. **Register / log in** to get a JWT token
2. **Upload** a PDF or XLSX exam file
3. **Map columns** — assign which columns represent student ID, name, and score fields
4. **View analytics** on the exam detail page:
   - Summary cards (count, average, highest, lowest)
   - Score distribution bar chart
   - Full student rankings table
5. Switch the **metric** input to analyze any individual subject instead of total marks

## Project Structure

```
MarkStat/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app entry point
│       ├── models.py        # SQLAlchemy models (User, Exam, StudentResult)
│       ├── schemas.py       # Pydantic schemas
│       ├── routers/         # auth, exams, uploads, analytics
│       └── services/        # file parsing, import logic, analytics computation
└── frontend/
    └── src/
        ├── api/             # Typed fetch wrappers for every endpoint
        ├── pages/           # Login, Register, Dashboard, Upload, ExamDetail
        ├── components/      # Reusable UI and feature components
        ├── hooks/           # useExams, useExamAnalytics, useUploadWizard
        └── context/         # AuthContext (token + user, persisted to localStorage)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |
| GET | `/auth/me` | Current user |
| GET | `/exams` | List user's exams |
| POST | `/uploads/analyze` | Upload file and get column preview |
| POST | `/uploads/{exam_id}/import` | Import results with column mapping |
| GET | `/analytics/exams/{exam_id}/summary` | Summary statistics |
| GET | `/analytics/exams/{exam_id}/rankings` | Student rankings |
| GET | `/analytics/exams/{exam_id}/distribution` | Score distribution |

## Database Migrations

```bash
# Create a new migration after changing models.py
alembic revision --autogenerate -m "description"

# Apply pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1
```

## Frontend Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # ESLint
npm run typecheck  # TypeScript type check
npm run preview    # Preview production build
```
