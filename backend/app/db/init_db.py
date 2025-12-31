from app import models  # noqa: F401
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.trade import Trade


def _seed_trades() -> None:
    defaults = [
        ("Technical", "Technical trade courses"),
        ("Computer", "Computer-related courses"),
    ]
    db = SessionLocal()
    try:
        for name, description in defaults:
            exists = db.query(Trade).filter(Trade.name == name).first()
            if not exists:
                db.add(Trade(name=name, description=description, is_active=True))
        db.commit()
    finally:
        db.close()


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _seed_trades()
