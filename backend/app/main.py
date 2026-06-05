from __future__ import annotations

from fastapi import FastAPI

from .config import get_settings
from .routers.auth import router as auth_router
from .routers.exams import router as exams_router
from .routers.uploads import router as uploads_router
from .routers.analytics import router as analytics_router

settings = get_settings()

app = FastAPI(title=settings.app_name)
app.include_router(auth_router)
app.include_router(exams_router)
app.include_router(uploads_router)
app.include_router(analytics_router)


@app.get("/health")
def health_check() -> dict[str, str]:
	return {"status": "ok"}
