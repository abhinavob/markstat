from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..schemas import AuthResponse, Token, UserCreate, UserLogin, UserRead
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _build_auth_response(user: User) -> AuthResponse:
	token = create_access_token(subject=str(user.id), extra_claims={"email": user.email})
	return AuthResponse(
		user=UserRead.model_validate(user),
		token=Token(access_token=token),
	)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: UserCreate, db: Session = Depends(get_db)) -> AuthResponse:
	existing_user = db.scalar(select(User).where(User.email == payload.email))
	if existing_user is not None:
		raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

	user = User(
		full_name=payload.full_name.strip(),
		email=payload.email.lower(),
		password_hash=hash_password(payload.password),
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return _build_auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login_user(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
	user = db.scalar(select(User).where(User.email == payload.email.lower()))
	if user is None or not verify_password(payload.password, user.password_hash):
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

	return _build_auth_response(user)
