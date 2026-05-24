import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.database_url)

with engine.connect() as conn:
    conn.execute(text("ALTER TABLE income ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3) NOT NULL DEFAULT 'USD';"))
    conn.execute(text("ALTER TABLE income ADD COLUMN IF NOT EXISTS converted_amount_cents INTEGER;"))
    conn.execute(text("ALTER TABLE income ADD COLUMN IF NOT EXISTS conversion_rate FLOAT;"))
    conn.execute(text("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS original_currency VARCHAR(3) NOT NULL DEFAULT 'USD';"))
    conn.execute(text("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS converted_amount_cents INTEGER;"))
    conn.execute(text("ALTER TABLE expenses ADD COLUMN IF NOT EXISTS conversion_rate FLOAT;"))
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS exchange_rates (
            id SERIAL PRIMARY KEY,
            from_currency VARCHAR(3) NOT NULL,
            to_currency VARCHAR(3) NOT NULL,
            rate FLOAT NOT NULL,
            rate_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """))
    conn.execute(text("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_rate_currency_date
        ON exchange_rates (from_currency, to_currency, rate_date);
    """))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_exchange_rates_from ON exchange_rates (from_currency);"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_exchange_rates_to ON exchange_rates (to_currency);"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates (rate_date);"))
    conn.commit()

print("Migration complete.")
