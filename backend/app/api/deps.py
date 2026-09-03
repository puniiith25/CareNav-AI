from fastapi import Cookie, Depends, Header, HTTPException, status

from app.data.store import store
from app.security.authz import Principal
from app.security.tokens import decode_token


def get_store():
    return store


def get_principal(
    authorization: str | None = Header(default=None),
    carenav_token: str | None = Cookie(default=None),
) -> Principal:
    token = None
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    elif carenav_token:
        token = carenav_token
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please sign in.")
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session is no longer valid.")
    uid = payload["sub"]
    user = store.user(uid)
    if not user or not user["is_active"]:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Please sign in.")
    patient = store.patient_for_user(uid)
    doctor = store.doctor_for_user(uid)
    return Principal(
        user_id=uid,
        role=user["role"],
        email=user["email"],
        patient_id=patient["id"] if patient else None,
        doctor_id=doctor["id"] if doctor else None,
        hospital_id=store.admin_hospital(uid),
    )


def require_roles(*roles: str):
    def _inner(principal: Principal = Depends(get_principal)) -> Principal:
        if principal.role not in roles and principal.role != "SYSTEM_ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to view this record.")
        return principal

    return _inner
