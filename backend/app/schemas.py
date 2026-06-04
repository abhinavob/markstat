from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
	full_name: str = Field(min_length=1, max_length=255)
	email: EmailStr


class UserCreate(UserBase):
	password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
	email: EmailStr
	password: str = Field(min_length=1, max_length=128)


class UserRead(UserBase):
	id: int
	created_at: datetime

	model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"


class AuthResponse(BaseModel):
	user: UserRead
	token: Token
