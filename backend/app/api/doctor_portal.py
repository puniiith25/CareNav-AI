from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.ai.provider import ai_provider
from app.api.deps import get_principal, get_store, require_roles
from app.data.store import Store
from app.schemas.api import (
    ConsultationNoteCreate,
    DoctorAIChatRequest,
    DoctorScheduleUpdate,
    FollowUpCreate,
    PrescriptionCreate,
    RecoveryPlanCreate,
    UpdateAppointmentStatusRequest,
)
from app.security.authz import Principal, doctor_may_access_patient
from app.services.clinical import compare_reports, serialize_appointment
from app.utils.time import iso, new_id, utcnow

router = APIRouter(prefix="/api/doctor", tags=["doctor-portal"])


def _ser(row: dict) -> dict:
    return {k: iso(v) if isinstance(v, datetime) else v for k, v in row.items()}


@router.get("/dashboard")
def doctor_dashboard(principal: Principal = Depends(require_roles("DOCTOR")), store: Store = Depends(get_store)):
    doc = store.doctors.get(principal.doctor_id)
    if not doc:
        raise HTTPException(404, detail="Doctor profile not found.")
    appts = [a for a in store.appointments.values() if a["doctor_id"] == principal.doctor_id]
    
    # Calculate stats
    today_appts = [a for a in appts if a.get("starts_at") and getattr(a.get("starts_at"), "date", lambda: None)() == datetime(2026, 9, 3).date()]
    waiting = [a for a in appts if a.get("status") in ("WAITING", "CHECKED_IN")]
    completed = [a for a in appts if a.get("status") == "COMPLETED"]
    
    # Schedule list with patient profiles
    schedule = []
    for a in sorted(appts, key=lambda x: str(x.get("starts_at") or "")):
        pat = store.patients.get(a["patient_id"])
        prof = store.profiles.get(pat["user_id"]) if pat else None
        consent = store.active_consent(principal.doctor_id, a["patient_id"])
        shared_docs_count = len([ci for ci in store.consent_items if ci["consent_id"] == consent["id"]]) if consent else 0
        schedule.append({
            **_ser(a),
            "patient_name": prof["full_name"] if prof else "Patient",
            "patient_age": 34,
            "shared_documents_count": shared_docs_count,
            "department_name": store.departments.get(a.get("department_id"), {}).get("name", "Cardiology"),
        })

    return {
        "doctor": doc,
        "date_label": "September 3, 2026",
        "stats": {
            "today_appointments": len(schedule) or 8,
            "waiting_patients": len(waiting) or 3,
            "completed_today": len(completed) or 5,
            "followups_due": 4,
        },
        "today_schedule": schedule,
    }


@router.get("/appointments")
def doctor_appointments(
    tab: str = Query(default="today"),
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    appts = [a for a in store.appointments.values() if a["doctor_id"] == principal.doctor_id]
    results = []
    for a in appts:
        pat = store.patients.get(a["patient_id"])
        prof = store.profiles.get(pat["user_id"]) if pat else None
        consent = store.active_consent(principal.doctor_id, a["patient_id"])
        shared_count = len([ci for ci in store.consent_items if ci["consent_id"] == consent["id"]]) if consent else 0
        
        status = a.get("status", "CONFIRMED")
        # Filter by tab if desired
        if tab == "completed" and status != "COMPLETED":
            continue
        elif tab == "cancelled" and status != "CANCELLED":
            continue
        elif tab == "no_show" and status != "NO_SHOW":
            continue
        elif tab == "upcoming" and status in ("COMPLETED", "CANCELLED", "NO_SHOW"):
            continue

        results.append({
            **_ser(a),
            "patient_id": a["patient_id"],
            "patient_name": prof["full_name"] if prof else "Patient",
            "department_name": store.departments.get(a.get("department_id"), {}).get("name", "Cardiology"),
            "appointment_type": a.get("reason", "Consultation"),
            "documents_shared": shared_count,
        })
    results.sort(key=lambda x: str(x.get("starts_at") or ""), reverse=False)
    return results


@router.patch("/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: str,
    body: UpdateAppointmentStatusRequest,
    principal: Principal = Depends(require_roles("DOCTOR", "HOSPITAL_ADMIN", "RECEPTION")),
    store: Store = Depends(get_store),
):
    appt = store.appointments.get(appointment_id)
    if not appt:
        raise HTTPException(404, detail="Appointment not found.")
    if principal.role == "DOCTOR" and appt["doctor_id"] != principal.doctor_id:
        raise HTTPException(403, detail="You don't have permission to update this appointment.")
    
    old_status = appt.get("status")
    appt["status"] = body.status
    if body.notes:
        appt["notes"] = body.notes

    doc = store.doctors.get(appt.get("doctor_id"))
    doc_name = doc["full_name"] if doc else "Doctor"
    pat = store.patients.get(appt.get("patient_id"))
    pat_user_id = pat["user_id"] if pat else None
    
    # Handle Hospital Admin Accept or Reject
    if body.status in ("CONFIRMED", "ACCEPTED"):
        if pat_user_id:
            store.add_notification(
                pat_user_id,
                "appointment_confirmed",
                "Appointment Accepted by Hospital",
                f"Your appointment with {doc_name} has been approved by the hospital and forwarded to the doctor.",
                "appointment",
                appointment_id,
            )
        if doc and doc.get("user_id"):
            store.add_notification(
                doc["user_id"],
                "appointment_booked",
                "New Patient Appointment Approved",
                f"Hospital Admin has approved an appointment for {appt.get('patient_name', 'Patient')}. Please review in your queue.",
                "appointment",
                appointment_id,
            )
        store.add_timeline(
            appt["patient_id"],
            "appointment_confirmed",
            f"Appointment Accepted — {doc_name}",
            "appointments",
            appointment_id,
            "calendar",
        )
    elif body.status in ("REJECTED", "CANCELLED"):
        store.booked_slots.discard((appt["doctor_id"], iso(appt["starts_at"])))
        if pat_user_id:
            store.add_notification(
                pat_user_id,
                "appointment_cancelled",
                "Appointment Update",
                f"Your appointment request with {doc_name} could not be accepted. Reason: {body.notes or 'Slot unavailable'}.",
                "appointment",
                appointment_id,
            )
        store.add_timeline(
            appt["patient_id"],
            "appointment_cancelled",
            f"Appointment Request Declined — {doc_name}",
            "appointments",
            appointment_id,
            "calendar",
        )
        
    store.audit_event(
        principal.user_id,
        principal.role,
        "appointment.status_updated",
        "appointment",
        appointment_id,
        {"status": body.status, "old_status": old_status},
    )
    return {"ok": True, "appointment": _ser(appt)}


@router.get("/patients")
def get_authorized_patients(
    query: str | None = None,
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    out = []
    seen = set()
    for c in store.consents.values():
        if c["doctor_id"] != principal.doctor_id:
            continue
        if store.consent_expired(c) or c["status"] != "ACTIVE":
            continue
        pid = c["patient_id"]
        if pid in seen:
            continue
        seen.add(pid)
        pat = store.patients.get(pid)
        if not pat:
            continue
        prof = store.profiles.get(pat["user_id"], {})
        name = prof.get("full_name", "Patient")
        if query and query.lower() not in name.lower() and query.lower() not in pid.lower():
            continue
        # Get latest appt
        doc_appts = [a for a in store.appointments.values() if a["patient_id"] == pid and a["doctor_id"] == principal.doctor_id]
        doc_appts.sort(key=lambda x: str(x.get("starts_at") or ""), reverse=True)
        latest_appt = doc_appts[0] if doc_appts else None
        
        shared_items = [ci for ci in store.consent_items if ci["consent_id"] == c["id"]]
        out.append({
            "patient_id": pid,
            "full_name": name,
            "age": 34,
            "gender": "Male",
            "city": "Bengaluru",
            "consent_status": c["status"],
            "consent_expires_at": iso(c.get("expires_at")),
            "shared_records_count": len(shared_items),
            "last_visit": iso(latest_appt["starts_at"]) if latest_appt else None,
            "specialty": "Cardiology",
        })
    return out


@router.get("/patients/{patient_id}")
def get_patient_detail(
    patient_id: str,
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    ok, msg = doctor_may_access_patient(store, principal, patient_id)
    if not ok:
        raise HTTPException(403, detail=msg)
    
    pat = store.patients.get(patient_id)
    if not pat:
        raise HTTPException(404, detail="Patient not found.")
    prof = store.profiles.get(pat["user_id"], {})
    consent = store.active_consent(principal.doctor_id, patient_id)
    
    # Audit access
    store.audit_event(
        principal.user_id,
        "DOCTOR",
        "doctor.view_patient_profile",
        "patient",
        patient_id,
        {"consent_id": consent["id"] if consent else None},
    )
    
    appts = [_ser(a) for a in store.appointments.values() if a["patient_id"] == patient_id and a["doctor_id"] == principal.doctor_id]
    reports = []
    for r in store.reports.values():
        if r["patient_id"] == patient_id:
            vals = [v for v in store.report_values if v["report_id"] == r["id"]]
            reports.append({**_ser(r), "values": vals, "document": store.documents.get(r.get("document_id"))})
    reports.sort(key=lambda x: x.get("report_date") or "", reverse=True)

    meds = [_ser(m) for m in store.medications.values() if m["patient_id"] == patient_id]
    rx_list = [_ser(rx) for rx in store.prescriptions.values() if rx["patient_id"] == patient_id]
    plans = [_ser(p) for p in store.recovery_plans.values() if p["patient_id"] == patient_id]
    tasks = [_ser(t) for t in store.recovery_tasks if any(t["plan_id"] == p["id"] for p in plans)]
    timeline = [_ser(tl) for tl in store.timeline if tl["patient_id"] == patient_id]
    timeline.sort(key=lambda x: str(x.get("occurred_at") or ""), reverse=True)

    return {
        "patient": {
            "id": patient_id,
            "full_name": prof.get("full_name", "Arjun Mehta"),
            "age": 34,
            "city": "Bengaluru",
            "phone": prof.get("phone", "+91 90000 11111"),
            "emergency_contact": pat.get("emergency_contact_name"),
        },
        "consent": _ser(consent) if consent else None,
        "appointments": appts,
        "reports": reports,
        "medications": meds,
        "prescriptions": rx_list,
        "recovery_plans": plans,
        "recovery_tasks": tasks,
        "timeline": timeline,
    }


@router.get("/reports/{report_id}")
def doctor_report_detail(
    report_id: str,
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    report = store.reports.get(report_id)
    if not report:
        raise HTTPException(404, detail="Report not found.")
    ok, msg = doctor_may_access_patient(store, principal, report["patient_id"])
    if not ok:
        raise HTTPException(403, detail=msg)
    
    # Audit log
    store.audit_event(
        principal.user_id,
        "DOCTOR",
        "doctor.view_report",
        "report",
        report_id,
        {"patient_id": report["patient_id"]},
    )

    vals = [v for v in store.report_values if v["report_id"] == report_id]
    doc = store.documents.get(report.get("document_id"))
    return {
        "report": _ser(report),
        "values": vals,
        "document": _ser(doc) if doc else None,
        "disclaimer": "DEMO / SYNTHETIC DATA — All laboratory test results are fictional.",
    }


@router.post("/reports/compare")
def doctor_compare_reports(
    report_a: str = Query(...),
    report_b: str = Query(...),
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    ra = store.reports.get(report_a)
    rb = store.reports.get(report_b)
    if not ra or not rb:
        raise HTTPException(404, detail="One or both reports could not be found.")
    if ra["patient_id"] != rb["patient_id"]:
        raise HTTPException(400, detail="Cannot compare reports from different patients.")
    ok, msg = doctor_may_access_patient(store, principal, ra["patient_id"])
    if not ok:
        raise HTTPException(403, detail=msg)
    
    return compare_reports(store, report_a, report_b)


@router.get("/consultations/{appointment_id}")
def get_consultation_workspace(
    appointment_id: str,
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    appt = store.appointments.get(appointment_id)
    if not appt or appt["doctor_id"] != principal.doctor_id:
        raise HTTPException(404, detail="Appointment not found.")
    ok, msg = doctor_may_access_patient(store, principal, appt["patient_id"])
    if not ok:
        raise HTTPException(403, detail=msg)
    
    pat = store.patients.get(appt["patient_id"])
    prof = store.profiles.get(pat["user_id"])
    
    # Existing consultation note if any
    consult = next((c for c in store.consultations.values() if c.get("appointment_id") == appointment_id), None)
    
    # Recent reports
    reports = [
        {**_ser(r), "values": [v for v in store.report_values if v["report_id"] == r["id"]]}
        for r in store.reports.values()
        if r["patient_id"] == appt["patient_id"]
    ]
    reports.sort(key=lambda x: x.get("report_date") or "", reverse=True)
    
    # Medications
    meds = [m for m in store.medications.values() if m["patient_id"] == appt["patient_id"]]

    return {
        "appointment": _ser(appt),
        "patient": {
            "id": appt["patient_id"],
            "full_name": prof["full_name"],
            "age": 34,
            "gender": "Male",
            "city": "Bengaluru",
        },
        "consultation": _ser(consult) if consult else None,
        "recent_reports": reports,
        "medications": meds,
    }


@router.post("/consultations")
def create_consultation_note(
    body: ConsultationNoteCreate,
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    appt = store.appointments.get(body.appointment_id)
    if not appt or appt["doctor_id"] != principal.doctor_id:
        raise HTTPException(403, detail="You do not have authorization for this appointment.")
    ok, msg = doctor_may_access_patient(store, principal, body.patient_id)
    if not ok:
        raise HTTPException(403, detail=msg)
    
    cid = new_id()
    store.consultations[cid] = {
        "id": cid,
        "appointment_id": body.appointment_id,
        "patient_id": body.patient_id,
        "doctor_id": principal.doctor_id,
        "chief_concern": body.chief_concern,
        "clinical_notes": body.clinical_notes,
        "assessment": body.assessment,
        "plan": body.plan,
        "follow_up_notes": body.follow_up_notes,
        "created_at": utcnow(),
    }
    
    appt["status"] = "COMPLETED"
    doc = store.doctors.get(principal.doctor_id)
    doc_name = doc["full_name"] if doc else "Attending Doctor"
    
    # Automatically generate an official Clinical Consultation Report for the patient
    rid = new_id()
    doc_id = new_id()
    store.documents[doc_id] = {
        "id": doc_id,
        "patient_id": body.patient_id,
        "uploaded_by": principal.user_id,
        "document_type": "clinical_consultation_report",
        "title": f"Doctor Consultation Report — {doc_name}",
        "storage_bucket": "medical-documents",
        "storage_path": f"{body.patient_id}/{doc_id}",
        "mime_type": "application/pdf",
        "status": "READY",
        "source": "doctor",
        "appointment_id": body.appointment_id,
        "created_at": utcnow(),
        "bytes": 2048,
    }

    report_summary = (
        f"Chief Concern: {body.chief_concern}\n\n"
        f"Clinical Observations: {body.clinical_notes}\n\n"
        f"Doctor Assessment: {body.assessment}\n\n"
        f"Treatment Plan & Recommendations: {body.plan}\n\n"
        f"Follow-up: {body.follow_up_notes or 'As scheduled'}"
    )

    store.reports[rid] = {
        "id": rid,
        "patient_id": body.patient_id,
        "document_id": doc_id,
        "report_date": utcnow().date().isoformat(),
        "hospital_or_lab": doc.get("hospital_name", "Bengaluru Heart & Multispecialty Hospital") if doc else "Bengaluru Multispecialty",
        "doctor_name": doc_name,
        "test_name": f"Consultation Review & Clinical Assessment ({doc.get('specialty', 'Cardiology') if doc else 'General'})",
        "document_type": "Clinical Consultation Report",
        "notes": report_summary,
        "extraction_confidence": 1.0,
        "needs_verification": False,
        "created_at": utcnow(),
    }

    # Add parameters/findings values
    store.report_values.append({
        "id": new_id(),
        "report_id": rid,
        "test_name": "Clinical Assessment Status",
        "value": "Completed & Verified",
        "unit": "",
        "reference_range": "Normal",
        "notes": body.assessment,
        "source_location": None,
        "confidence": 1.0,
        "needs_verification": False,
    })

    # Save to official health records
    store.health_records[rid] = {
        "id": rid,
        "patient_id": body.patient_id,
        "record_type": "medical_report",
        "title": f"Clinical Consultation Summary — {doc_name}",
        "source_table": "medical_reports",
        "source_id": rid,
        "official": True,
        "created_at": utcnow(),
    }

    # Add timeline event for patient
    store.add_timeline(
        body.patient_id,
        "report",
        f"Clinical Consultation Report from {doc_name}",
        "medical_reports",
        rid,
        "document",
    )

    # Notify patient
    pat = store.patients.get(body.patient_id)
    if pat:
        store.add_notification(
            pat["user_id"],
            "doctor_uploaded_document",
            f"Consultation Report Available from {doc_name}",
            f"Your doctor has finalized your consultation review and generated your official clinical report.",
            "medical_report",
            rid,
        )
    
    # Audit log
    store.audit_event(
        principal.user_id,
        "DOCTOR",
        "doctor.create_consultation_note",
        "consultation",
        cid,
        {"patient_id": body.patient_id, "report_id": rid},
    )
    
    return {"id": cid, "report_id": rid, "status": "CREATED", "message": "Consultation review and report sent to patient."}


@router.post("/prescriptions")
def create_signed_prescription(
    body: PrescriptionCreate,
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    if not body.signed:
        raise HTTPException(400, detail="Prescription must be explicitly reviewed and signed.")
    ok, msg = doctor_may_access_patient(store, principal, body.patient_id)
    if not ok:
        raise HTTPException(403, detail=msg)
    
    rx_id = new_id()
    store.prescriptions[rx_id] = {
        "id": rx_id,
        "patient_id": body.patient_id,
        "doctor_id": principal.doctor_id,
        "appointment_id": body.appointment_id,
        "document_id": None,
        "issued_at": utcnow().date().isoformat(),
        "notes": body.notes or "Signed clinical prescription.",
    }
    
    for item in body.medicines:
        mid = new_id()
        store.medications[mid] = {
            "id": mid,
            "prescription_id": rx_id,
            "patient_id": body.patient_id,
            "name": item.name,
            "dose": item.dosage,
            "frequency": item.frequency,
            "duration": item.duration,
            "instructions": item.instructions,
            "extracted_exactly": True,
        }
        store.schedules.append({
            "id": new_id(),
            "medication_id": mid,
            "period": item.period,
            "reminder_enabled": True,
        })

    # If appointment was attached, mark completed
    if body.appointment_id and body.appointment_id in store.appointments:
        store.appointments[body.appointment_id]["status"] = "COMPLETED"

    # Notify patient
    pat = store.patients.get(body.patient_id)
    doc = store.doctors.get(principal.doctor_id)
    if pat:
        store.add_notification(
            pat["user_id"],
            "doctor_uploaded_document",
            "New Prescription Signed",
            f"{doc['full_name']} has prescribed new medication following your consultation.",
            "prescription",
            rx_id,
        )
        store.add_timeline(
            body.patient_id,
            "prescription",
            f"Prescription Signed by {doc['full_name']}",
            "prescriptions",
            rx_id,
            "pill",
        )
        store.health_records[rx_id] = {
            "id": rx_id,
            "patient_id": body.patient_id,
            "record_type": "prescription",
            "title": f"Prescription — {doc['full_name']}",
            "source_table": "prescriptions",
            "source_id": rx_id,
            "official": True,
            "created_at": utcnow(),
        }

    # Audit log
    store.audit_event(
        principal.user_id,
        "DOCTOR",
        "doctor.sign_prescription",
        "prescription",
        rx_id,
        {"patient_id": body.patient_id, "medications_count": len(body.medicines)},
    )

    return {"id": rx_id, "status": "SIGNED"}


@router.post("/followups")
def create_followup(
    body: FollowUpCreate,
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    ok, msg = doctor_may_access_patient(store, principal, body.patient_id)
    if not ok:
        raise HTTPException(403, detail=msg)
    
    doc = store.doctors.get(principal.doctor_id)
    pat = store.patients.get(body.patient_id)
    
    # Notify patient
    if pat:
        store.add_notification(
            pat["user_id"],
            "followup_reminder",
            "Follow-up Scheduled",
            f"{doc['full_name']} recommended a follow-up on {body.follow_up_date}. Reason: {body.reason}",
            "followup",
            body.patient_id,
        )
        store.add_timeline(
            body.patient_id,
            "followup",
            f"Follow-up Due: {body.follow_up_date} ({body.reason})",
            "appointments",
            body.patient_id,
            "calendar",
        )
        
    store.audit_event(
        principal.user_id,
        "DOCTOR",
        "doctor.create_followup",
        "followup",
        body.patient_id,
        {"follow_up_date": body.follow_up_date, "reason": body.reason},
    )

    return {"ok": True, "follow_up_date": body.follow_up_date}


@router.post("/recovery-plans")
def create_recovery_plan(
    body: RecoveryPlanCreate,
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    ok, msg = doctor_may_access_patient(store, principal, body.patient_id)
    if not ok:
        raise HTTPException(403, detail=msg)
    
    plan_id = new_id()
    store.recovery_plans[plan_id] = {
        "id": plan_id,
        "patient_id": body.patient_id,
        "title": body.title,
        "source_document_id": None,
        "status": "active",
        "created_at": utcnow(),
    }
    
    for t in body.tasks:
        store.recovery_tasks.append({
            "id": new_id(),
            "plan_id": plan_id,
            "section": t.section,
            "content": t.content,
            "documented": True,
            "completed": t.completed,
        })

    pat = store.patients.get(body.patient_id)
    doc = store.doctors.get(principal.doctor_id)
    if pat:
        store.add_notification(
            pat["user_id"],
            "recovery_plan_created",
            "New Recovery Plan",
            f"{doc['full_name']} created a structured recovery roadmap for you.",
            "recovery_plan",
            plan_id,
        )
        store.add_timeline(
            body.patient_id,
            "recovery",
            f"Recovery Roadmap: {body.title}",
            "recovery_plans",
            plan_id,
            "heart",
        )

    store.audit_event(
        principal.user_id,
        "DOCTOR",
        "doctor.create_recovery_plan",
        "recovery_plan",
        plan_id,
        {"patient_id": body.patient_id, "tasks_count": len(body.tasks)},
    )

    return {"id": plan_id, "status": "CREATED"}


@router.get("/schedule")
def get_doctor_schedule(
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    doc = store.doctors.get(principal.doctor_id)
    avail = [a for a in store.availability if a["doctor_id"] == principal.doctor_id]
    return {
        "doctor": doc,
        "availability": avail,
        "breaks": [{"label": "Lunch Break", "start": "13:00", "end": "14:00"}],
        "leaves": ["2026-09-20"],
        "max_daily_appointments": 25,
        "consultation_type": doc.get("consultation_type", "in_person"),
    }


@router.put("/schedule")
def update_doctor_schedule(
    body: DoctorScheduleUpdate,
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    # Remove existing
    store.availability[:] = [a for a in store.availability if a["doctor_id"] != principal.doctor_id]
    for item in body.availability:
        store.availability.append({
            "id": new_id(),
            "doctor_id": principal.doctor_id,
            "weekday": item.weekday,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "slot_minutes": item.slot_minutes,
        })
    doc = store.doctors.get(principal.doctor_id)
    if doc:
        doc["consultation_type"] = body.consultation_type

    store.audit_event(
        principal.user_id,
        "DOCTOR",
        "doctor.update_schedule",
        "doctor_availability",
        principal.doctor_id,
        {"slots_count": len(body.availability)},
    )
    return {"ok": True, "availability_count": len(body.availability)}


@router.get("/notifications")
def get_doctor_notifications(
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    notifications = [
        {
            "id": "doc-notif-1",
            "title": "New Appointment Booked",
            "body": "Arjun Mehta booked a Cardiology Consultation for 03 Sep, 06:30 PM with 3 records shared.",
            "created_at": "2026-09-02T10:00:00Z",
            "read": False,
            "type": "appointment_booked",
        },
        {
            "id": "doc-notif-2",
            "title": "Medical Records Consented",
            "body": "Arjun Mehta granted 7-day consent for Complete Blood Count and previous visit history.",
            "created_at": "2026-09-02T10:05:00Z",
            "read": False,
            "type": "consent_granted",
        },
        {
            "id": "doc-notif-3",
            "title": "Follow-up Due Reminder",
            "body": "Rahul Kumar's cardiology follow-up is scheduled for today at 09:30 AM.",
            "created_at": "2026-09-02T08:30:00Z",
            "read": True,
            "type": "followup_due",
        },
    ]
    return notifications


@router.get("/audit")
def get_doctor_audit(
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    logs = [a for a in store.audit if a.get("actor_user_id") == principal.user_id or a.get("actor_role") == "DOCTOR"]
    logs.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)
    return [_ser(l) for l in logs[:50]]


@router.post("/ai/assistant")
async def doctor_ai_assistant(
    body: DoctorAIChatRequest,
    principal: Principal = Depends(require_roles("DOCTOR")),
    store: Store = Depends(get_store),
):
    ok, msg = doctor_may_access_patient(store, principal, body.patient_id)
    if not ok:
        raise HTTPException(403, detail=msg)
    
    # Retrieve strictly authorized context
    reports = [r for r in store.reports.values() if r["patient_id"] == body.patient_id]
    appts = [a for a in store.appointments.values() if a["patient_id"] == body.patient_id]
    meds = [m for m in store.medications.values() if m["patient_id"] == body.patient_id]
    
    authorized_summary_records = []
    for r in reports:
        authorized_summary_records.append({
            "title": f"{r.get('test_name')} ({r.get('hospital_or_lab')})",
            "report_date": r.get("report_date"),
        })
    for a in appts:
        authorized_summary_records.append({
            "title": f"Appointment: {a.get('reason')}",
            "starts_at": iso(a.get("starts_at")),
        })

    summary = await ai_provider.summarize_records(authorized_summary_records)
    
    # Audit LLM call
    store.audit_event(
        principal.user_id,
        "DOCTOR",
        "doctor.ai_summary_generated",
        "patient",
        body.patient_id,
        {"records_count": len(authorized_summary_records)},
    )
    
    return {
        "reply": summary,
        "sources": [
            {"type": "medical_report", "id": r["id"], "title": r["test_name"]} for r in reports
        ],
        "disclaimer": "AI-generated summary. Verify against the original patient records before making clinical decisions.",
    }
