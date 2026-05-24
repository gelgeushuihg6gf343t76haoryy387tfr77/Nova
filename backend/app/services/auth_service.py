import secrets
import logging
from datetime import UTC, datetime, timedelta
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models import PasswordResetToken, User
from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.email_service import send_password_reset_code_email, send_password_reset_email

logger = logging.getLogger("nova")


def register_user(db: Session, payload: RegisterRequest) -> User:
    normalized_email = payload.email.strip().lower()
    existing = db.scalar(select(User).where(User.email == normalized_email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=normalized_email,
        username=payload.username,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, payload: LoginRequest) -> str:
    identifier = payload.identifier.strip().lower()
    user = db.scalar(select(User).where(User.email == identifier))
    if not user:
        user = db.scalar(select(User).where(User.username == identifier))
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
    db.add(PasswordResetToken(
        email=normalized_email,
        token=token,
        token_type="link",
        expires_at=expires_at,
    ))
    db.commit()
    reset_link = f"{settings.app_base_url}/reset-password?token={token}"
    logger.info("password_reset_link email=%s link=%s", normalized_email, reset_link)

    sent = send_password_reset_email(normalized_email, reset_link)
    if not sent and settings.app_env == "development":
        logger.warning("DEV MODE: Reset link would be: %s", reset_link)

    return reset_link


def verify_reset_token(db: Session, token: str) -> str | None:
    row = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token == token,
            PasswordResetToken.token_type == "link",
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.now(UTC),
        )
    )
    if not row:
        return None
    row.used = True
    db.commit()
    user = db.scalar(select(User).where(User.email == row.email))
    if not user:
        return None
    return str(user.id)


def reset_user_password(db: Session, token: str, new_password: str) -> bool:
    user_id_str = verify_reset_token(db, token)
    if not user_id_str:
        return False
    user = db.get(User, uuid.UUID(user_id_str))
    if not user:
        return False
    user.password_hash = hash_password(new_password)
    db.commit()
    return True


def generate_reset_code(db: Session, email: str) -> str | None:
    normalized_email = email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user:
        return None

    code = f"{secrets.randbelow(1000000):06d}"
    expires_at = datetime.now(UTC) + timedelta(minutes=15)
    db.add(PasswordResetToken(
        email=normalized_email,
        token=code,
        token_type="code",
        expires_at=expires_at,
    ))
    db.commit()
    logger.info("reset_code_generated email=%s code=%s", normalized_email, code)
    return code


def verify_reset_code(db: Session, code: str, email: str) -> str | None:
    normalized_email = email.strip().lower()
    row = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token == code,
            PasswordResetToken.token_type == "code",
            PasswordResetToken.email == normalized_email,
            PasswordResetToken.used == False,
            PasswordResetToken.expires_at > datetime.now(UTC),
        )
    )
    if not row:
        return None
    row.used = True
    db.commit()
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user:
        return None
    return str(user.id)


def reset_password_with_code(db: Session, code: str, email: str, new_password: str) -> bool:
    user_id_str = verify_reset_code(db, code, email)
    if not user_id_str:
        return False
    user = db.get(User, uuid.UUID(user_id_str))
    if not user:
        return False
    user.password_hash = hash_password(new_password)
    db.commit()
    return True
