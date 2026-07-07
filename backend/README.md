# CAMS Backend (FastAPI)

This folder contains the backend service for the Consumer Attention Mapping System (CAMS) built with FastAPI.

Quickstart (local, development):

1. Create a virtual environment and activate it (Windows PowerShell):

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r requirements.txt
```

3. Copy the example env and provide values:

```powershell
copy .env.example .env
# Edit .env and set DATABASE_URL, JWT_SECRET, etc.
```

4. Run the API (development):

```powershell
uvicorn app.main:app --reload --port 8000
```

5. Verify video ingestion (requires OpenCV):

```powershell
python verify_stream.py --source 0 --limit 200 --show
# or use a file: --source "sample_video.mp4"
```

Notes:
- Database defaults to SQLite for local runs. To use PostgreSQL, set `DATABASE_URL` in `.env` to a valid PostgreSQL URI.
- API routes:
  - Auth: `/api/auth` (contract), legacy `/api/v1/auth`
  - Stores: `/api/stores` (contract), legacy `/api/v1/stores`
- A Postman collection for Milestone 1 is included at `backend/cams_milestone1_postman.json`.

Database migrations (Alembic):

1. Initialize (already scaffolded):

```powershell
# From backend/ folder
alembic -c alembic.ini current
```

2. Create an autogenerate migration (after updating models):

```powershell
alembic -c alembic.ini revision --autogenerate -m "add users/stores/shelves"
```

3. Apply migrations:

```powershell
alembic -c alembic.ini upgrade head
```

Note: `alembic.ini` is configured to read `sqlalchemy.url` from the app `.env` via `app.core.config`. If you use PostgreSQL, set `DATABASE_URL` in `.env` before running migrations.
