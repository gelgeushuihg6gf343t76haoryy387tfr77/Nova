import hmac
import hashlib
from typing import Any

import requests

from app.core.config import settings

BASE_API_URL = "https://api.lemonsqueezy.com/v1"


def _headers() -> dict[str, str]:
    return {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": f"Bearer {settings.lemonsqueezy_api_key}",
    }


def create_checkout_url(plan: str, user_email: str, user_id: str) -> str:
    variant_id = settings.lemonsqueezy_starter_variant_id if plan == "starter" else settings.lemonsqueezy_pro_variant_id
    if plan not in {"starter", "pro"} or not variant_id:
        raise ValueError("Invalid or unconfigured plan")

    payload: dict[str, Any] = {
        "data": {
            "type": "checkouts",
            "attributes": {
                "checkout_data": {
                    "email": user_email,
                    "custom": {
                        "user_id": user_id,
                        "plan": plan,
                    },
                },
                "checkout_options": {
                    "embed": False,
                    "media": False,
                    "logo": True,
                },
                "product_options": {
                    "enabled_variants": [int(variant_id)],
                    "redirect_url": f"{settings.app_base_url}/billing/success",
                    "receipt_button_text": "Return to app",
                    "receipt_link_url": f"{settings.app_base_url}/",
                },
            },
            "relationships": {
                "store": {"data": {"type": "stores", "id": settings.lemonsqueezy_store_id}},
                "variant": {"data": {"type": "variants", "id": str(variant_id)}},
            },
        }
    }

    response = requests.post(f"{BASE_API_URL}/checkouts", json=payload, headers=_headers(), timeout=20)
    response.raise_for_status()
    data = response.json()
    return data["data"]["attributes"]["url"]


def verify_webhook_signature(raw_body: bytes, signature: str) -> bool:
    digest = hmac.new(settings.lemonsqueezy_webhook_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature)
