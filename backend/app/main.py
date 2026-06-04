from __future__ import annotations

from fastapi import FastAPI

from .config import get_settings
from .routers.auth import router as auth_router
from .routers.uploads import router as uploads_router

settings = get_settings()

app = FastAPI(title=settings.app_name)
app.include_router(auth_router)
app.include_router(uploads_router)


@app.get("/health")
def health_check() -> dict[str, str]:
	return {"status": "ok"}
