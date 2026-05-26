# PingMe

A wellness check service ("dead man's switch"). Users check in every X days. If they miss their window, emergency contacts are emailed.

## Tech Stack

- **Backend**: Python 3.12, FastAPI, async SQLAlchemy 2.x, Alembic, Pydantic v2
- **Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query
- **Database**: PostgreSQL (Neon free tier)
- **Email**: Brevo HTTP API
- **Auth**: JWT (access + refresh tokens), bcrypt
- **Cron**: GitHub Actions (hourly)
- **Hosting**: Render free tier

## Local Development

### Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env  # then fill in values
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Running Tests
```bash
cd backend
pytest -v
```

## Project Conventions

- All datetimes are UTC timezone-aware (`datetime.now(timezone.utc)`)
- SQLAlchemy enums use `native_enum=False` for SQLite test compatibility
- API routes are prefixed with `/api/`
- Pydantic v2 models in `schemas/`, SQLAlchemy models in `models/`
- Business logic lives in `services/`, route handlers in `api/`
- Frontend API client at `src/services/api.ts` handles token refresh automatically
- Protected routes require JWT Bearer token
- Cron endpoint requires `X-API-Key` header

## Environment Variables

See `.env.example` for all required variables. The `config.py` module loads them via pydantic-settings.
