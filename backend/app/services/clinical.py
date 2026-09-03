from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status

from app.data.store import Store
from app.security.authz import Principal
from app.utils.time import iso, new_id, utcnow


def serialize_appointment(store: Store, appt: dict) -> dict:
    doctor = store.doctors[appt["doctor_id"]]
    hospital = store.hospitals[appt["hospital_id"]]
    dept = store.departments.get(appt.get("department_id") or "")
    return {
        **{k: iso(v) if isinstance(v, datetime) else v for k, v in appt.items()},
        "doctor": doctor,
        "hospital": hospital,
        "department": dept,
    }


def list_availability(store: Store, doctor_id: str, day: datetime) -> list[dict]:
    weekday = day.weekday()  # 0 Mon
    windows = [a for a in store.availability if a["doctor_id"] == doctor_id and a["weekday"] == weekday]
    slots = []
    for window in windows:
        sh, sm = map(int, window["start_time"].split(":"))
        eh, em = map(int, window["end_time"].split(":"))
        cursor = day.replace(hour=sh, minute=sm, second=0, microsecond=0)
        end = day.replace(hour=eh, minute=em, second=0, microsecond=0)
        step = timedelta(minutes=window["slot_minutes"])
        while cursor + step <= end:
            key = (doctor_id, iso(cursor))
            slots.append({"starts_at": iso(cursor), "ends_at": iso(cursor + step), "available": key not in store.booked_slots})
            cursor += step
    return slots


def create_appointment(
    store: Store,
    principal: Principal,
    doctor_id: str,
    starts_at: datetime,
    reason: str,
    document_ids: list[str],
    share_items: list[str],
    duration_label: str,
    confirmed: bool,
    family_member_id: str | None = None,
    patient_name: str | None = None,
) -> dict:
    if not confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You're about to book this appointment and share selected records. Continue?",
        )
    if principal.role != "PATIENT" or not principal.patient_id:
        raise HTTPException(status_code=403, detail="You don't have permission to view this record.")
    doctor = store.doctors.get(doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="That doctor could not be found.")
    ends_at = starts_at + timedelta(minutes=20)
    key = (doctor_id, iso(starts_at))
    if key in store.booked_slots:
        raise HTTPException(status_code=409, detail="That appointment slot is no longer available.")
    # also check existing
    for appt in store.appointments.values():
        if appt["doctor_id"] == doctor_id and iso(appt["starts_at"]) == iso(starts_at) and appt["status"] not in ("CANCELLED", "NO_SHOW"):
            raise HTTPException(status_code=409, detail="That appointment slot is no longer available.")
    
    # Check if booking for a family member
    fm = store.family_members.get(family_member_id) if family_member_id else None
    resolved_patient_name = fm["full_name"] if fm else (patient_name or (store.profiles.get(principal.user_id) or {}).get("full_name", "Arjun Mehta"))
    
    appt_id = new_id()
    store.appointments[appt_id] = {
        "id": appt_id,
        "patient_id": principal.patient_id,
        "family_member_id": family_member_id,
        "patient_name": resolved_patient_name,
        "relationship": fm["relationship"] if fm else "Self",
        "doctor_id": doctor_id,
        "hospital_id": doctor["hospital_id"],
        "department_id": doctor.get("department_id"),
        "starts_at": starts_at,
        "ends_at": ends_at,
        "status": "CONFIRMED",
        "reason": reason,
        "notes": f"Booked for {resolved_patient_name} ({fm['relationship'] if fm else 'Account Holder'})",
        "created_at": utcnow(),
    }
    store.booked_slots.add(key)
    for did in document_ids:
        doc = store.documents.get(did)
        if doc and doc["patient_id"] == principal.patient_id:
            store.appointment_documents.append((appt_id, did))
    expires = None
    if duration_label == "7 days":
        expires = utcnow() + timedelta(days=7)
    elif duration_label == "24 hours":
        expires = utcnow() + timedelta(hours=24)
    elif duration_label == "appointment only":
        expires = ends_at
    consent_id = new_id()
    store.consents[consent_id] = {
        "id": consent_id,
        "patient_id": principal.patient_id,
        "doctor_id": doctor_id,
        "appointment_id": appt_id,
        "status": "ACTIVE",
        "duration_label": duration_label,
        "starts_at": utcnow(),
        "expires_at": expires,
        "created_at": utcnow(),
    }
    for item in share_items:
        store.consent_items.append({"id": new_id(), "consent_id": consent_id, "item_type": item, "resource_id": None})
    store.add_timeline(principal.patient_id, "appointment_booked", "Appointment booked", "appointments", appt_id, "calendar")
    store.add_notification(
        principal.user_id,
        "appointment_booked",
        "Appointment booked",
        f"Your visit with {doctor['full_name']} is confirmed.",
        "appointment",
        appt_id,
    )
    if doctor.get("user_id"):
        store.add_notification(
            doctor["user_id"],
            "appointment_booked",
            "New appointment",
            "A patient booked a visit on your calendar.",
            "appointment",
            appt_id,
        )
    store.audit_event(principal.user_id, principal.role, "appointment.created", "appointment", appt_id, {"doctor_id": doctor_id})
    store.audit_event(principal.user_id, principal.role, "consent.granted", "consent", consent_id, {"doctor_id": doctor_id, "items": share_items})
    return serialize_appointment(store, store.appointments[appt_id]) | {"consent_id": consent_id}


def cancel_appointment(store: Store, principal: Principal, appt_id: str, confirmed: bool) -> dict:
    if not confirmed:
        raise HTTPException(400, detail="You're about to cancel this appointment. Continue?")
    appt = store.appointments.get(appt_id)
    if not appt:
        raise HTTPException(404, detail="That appointment could not be found.")
    if principal.role == "PATIENT" and appt["patient_id"] != principal.patient_id:
        raise HTTPException(403, detail="You don't have permission to view this record.")
    if principal.role == "DOCTOR" and appt["doctor_id"] != principal.doctor_id:
        raise HTTPException(403, detail="You don't have permission to view this record.")
    appt["status"] = "CANCELLED"
    store.booked_slots.discard((appt["doctor_id"], iso(appt["starts_at"])))
    store.audit_event(principal.user_id, principal.role, "appointment.cancelled", "appointment", appt_id, {})
    return serialize_appointment(store, appt)


def compare_reports(store: Store, report_a: str, report_b: str) -> dict[str, Any]:
    a = store.reports[report_a]
    b = store.reports[report_b]
    va = [v for v in store.report_values if v["report_id"] == report_a]
    vb = [v for v in store.report_values if v["report_id"] == report_b]
    rows = []
    by_name_b = {v["test_name"]: v for v in vb}
    for left in va:
        right = by_name_b.get(left["test_name"])
        if not right:
            continue
        if (left.get("unit") or "") != (right.get("unit") or ""):
            rows.append(
                {
                    "test": left["test_name"],
                    "previous": left["value"],
                    "current": right["value"],
                    "change": None,
                    "note": "Units differ — values were not compared.",
                    "previous_range": left.get("reference_range"),
                    "current_range": right.get("reference_range"),
                }
            )
            continue
        change = None
        try:
            change = float(right["value"]) - float(left["value"])
        except (TypeError, ValueError):
            change = None
        row = {
            "test": left["test_name"],
            "previous": left["value"],
            "current": right["value"],
            "change": change,
            "unit": left.get("unit"),
            "previous_range": left.get("reference_range"),
            "current_range": right.get("reference_range"),
        }
        if left.get("reference_range") != right.get("reference_range"):
            row["note"] = "Reference ranges differ; they are shown separately."
        rows.append(row)
    return {
        "report_a": a,
        "report_b": b,
        "rows": rows,
        "disclaimer": "Comparison of documented values only. This is not a diagnosis.",
    }


def demo_extract_lipid_panel() -> dict:
    return {
        "document_type": "Blood Test",
        "report_date": "2026-09-01",
        "hospital_or_lab": "Demo Diagnostics (fictional)",
        "doctor": "Dr. Ananya Sharma",
        "test_name": "Complete Blood Count",
        "values": [
            {"test_name": "Hemoglobin", "value": "13.8", "unit": "g/dL", "reference_range": "13.0-17.0", "confidence": 0.98},
            {"test_name": "WBC", "value": "7.0", "unit": "x10^9/L", "reference_range": "4.0-11.0", "confidence": 0.95},
            {"test_name": "Platelets", "value": "228", "unit": "x10^9/L", "reference_range": "150-400", "confidence": 0.94},
            {"test_name": "RBC", "value": "4.8", "unit": "x10^12/L", "reference_range": "4.5-5.5", "confidence": 0.9},
        ],
        "notes": "DEMO / SYNTHETIC DATA",
        "disclaimer": "AI-generated explanation — not a medical diagnosis.",
    }


def navigate_need(query: str) -> dict:
    q = query.lower()
    mapping = [
        (("knee", "joint", "bone", "ortho", "fracture"), "orthopedics", "An orthopedic service may be relevant for this type of concern."),
        (("eye", "vision", "ophthal"), "ophthalmology", "An ophthalmology (eye care) service may be relevant for this type of concern."),
        (("blood test", "lab", "diagnostic", "scan"), "diagnostics", "A diagnostics service may be relevant for laboratory or imaging needs."),
        (("child", "pediatric", "baby"), "pediatrics", "A pediatrics service may be relevant for this type of concern."),
        (("skin", "derma", "rash"), "dermatology", "A dermatology service may be relevant for this type of concern."),
        (("tooth", "dental", "gum"), "dental", "A dental service may be relevant for this type of concern."),
        (("neuro", "headache", "seizure", "stroke"), "neurology", "A neurology service may be relevant for this type of concern."),
        (("cancer", "oncol"), "oncology", "An oncology service may be relevant if you are seeking cancer-related care. This is not a diagnosis."),
        (("emergency", "urgent", "chest pain", "can't breathe"), "emergency", "If this may be life-threatening, contact emergency services. Nearby emergency facilities are shown on the map."),
        (("heart", "cardio", "cholesterol", "consult", "doctor", "specialist"), "cardiology", "A cardiology service may be relevant for this type of concern."),
    ]
    for keys, code, text in mapping:
        if any(k in q for k in keys):
            return {
                "category": code,
                "explanation": text,
                "href": f"/map?specialty={code}",
                "disclaimer": "This is a navigation suggestion, not a diagnosis.",
            }
    return {
        "category": "all",
        "explanation": "I can open the healthcare map so you can browse demo facilities. This is not a diagnosis.",
        "href": "/map",
        "disclaimer": "This is a navigation suggestion, not a diagnosis.",
    }
