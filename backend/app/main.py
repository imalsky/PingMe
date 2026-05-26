from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, check_in, contacts, cron, settings
from app.config import settings as app_settings

app = FastAPI(title="PingMe API", redirect_slashes=False)

# CORS
allowed_origins = [
    app_settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
# Deduplicate while preserving order
seen: set[str] = set()
unique_origins: list[str] = []
for origin in allowed_origins:
    if origin not in seen:
        seen.add(origin)
        unique_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=unique_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(check_in.router)
app.include_router(contacts.router)
app.include_router(settings.router)
app.include_router(cron.router)


@app.get("/api/health")
async def health() -> dict:
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
