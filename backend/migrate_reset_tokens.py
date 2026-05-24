import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from sqlalchemy import create_engine, text

engine = create_engine(settings.database_url)

with engine.connect() as conn:
    conn.execute(text("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL,
            token VARCHAR(255) NOT NULL,
            token_type VARCHAR(10) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            used BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_pwd_reset_email ON password_reset_tokens (email);"))
    conn.execute(text("CREATE INDEX IF NOT EXISTS idx_pwd_reset_token ON password_reset_tokens (token);"))
    conn.commit()

print("Migration complete: password_reset_tokens table created.")
