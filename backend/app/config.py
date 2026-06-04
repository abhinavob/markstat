from __future__ import annotations

import os
from dotenv import load_dotenv
from functools import lru_cache

load_dotenv()

class Settings:
	def __init__(self) -> None:
		self.app_name = os.getenv("APP_NAME", "MarkStat")
		self.database_url = self._build_database_url()
		self.sqlalchemy_echo = self._get_bool("SQLALCHEMY_ECHO", default=False)
		self.sqlalchemy_pool_pre_ping = self._get_bool("SQLALCHEMY_POOL_PRE_PING", default=True)
		self.jwt_secret_key = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
		self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
		self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

	def _build_database_url(self) -> str:
		database_url = os.getenv("DATABASE_URL")
		if database_url:
			return self._normalize_database_url(database_url)

		host = os.getenv("POSTGRES_HOST", "localhost")
		port = os.getenv("POSTGRES_PORT", "5432")
		database = os.getenv("POSTGRES_DB", "markstat")
		user = os.getenv("POSTGRES_USER", "postgres")
		password = os.getenv("POSTGRES_PASSWORD", "postgres")
		return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"

	@staticmethod
	def _normalize_database_url(database_url: str) -> str:
		if database_url.startswith("postgres://"):
			return "postgresql+psycopg2://" + database_url.removeprefix("postgres://")
		if database_url.startswith("postgresql://"):
			return "postgresql+psycopg2://" + database_url.removeprefix("postgresql://")
		return database_url

	@staticmethod
	def _get_bool(name: str, default: bool) -> bool:
		value = os.getenv(name)
		if value is None:
			return default
		return value.strip().lower() in {"1", "true", "yes", "on"}


@lru_cache(maxsize=1)
def get_settings() -> Settings:
	return Settings()
