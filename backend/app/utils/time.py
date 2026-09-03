from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid4())


def require(condition: bool, message: str, code: int = status.HTTP_403_FORBIDDEN) -> None:
    if not condition:
        raise HTTPException(status_code=code, detail=message)


def public_error(detail: str, code: int = status.HTTP_400_BAD_REQUEST) -> HTTPException:
    return HTTPException(status_code=code, detail=detail)


def iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def as_dict(row: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for k, v in row.items():
        if isinstance(v, datetime):
            out[k] = iso(v)
        else:
            out[k] = v
    return out
