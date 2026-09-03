from __future__ import annotations

from fastapi.testclient import TestClient

from app.data import ids as I
from app.data.store import DEMO_PASSWORD, store
from app.main import app

client = TestClient(app)


def auth_header(email: str) -> dict:
    r = client.post("/api/auth/login", json={"email": email, "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_doctor_portal_dashboard():
    headers = auth_header("dr.sharma@carenav.demo")
    res = client.get("/api/doctor/dashboard", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "doctor" in data
    assert "stats" in data
    assert data["stats"]["today_appointments"] >= 1


def test_doctor_prescribe_and_patient_timeline_sync():
    doc_headers = auth_header("dr.sharma@carenav.demo")
    # Doctor signs a prescription
    rx_res = client.post(
        "/api/doctor/prescriptions",
        headers=doc_headers,
        json={
            "patient_id": I.PATIENT_ID,
            "appointment_id": I.APPT_TODAY,
            "medicines": [
                {
                    "name": "Atorvastatin Calcium",
                    "dosage": "20 mg",
                    "frequency": "Once daily",
                    "duration": "30 days",
                    "instructions": "Take at bedtime.",
                    "period": "night",
                }
            ],
            "notes": "Follow-up in 30 days with repeat lipid panel.",
            "signed": True,
        },
    )
    assert rx_res.status_code == 200
    rx_id = rx_res.json()["id"]

    # Check that patient immediately sees notification and timeline update
    pat_headers = auth_header("demo.patient@carenav.demo")
    timeline_res = client.get("/api/timeline", headers=pat_headers)
    assert timeline_res.status_code == 200
    events = timeline_res.json()
    assert any("Prescription Signed" in e["title"] for e in events)


def test_hospital_admin_operations():
    admin_headers = auth_header("admin.city@carenav.demo")
    dash = client.get("/api/hospital/dashboard", headers=admin_headers)
    assert dash.status_code == 200
    assert dash.json()["metrics"]["doctors_working"] >= 1

    # Add a doctor
    add_doc = client.post(
        "/api/hospital/doctors",
        headers=admin_headers,
        json={
            "full_name": "Dr. Sunil Varma",
            "specialty": "Cardiology",
            "qualifications": "MBBS, MD",
            "experience_years": 8,
            "languages": ["English", "Hindi"],
        },
    )
    assert add_doc.status_code == 200
    assert add_doc.json()["doctor"]["full_name"] == "Dr. Sunil Varma"

    # Hospital AI operational response
    ai_res = client.post(
        "/api/hospital/ai",
        headers=admin_headers,
        json={"message": "How many cardiology appointments are scheduled?"},
    )
    assert ai_res.status_code == 200
    assert "cardiology" in ai_res.json()["reply"].lower()
