from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_size=2,
    max_overflow=3,
    pool_recycle=300,
    pool_pre_ping=True,
    pool_use_lifo=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
