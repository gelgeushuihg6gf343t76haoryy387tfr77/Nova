import logging

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.deps import get_db
from app.models import User
from app.schemas.auth import ClerkLoginRequest, ForgotPasswordRequest, LoginRequest, RegisterRequest, ResetPasswordRequest, ResetWithCodeRequest, SendResetCodeRequest, TokenResponse, UserMe
from app.schemas.common import MessageResponse
from app.core.security import create_access_token
from app.services.auth_service import create_password_reset_link, generate_reset_code, login_user, register_user, reset_password_with_code, reset_user_password, verify_email_token
from app.services.email_service import send_password_reset_code_email, send_verification_email

logger = logging.getLogger("nova")

router = APIRouter()


@router.post("/register", response_model=UserMe)
@limiter.limit("10/minute")
def register(request: Request, payload: RegisterRequest, db: Session = Depends(get_db)) -> UserMe:
    user, verify_token = register_user(db, payload)
    if verify_token:
        verify_link = f"{settings.app_base_url}/verify-email?token={verify_token}"
        sent = send_verification_email(user.email, verify_link)
        if settings.app_env == "development":
            logger.warning("DEV MODE: Verification link for %s: %s", user.email, verify_link)
    return UserMe.model_validate(user)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    token = login_user(db, payload)
    return TokenResponse(access_token=token)


@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    link = create_password_reset_link(db, payload.email)
    msg = "If this email exists, a reset link was sent. Check your email."
    if settings.app_env == "development" and link:
        msg = f"DEV MODE: Reset link: {link}"
        logger.warning("password_reset_dev_link %s", link)
    return {"message": msg}


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    ok = reset_user_password(db, payload.token, payload.password)
    if not ok:
        return {"success": False, "message": "Invalid or expired reset token."}
    return {"success": True, "message": "Password has been reset. You can now log in."}


@router.post("/send-reset-code")
@limiter.limit("3/minute")
def send_reset_code(request: Request, payload: SendResetCodeRequest, db: Session = Depends(get_db)):
    code = generate_reset_code(db, payload.email)
    if code:
        sent = send_password_reset_code_email(payload.email.strip().lower(), code)
        if not sent and settings.app_env == "development":
            logger.warning("DEV MODE: Reset code for %s: %s", payload.email, code)
    msg = "If this email exists, a reset code was sent. Check your email."
    if settings.app_env == "development" and code:
        msg = f"DEV MODE: Reset code: {code}"
        logger.warning("password_reset_code_dev_link code=%s email=%s", code, payload.email)
    return {"message": msg}


@router.post("/reset-with-code")
@limiter.limit("5/minute")
def reset_with_code(request: Request, payload: ResetWithCodeRequest, db: Session = Depends(get_db)):
    ok = reset_password_with_code(db, payload.code, payload.email, payload.password)
    if not ok:
        return {"success": False, "message": "Invalid or expired reset code."}
    return {"success": True, "message": "Password has been reset. You can now log in."}


@router.post("/clerk-login")
@limiter.limit("10/minute")
def clerk_login(request: Request, payload: ClerkLoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower() if payload.email else None
    if not email:
        return {"success": False, "message": "Email is required."}

    user = db.scalar(select(User).where(User.email == email))

    # Auto-create user if they don't exist yet (first Clerk sign-in)
    if not user:
        user = User(email=email, password_hash="", full_name=email.split("@")[0])
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(str(user.id))
    return {"access_token": token}


@router.get("/verify-email")
@limiter.limit("10/minute")
def verify_email(request: Request, token: str, db: Session = Depends(get_db)):
    user_id = verify_email_token(db, token)
    if not user_id:
        return {"success": False, "message": "Invalid or expired verification link."}
    return {"success": True, "message": "Email verified. You can now sign in."}


@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    normalized_email = payload.email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))
    if not user:
        return {"message": "If this email exists, a verification link was sent."}
    if user.is_verified:
        return {"message": "This email is already verified. You can sign in."}

    import secrets
    from datetime import UTC, datetime, timedelta
    from app.models import PasswordResetToken
    verify_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(hours=24)
    db.add(PasswordResetToken(
        email=normalized_email,
        token=verify_token,
        token_type="verify",
        expires_at=expires_at,
    ))
    db.commit()
    verify_link = f"{settings.app_base_url}/verify-email?token={verify_token}"
    send_verification_email(normalized_email, verify_link)
    return {"message": "If this email exists, a verification link was sent."}


@router.get("/me", response_model=UserMe)
@limiter.limit("30/minute")
def me(request: Request, current_user: User = Depends(get_current_user)) -> UserMe:
    return UserMe.model_validate(current_user)
