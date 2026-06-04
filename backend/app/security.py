from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
	return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
	return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, expires_delta: timedelta | None = None, extra_claims: dict[str, Any] | None = None) -> str:
	settings = get_settings()
	claims = dict(extra_claims or {})
	now = datetime.now(timezone.utc)
	expires_at = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
	claims.update({"sub": subject, "iat": int(now.timestamp()), "exp": expires_at})
	return jwt.encode(claims, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
	settings = get_settings()
	return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def get_token_subject(token: str) -> str | None:
	try:
		payload = decode_access_token(token)
		subject = payload.get("sub")
		return subject if isinstance(subject, str) else None
	except JWTError:
		return None