import json
import logging
import urllib.request

from app.core.config import settings

logger = logging.getLogger("nova")


def verify_clerk_token(token: str) -> dict | None:
    """Verify a Clerk session JWT using Clerk's JWKS endpoint."""
    if not settings.clerk_secret_key:
        logger.warning("CLERK_SECRET_KEY not set — skipping Clerk token verification")
        return None

    # Extract the Clerk frontend API from the secret key
    # Secret key format: sk_test_XXXXX or sk_live_XXXXX
    # We need the JWKS URL from Clerk's API
    jwks_url = "https://api.clerk.com/v1/jwks"
    headers = {
        "Authorization": f"Bearer {settings.clerk_secret_key}",
        "Content-Type": "application/json",
    }

    try:
        req = urllib.request.Request(jwks_url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            jwks = json.loads(resp.read().decode())
    except Exception as e:
        logger.error("Failed to fetch Clerk JWKS: %s", e)
        return None

    # Decode and verify the JWT using the JWKS
    try:
        from jose import jwk, jwt
        from jose.constants import Algorithms

        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        rsa_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = key
                break

        if not rsa_key:
            logger.error("No matching JWK found for kid=%s", kid)
            return None

        public_key = jwk.RSAKey(rsa_key)

        payload = jwt.decode(
            token,
            public_key,
            algorithms=[Algorithms.RS256],
            audience=settings.clerk_jwt_audience or None,
            leeway=60,
        )
        return payload

    except Exception as e:
        logger.error("Clerk JWT verification failed: %s", e)
        return None


def verify_clerk_session(session_id: str) -> dict | None:
    """Verify a Clerk session using Clerk's REST API."""
    if not settings.clerk_secret_key:
        logger.warning("CLERK_SECRET_KEY not set")
        return None

    url = f"https://api.clerk.com/v1/sessions/{session_id}/verify"
    headers = {
        "Authorization": f"Bearer {settings.clerk_secret_key}",
        "Content-Type": "application/json",
    }

    try:
        req = urllib.request.Request(url, headers=headers, method="POST")
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        logger.error("Clerk session verification failed: %s", e)
        return None
