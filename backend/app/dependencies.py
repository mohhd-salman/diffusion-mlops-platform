from collections.abc import Generator
from sqlalchemy.orm import Session

from app.config import SessionLocal

def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a SQLAlchemy DB session.
    Ensures the session is closed after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
