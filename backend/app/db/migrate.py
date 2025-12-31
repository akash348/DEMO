from sqlalchemy import inspect, text

from app.db.base import Base
from app.db.session import engine
from app import models  # noqa: F401


def _table_columns(table_name: str) -> list[str]:
    inspector = inspect(engine)
    if table_name not in inspector.get_table_names():
        return []
    return [col["name"] for col in inspector.get_columns(table_name)]


def _add_column(table_name: str, column_def: str) -> None:
    with engine.begin() as conn:
        conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_def}"))


def migrate() -> None:
    Base.metadata.create_all(bind=engine)

    course_cols = _table_columns("courses")
    if "trade_id" not in course_cols:
        _add_column("courses", "trade_id INTEGER")

    student_cols = _table_columns("students")
    if "enrollment_no" not in student_cols:
        _add_column("students", "enrollment_no VARCHAR(50)")
    if "father_name" not in student_cols:
        _add_column("students", "father_name VARCHAR(120)")
    if "dob" not in student_cols:
        _add_column("students", "dob DATE")
    if "photo_url" not in student_cols:
        _add_column("students", "photo_url VARCHAR(255)")
    if "login_password_hash" not in student_cols:
        _add_column("students", "login_password_hash VARCHAR(255)")
    if "login_enabled" not in student_cols:
        _add_column("students", "login_enabled BOOLEAN DEFAULT 0")

    certificate_cols = _table_columns("certificates")
    if "grade" not in certificate_cols:
        _add_column("certificates", "grade VARCHAR(50)")
    if "percentage" not in certificate_cols:
        _add_column("certificates", "percentage NUMERIC(6, 2)")


if __name__ == "__main__":
    migrate()
