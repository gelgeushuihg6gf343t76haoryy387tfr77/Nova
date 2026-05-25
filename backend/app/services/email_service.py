import logging

import resend

from app.core.config import settings

logger = logging.getLogger("nova")


def send_password_reset_email(email: str, reset_link: str) -> bool:
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set — cannot send email. reset_link=%s", reset_link)
        return False

    resend.api_key = settings.resend_api_key

    from_email = settings.email_from_address or "noreply@novabookkeeping.com"

    try:
        response = resend.Emails.send({
            "from": from_email,
            "to": [email],
            "subject": "Nova — Password Reset Link",
            "html": f"""
<p>You requested a password reset.</p>
<p>Click the link below to reset your password. This link expires in 30 minutes.</p>
<p><a href="{reset_link}">{reset_link}</a></p>
<p>If you did not request this, you can safely ignore this email.</p>
<p>— Nova</p>
""",
        })
        logger.info("password_reset_email_sent email=%s resend_id=%s", email, response.get("id"))
        return True
    except Exception as e:
        logger.error("password_reset_email_failed email=%s error=%s", email, e)
        return False


def send_verification_email(email: str, verify_link: str) -> bool:
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set — cannot send verification email. link=%s", verify_link)
        return False

    resend.api_key = settings.resend_api_key
    from_email = settings.email_from_address or "noreply@novabookkeeping.com"

    try:
        response = resend.Emails.send({
            "from": from_email,
            "to": [email],
            "subject": "Nova — Verify your email",
            "html": f"""
<p>Thanks for signing up for Nova!</p>
<p>Click the link below to verify your email address. This link expires in 24 hours.</p>
<p><a href="{verify_link}">{verify_link}</a></p>
<p>If you did not create an account, you can safely ignore this email.</p>
<p>— Nova</p>
""",
        })
        logger.info("verification_email_sent email=%s resend_id=%s", email, response.get("id"))
        return True
    except Exception as e:
        logger.error("verification_email_failed email=%s error=%s", email, e)
        return False


def send_password_reset_code_email(email: str, code: str) -> bool:
    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY not set — cannot send reset code")
        return False

    resend.api_key = settings.resend_api_key
    from_email = settings.email_from_address or "noreply@novabookkeeping.com"

    try:
        response = resend.Emails.send({
            "from": from_email,
            "to": [email],
            "subject": "Nova — Your Password Reset Code",
            "html": f"""
<p>You requested a password reset code.</p>
<p>Your verification code is:</p>
<p style="font-size: 28px; letter-spacing: 6px; font-weight: bold; text-align: center; margin: 24px 0;">{code}</p>
<p>This code expires in 15 minutes.</p>
<p>If you did not request this, you can safely ignore this email.</p>
<p>— Nova</p>
""",
        })
        logger.info("password_reset_code_sent email=%s resend_id=%s", email, response.get("id"))
        return True
    except Exception as e:
        logger.error("password_reset_code_failed email=%s error=%s", email, e)
        return False
