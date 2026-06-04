from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import get_settings
from .database import get_db
from .models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


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


def extract_bearer_token(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> str:
	if credentials is None or not credentials.credentials:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Missing bearer token",
			headers={"WWW-Authenticate": "Bearer"},
		)
	return credentials.credentials


def verify_jwt_token(token: str) -> dict[str, Any]:
	try:
		return decode_access_token(token)
	except ExpiredSignatureError as exc:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Token has expired",
			headers={"WWW-Authenticate": "Bearer"},
		) from exc
	except JWTError as exc:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid token",
			headers={"WWW-Authenticate": "Bearer"},
		) from exc


def get_current_user(token: str = Depends(extract_bearer_token), db: Session = Depends(get_db)) -> User:
	payload = verify_jwt_token(token)
	subject = payload.get("sub")
	if subject is None:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid token payload",
			headers={"WWW-Authenticate": "Bearer"},
		)

	try:
		user_id = int(subject)
	except (TypeError, ValueError) as exc:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="Invalid token subject",
			headers={"WWW-Authenticate": "Bearer"},
		) from exc

	user = db.scalar(select(User).where(User.id == user_id))
	if user is None:
		raise HTTPException(
			status_code=status.HTTP_401_UNAUTHORIZED,
			detail="User not found for token",
			headers={"WWW-Authenticate": "Bearer"},
		)

	return user