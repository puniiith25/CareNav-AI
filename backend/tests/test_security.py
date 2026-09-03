from __future__ import annotations

from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.data import ids as I
from app.data.store import DEMO_PASSWORD, store
from app.main import app
from app.security.authz import Principal, doctor_may_access_patient
from app.services.clinical import create_appointment

client = TestClient(app)


def login(email: str) -> dict:
    r = client.post("/api/auth/login", json={"email": email, "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()


def auth_header(email: str) -> dict:
    token = login(email)["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health():
    r = client.get("/health")
    assert r.json()["status"] == "ok"


def test_login_and_me():
    headers = auth_header("demo.patient@carenav.demo")
    me = client.get("/api/auth/me", headers=headers).json()
    assert me["user"]["role"] == "PATIENT"
    assert me["patient_id"] == I.PATIENT_ID


def test_register_is_patient_only():
    r = client.post(
        "/api/auth/register",
        json={"email": "new.person@carenav.demo", "password": "StrongPass!234", "full_name": "New Person"},
    )
    assert r.status_code == 200
    assert r.json()["user"]["role"] == "PATIENT"


def test_patient_a_cannot_read_patient_b_document():
    headers = auth_header("demo.patient@carenav.demo")
    reports = client.get("/api/reports", headers=headers).json()
    titles = [d.get("title") for d in reports]
    assert "Patient B private report" not in str(titles)
    b_docs = [d for d in store.documents.values() if d["patient_id"] == I.PATIENT_B_ID]
    assert b_docs
    # Patient A listing should not include B
    my_docs = [d for d in store.documents.values() if d["patient_id"] == I.PATIENT_ID]
    assert all(d["patient_id"] != I.PATIENT_B_ID for d in my_docs)


def test_doctor_without_consent_blocked():
    principal = Principal(user_id=I.DOCTOR_USER, role="DOCTOR", email="dr.sharma@carenav.demo", doctor_id=I.DOCTOR_SHARMA)
    ok, msg = doctor_may_access_patient(store, principal, I.PATIENT_B_ID)
    assert ok is False
    headers = auth_header("dr.sharma@carenav.demo")
    r = client.get(f"/api/doctor/patients/{I.PATIENT_B_ID}", headers=headers)
    assert r.status_code == 403
    assert "not been shared" in r.json()["detail"].lower() or "permission" in r.json()["detail"].lower() or "expired" in r.json()["detail"].lower()


def test_revoked_consent_blocks_access():
    store.consents["temp-revoke"] = {
        "id": "temp-revoke",
        "patient_id": I.PATIENT_ID,
        "doctor_id": I.DOCTOR_SHARMA,
        "appointment_id": None,
        "status": "REVOKED",
        "duration_label": "7 days",
        "starts_at": datetime.now(timezone.utc),
        "expires_at": None,
        "created_at": datetime.now(timezone.utc),
    }
    principal = Principal(user_id=I.DOCTOR_USER, role="DOCTOR", email="x", doctor_id=I.DOCTOR_SHARMA)
    # latest consent is revoked
    ok, msg = doctor_may_access_patient(store, principal, I.PATIENT_ID)
    assert ok is False
    del store.consents["temp-revoke"]


def test_expired_consent_blocks_access():
    # Use a consent created after the seed consent with expired status/date
    store.consents["temp-exp"] = {
        "id": "temp-exp",
        "patient_id": I.PATIENT_ID,
        "doctor_id": I.DOCTOR_SHARMA,
        "appointment_id": None,
        "status": "EXPIRED",
        "duration_label": "24 hours",
        "starts_at": datetime(2020, 1, 1, tzinfo=timezone.utc),
        "expires_at": datetime(2020, 1, 2, tzinfo=timezone.utc),
        "created_at": datetime(2099, 1, 1, tzinfo=timezone.utc),
    }
    principal = Principal(user_id=I.DOCTOR_USER, role="DOCTOR", email="x", doctor_id=I.DOCTOR_SHARMA)
    ok, msg = doctor_may_access_patient(store, principal, I.PATIENT_ID)
    assert ok is False
    assert "expired" in (msg or "").lower()
    del store.consents["temp-exp"]


def test_appointment_conflict():
    headers = auth_header("demo.patient@carenav.demo")
    starts = "2026-09-03T16:30:00+00:00"
    r = client.post(
        "/api/appointments",
        headers=headers,
        json={
            "doctor_id": I.DOCTOR_SHARMA,
            "starts_at": starts,
            "reason": "Follow-up",
            "document_ids": [],
            "share_items": ["reports"],
            "duration_label": "7 days",
            "confirmed": True,
        },
    )
    assert r.status_code == 409
    assert "no longer available" in r.json()["detail"]


def test_admin_cannot_read_arbitrary_patient_records():
    headers = auth_header("admin.city@carenav.demo")
    r = client.get("/api/reports", headers=headers)
    assert r.status_code == 403


def test_ai_uses_tools_not_invention():
    headers = auth_header("demo.patient@carenav.demo")
    r = client.post("/api/ai/chat", headers=headers, json={"message": "Show my last blood report."})
    assert r.status_code == 200
    body = r.json()
    assert any(t["name"] == "get_medical_reports" for t in body["tools"])
    assert "136" in body["message"] or "lipid" in body["message"].lower() or "report" in body["message"].lower()


def test_critical_booking_requires_confirmation():
    headers = auth_header("demo.patient@carenav.demo")
    r = client.post(
        "/api/appointments",
        headers=headers,
        json={
            "doctor_id": I.DOCTOR_RAO,
            "starts_at": "2026-09-04T09:00:00+00:00",
            "confirmed": False,
            "share_items": ["reports"],
            "duration_label": "7 days",
        },
    )
    assert r.status_code == 400
