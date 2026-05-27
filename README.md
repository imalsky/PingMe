# PingMe

A wellness check service ("dead man's switch"). You check in every few days by clicking a button. If you miss your window, your emergency contacts are emailed automatically.

Built for people who live alone and want their loved ones notified if something happens to them.

## How It Works

1. **Create an account** and set your check-in schedule (e.g., every 3 days)
2. **Check in regularly** by tapping a button — takes one second
3. **If you miss a check-in**, you get a warning email with a one-click check-in link
4. **If you still don't respond**, your emergency contacts receive a wellness check email with your custom alert message

## Live App

- **Frontend**: https://pingme-frontend-rhgn.onrender.com
- **API**: https://pingme-api-d6fn.onrender.com

First visit after idle takes ~30 seconds (free tier cold start).

## Architecture

```
[User Browser] → [React Frontend (Render Static Site)]
                        ↓ API calls
               [FastAPI Backend (Render Web Service)]
                        ↓
               [PostgreSQL (Neon)]

[GitHub Actions Cron] → hourly → [Backend /api/cron/check-deadlines]
                                        ↓ if overdue
                                  [Brevo Email API] → contacts
```

## Services Used

### Neon — Database
**What**: Managed PostgreSQL database
**Why**: Stores user accounts, emergency contacts, check-in history, and alert records. PostgreSQL was chosen for reliability and the async driver (asyncpg) for performance.
**Free tier**: 0.5 GB storage, 100 compute-hours/month — enough for thousands of users.
**URL**: https://neon.tech

### Brevo — Email Delivery
**What**: Transactional email API (formerly Sendinblue)
**Why**: Sends two types of emails: (1) warning reminders to users who haven't checked in, and (2) emergency alerts to contacts when a deadline passes. A dedicated email API is needed for reliable delivery — Gmail SMTP would hit rate limits and spam filters.
**Free tier**: 300 emails/day — this is the tightest limit. A user with 5 contacts uses 6 emails when overdue (1 warning + 5 alerts).
**URL**: https://brevo.com

### Render — Hosting
**What**: Cloud hosting platform
**Why**: Hosts both the backend (Python web service) and frontend (static site) from the same GitHub repo. Supports automatic deploys on push, environment variables, and the render.yaml blueprint for one-click setup.
**Free tier**: 750 hours/month for the web service, unlimited for static sites. The web service sleeps after 15 min of inactivity (30-50 second cold start on wake).
**URL**: https://render.com

### GitHub Actions — Scheduled Cron
**What**: CI/CD and scheduled workflows
**Why**: Runs an hourly job that hits the backend's `/api/cron/check-deadlines` endpoint. This is what actually checks for overdue users and triggers emails. It's separated from the web server so alerts still work even if no one is actively using the site.
**Free tier**: Unlimited minutes on public repos.
**Config**: `.github/workflows/deadline-checker.yml`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.x (async), Alembic, Pydantic v2 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router, TanStack Query |
| Database | PostgreSQL via Neon |
| Email | Brevo HTTP API |
| Auth | JWT (access + refresh tokens), bcrypt password hashing |
| Cron | GitHub Actions (hourly schedule) |

## Security

- **Passwords** are hashed with bcrypt (via passlib) — never stored in plaintext
- **Authentication** uses JWT with short-lived access tokens (30 min) and longer refresh tokens (7 days). Token type is validated to prevent misuse across token types.
- **All secrets** (database URL, API keys, signing key) are stored in environment variables, never in code. The `.env` file is gitignored.
- **Database connection** uses SSL (`sslmode=require`)
- **CORS** is restricted to the frontend URL only — no wildcards
- **Cron endpoint** is protected by an API key header (`X-API-Key`)
- **Contact ownership** is verified on every mutation — users can only access their own contacts
- **Email templates** use the user's alert message but the context is controlled server-side

## Local Development

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Create .env from .env.example with your Neon + Brevo credentials
alembic upgrade head
uvicorn app.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `localhost:8000`.

## Database Migrations

```bash
cd backend
source .venv/bin/activate
alembic revision --autogenerate -m "description of change"
alembic upgrade head
```

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Backend | Neon PostgreSQL connection string |
| `SECRET_KEY` | Backend | JWT signing key (auto-generated on Render) |
| `BREVO_API_KEY` | Backend | Brevo email API key |
| `CRON_API_KEY` | Backend + GitHub Secret | Shared secret for the hourly cron job |
| `FRONTEND_URL` | Backend | Frontend URL for CORS and email links |
| `VITE_API_URL` | Frontend | Backend API URL for production |
| `BACKEND_URL` | GitHub Secret | Used by the cron workflow to call the API |

## Scaling Limits (Free Tier)

| Component | Limit | Impact |
|-----------|-------|--------|
| Brevo | 300 emails/day | ~50 users if all go overdue simultaneously |
| Neon | 0.5 GB storage | ~10,000+ users |
| Render | 512 MB RAM, cold starts | ~50-100 concurrent requests |
| GitHub Actions | Unlimited (public repo) | No practical limit |

First upgrade needed: Brevo ($15/month → 10,000 emails/month).

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/           # Route handlers (auth, check-in, contacts, settings, cron)
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── services/      # Business logic (auth, email, deadline checker)
│   │   ├── config.py      # Environment config via pydantic-settings
│   │   ├── database.py    # Async SQLAlchemy setup
│   │   ├── dependencies.py # FastAPI auth dependencies
│   │   └── main.py        # FastAPI app entry point
│   └── alembic/           # Database migrations
├── frontend/
│   ├── src/
│   │   ├── pages/         # React page components
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # Auth context
│   │   ├── services/      # API client with token refresh
│   │   └── App.tsx        # Router and providers
│   └── components.json    # shadcn/ui config
├── .github/workflows/     # Cron job
├── render.yaml            # Render deployment blueprint
└── .env.example           # Environment variable template
```

## License

MIT
