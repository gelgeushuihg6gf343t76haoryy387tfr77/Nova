"""Lightweight keyword → category name rules. Categories are created per business on first match."""

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Category, CategoryKind

# (lowercase substring, display name for new Category)
_INCOME_KEYWORD_RULES: tuple[tuple[str, str], ...] = (
    ("stripe", "Card payments"),
    ("paypal", "Online payments"),
    ("shopify", "E-commerce"),
    ("invoice", "Client invoices"),
    ("subscription", "Subscriptions"),
)

_EXPENSE_KEYWORD_RULES: tuple[tuple[str, str], ...] = (
    ("amazon", "Shopping"),
    ("uber", "Transport"),
    ("lyft", "Transport"),
    ("office", "Office"),
    ("software", "Software"),
    ("hosting", "Hosting"),
    ("ads", "Marketing"),
    ("marketing", "Marketing"),
    ("restaurant", "Meals"),
    ("coffee", "Meals"),
)


def _get_or_create_category(db: Session, business_id: uuid.UUID, kind: CategoryKind, name: str) -> uuid.UUID:
    existing = db.scalar(
        select(Category.id).where(
            Category.business_id == business_id,
            Category.kind == kind,
            Category.name == name,
        )
    )
    if existing:
        return existing
    row = Category(business_id=business_id, kind=kind, name=name)
    db.add(row)
    db.flush()
    return row.id


def resolve_category_id(
    db: Session,
    business_id: uuid.UUID,
    kind: CategoryKind,
    description: str | None,
    explicit_category_id: uuid.UUID | None,
) -> uuid.UUID | None:
    if explicit_category_id is not None:
        return explicit_category_id
    text = (description or "").lower()
    if not text.strip():
        return None
    rules = _INCOME_KEYWORD_RULES if kind == CategoryKind.income else _EXPENSE_KEYWORD_RULES
    for keyword, category_name in rules:
        if keyword in text:
            return _get_or_create_category(db, business_id, kind, category_name)
    return None


def income_text_for_match(source: str | None, notes: str | None) -> str:
    parts = [p for p in (source or "", notes or "") if p]
    return " ".join(parts)


def expense_text_for_match(vendor: str | None, notes: str | None) -> str:
    parts = [p for p in (vendor or "", notes or "") if p]
    return " ".join(parts)
