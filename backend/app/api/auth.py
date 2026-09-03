from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from app.api.deps import get_principal, get_store
from app.data.store import DEMO_PASSWORD, Store
from app.schemas.api import LoginRequest, RegisterRequest, ForgotPasswordRequest
from app.security.authz import Principal
from app.security.passwords import hash_password, verify_password
from app.security.tokens import create_access_token
from app.utils.time import new_id, utcnow

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(body: LoginRequest, response: Response, store: Store = Depends(get_store)):
    user = store.user_by_email(body.email)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    token = create_access_token(user["id"], user["role"], user["email"])
    response.set_cookie("carenav_token", token, httponly=True, samesite="lax", max_age=60 * 60 * 12)
    profile = store.profiles[user["id"]]
    return {"access_token": token, "token_type": "bearer", "user": {**{k: v for k, v in user.items() if k != "password_hash"}, "profile": profile}}


@router.post("/register")
def register(body: RegisterRequest, response: Response, store: Store = Depends(get_store)):
    if store.user_by_email(body.email):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    uid = new_id()
    store.users[uid] = {
        "id": uid,
        "email": body.email.lower(),
        "role": "PATIENT",
        "password_hash": hash_password(body.password),
        "is_active": True,
    }
    store.profiles[uid] = {
        "id": new_id(),
        "user_id": uid,
        "full_name": body.full_name,
        "date_of_birth": body.date_of_birth,
        "phone": body.phone,
        "preferred_language": body.preferred_language or "en",
        "accessibility_preferences": {},
    }
    pid = new_id()
    store.patients[pid] = {"id": pid, "user_id": uid, "emergency_contact_name": None, "emergency_contact_phone": None}
    store.audit_event(uid, "PATIENT", "auth.register", "user", uid, {})
    token = create_access_token(uid, "PATIENT", body.email.lower())
    response.set_cookie("carenav_token", token, httponly=True, samesite="lax")
    return {"access_token": token, "token_type": "bearer", "user": {"id": uid, "email": body.email.lower(), "role": "PATIENT"}}


@router.post("/logout")
def logout(response: Response, principal: Principal = Depends(get_principal)):
    response.delete_cookie("carenav_token")
    return {"ok": True}


@router.get("/demo-accounts")
def demo_accounts():
    return {
        "notice": "SYNTHETIC PATIENT DATA ONLY. Fictional demo accounts.",
        "password": DEMO_PASSWORD,
        "accounts": [
            {"role": "PATIENT", "email": "demo.patient@carenav.demo", "name": "Arjun Mehta (Demo Patient)"},
            {"role": "DOCTOR", "email": "dr.sharma@carenav.demo", "name": "Dr. Ananya Sharma"},
            {"role": "HOSPITAL_ADMIN", "email": "admin.city@carenav.demo", "name": "Kiran Mehta"},
            {"role": "PATIENT", "email": "patient.b@carenav.demo", "name": "Rohan Iyer (isolation tests)"},
        ],
    }


class PasswordCheck(BaseModel):
    unused: str | None = None


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest, store: Store = Depends(get_store)):
    store.user_by_email(body.email)
    return {"ok": True, "message": "If an account exists, we sent a reset link. In demo mode, use the demo password."}


@router.get("/me")
def me(principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    user = store.user(principal.user_id)
    return {
        "user": {k: v for k, v in user.items() if k != "password_hash"},
        "profile": store.profiles.get(principal.user_id),
        "patient_id": principal.patient_id,
        "doctor_id": principal.doctor_id,
        "hospital_id": principal.hospital_id,
    }
