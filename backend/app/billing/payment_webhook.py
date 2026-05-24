import hashlib
import hmac

from app.core.config import settings


def verify_payment_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
    secret = (settings.payment_webhook_secret or "").strip()
    if not secret:
        return False
    if not signature_header:
        return False
    digest = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature_header.strip())
