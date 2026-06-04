from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


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


class UploadAnalysisResponse(BaseModel):
	exam_id: int
	filename: str
	file_type: str
	sheet_names: list[str] = Field(default_factory=list)
	columns: list[str] = Field(default_factory=list)
	preview_rows: list[dict[str, Any]] = Field(default_factory=list)
	selected_source: str | None = None


class ColumnMappingRequest(BaseModel):
	sheet_name: str | None = Field(default=None, max_length=255)
	student_id_column: str = Field(min_length=1, max_length=255)
	student_name_column: str | None = Field(default=None, max_length=255)
	score_columns: list[str] = Field(min_length=1)
	total_column: str | None = Field(default=None, max_length=255)

	@model_validator(mode="after")
	def validate_mapping(self) -> "ColumnMappingRequest":
		if len(set(self.score_columns)) != len(self.score_columns):
			raise ValueError("score_columns must not contain duplicates")
		if self.total_column and self.total_column in self.score_columns:
			raise ValueError("total_column must not be included in score_columns")
		return self


class ImportResultResponse(BaseModel):
	exam_id: int
	imported_count: int
	skipped_count: int
	total_rows: int
