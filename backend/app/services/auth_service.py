import random
import uuid
import logging
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.email_service import send_password_reset_code_email, send_password_reset_email

logger = logging.getLogger("business_clarity")

_RESET_TOKENS: dict[str, dict[str, str | datetime]] = {}
_RESET_CODES: dict[str, dict[str, str | datetime]] = {}


def verify_reset_token(token: str) -> str | None:
    entry = _RESET_TOKENS.get(token)
    if not entry:
        return None
    expires_at = entry["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if datetime.now(UTC) > expires_at:
        _RESET_TOKENS.pop(token, None)
        return None
    return str(entry["user_id"])


def reset_user_password(db: Session, token: str, new_password: str) -> bool:
    user_id_str = verify_reset_token(token)
    if not user_id_str:
        return False
    user = db.get(User, uuid.UUID(user_id_str))
    if not user:
        return False
    user.password_hash = hash_password(new_password)
    db.commit()
    _RESET_TOKENS.pop(token, None)
    return True


def generate_reset_code(db: Session, email: str) -> str | None:
    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user:
        return None

    code = f"{random.randint(0, 999999):06d}"
    expires_at = datetime.now(UTC) + timedelta(minutes=15)
    _RESET_CODES[code] = {"user_id": str(user.id), "email": normalized_email, "expires_at": expires_at}
    logger.info("reset_code_generated email=%s code=%s", normalized_email, code)
    return code


def verify_reset_code(code: str, email: str) -> str | None:
    entry = _RESET_CODES.get(code)
    if not entry:
        return None
    if entry["email"] != email.strip().lower():
        return None
    expires_at = entry["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if datetime.now(UTC) > expires_at:
        _RESET_CODES.pop(code, None)
        return None
    return str(entry["user_id"])


def reset_password_with_code(db: Session, code: str, email: str, new_password: str) -> bool:
    user_id_str = verify_reset_code(code, email)
    if not user_id_str:
        return False
    user = db.get(User, uuid.UUID(user_id_str))
    if not user:
        return False
    user.password_hash = hash_password(new_password)
    db.commit()
    _RESET_CODES.pop(code, None)
    return True


def register_user(db: Session, payload: RegisterRequest) -> User:
    normalized_email = payload.email.strip().lower()
    existing = db.scalar(select(User).where(User.email == normalized_email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=normalized_email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, payload: LoginRequest) -> str:
    normalized_email = payload.email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return create_access_token(str(user.id))


def create_password_reset_link(db: Session, email: str) -> str | None:
    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user:
        return None

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(minutes=30)
    _RESET_TOKENS[token] = {"user_id": str(user.id), "expires_at": expires_at}
    reset_link = f"{settings.app_base_url}/reset-password?token={token}"
    logger.info("password_reset_link email=%s link=%s", normalized_email, reset_link)

    sent = send_password_reset_email(normalized_email, reset_link)
    if not sent and settings.app_env == "development":
        logger.warning("DEV MODE: Reset link would be: %s", reset_link)

    return reset_link
