from fastapi import APIRouter, Depends, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

from app.ai.agent import run_agent
from app.api.deps import get_principal, get_store, require_roles
from app.data.store import Store
from app.schemas.api import ChatRequest, PrescriptionUpload
from app.security.authz import Principal, doctor_may_access_patient
from app.utils.time import new_id, utcnow

router = APIRouter(prefix="/api", tags=["ai-doctor"])


@router.post("/ai/chat")
async def ai_chat(body: ChatRequest, request: Request, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    return await run_agent(store, principal, body.conversation_id, body.message, body.image_url)


@router.get("/ai/conversations")
def conversations(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    convos = [c for c in store.conversations.values() if c["patient_id"] == principal.patient_id]
    return convos


@router.get("/ai/conversations/{cid}")
def conversation(cid: str, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    c = store.conversations.get(cid)
    if not c or c["patient_id"] != principal.patient_id:
        raise HTTPException(404, detail="That conversation could not be found.")
    msgs = [m for m in store.messages if m["conversation_id"] == cid]
    return {"conversation": c, "messages": msgs}


@router.delete("/ai/conversations/{cid}")
def delete_conversation(cid: str, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    c = store.conversations.get(cid)
    if not c or c["patient_id"] != principal.patient_id:
        raise HTTPException(404, detail="That conversation could not be found.")
    del store.conversations[cid]
    store.messages[:] = [m for m in store.messages if m["conversation_id"] != cid]
    return {"ok": True}


@router.get("/doctor/patients")
def doctor_patients(principal: Principal = Depends(require_roles("DOCTOR")), store: Store = Depends(get_store)):
    out = []
    for c in store.consents.values():
        if c["doctor_id"] != principal.doctor_id:
            continue
        if store.consent_expired(c) or c["status"] != "ACTIVE":
            continue
        p = store.patients[c["patient_id"]]
        profile = store.profiles[p["user_id"]]
        out.append({"patient_id": p["id"], "name": profile["full_name"], "consent": c})
    return out


@router.get("/doctor/patients/{patient_id}")
def doctor_patient(patient_id: str, principal: Principal = Depends(require_roles("DOCTOR")), store: Store = Depends(get_store)):
    ok, msg = doctor_may_access_patient(store, principal, patient_id)
    if not ok:
        raise HTTPException(403, detail=msg)
    p = store.patients[patient_id]
    reports = [r for r in store.reports.values() if r["patient_id"] == patient_id]
    docs = [d for d in store.documents.values() if d["patient_id"] == patient_id]
    appts = [a for a in store.appointments.values() if a["patient_id"] == patient_id and a["doctor_id"] == principal.doctor_id]
    return {
        "patient": {**p, "profile": store.profiles[p["user_id"]]},
        "reports": reports,
        "documents": docs,
        "appointments": appts,
        "disclaimer": "AI-generated summary. Review source records before making clinical decisions.",
    }


@router.get("/doctor/patients/{patient_id}/brief")
def doctor_brief(patient_id: str, principal: Principal = Depends(require_roles("DOCTOR")), store: Store = Depends(get_store)):
    ok, msg = doctor_may_access_patient(store, principal, patient_id)
    if not ok:
        raise HTTPException(403, detail=msg)
    reports = sorted([r for r in store.reports.values() if r["patient_id"] == patient_id], key=lambda r: r.get("report_date") or "")
    appts = [a for a in store.appointments.values() if a["patient_id"] == patient_id]
    meds = [m for m in store.medications.values() if m["patient_id"] == patient_id]
    profile = store.profiles[store.patients[patient_id]["user_id"]]
    items = []
    if appts:
        items.append({"label": "Reason for visit", "text": appts[-1].get("reason") or "Consultation", "source": {"type": "appointment", "id": appts[-1]["id"]}})
    if reports:
        latest = reports[-1]
        items.append({"label": "Recent relevant records", "text": f"{latest['test_name']} dated {latest['report_date']}", "source": {"type": "report", "id": latest["id"]}})
    if len(reports) >= 2:
        items.append({"label": "Report trends", "text": "Compare documented lipid values across the last two reports. Do not treat change as a diagnosis.", "source": {"type": "report", "id": reports[-1]["id"]}})
    if meds:
        items.append({"label": "Relevant prescriptions", "text": ", ".join(m["name"] for m in meds), "source": {"type": "prescription", "id": meds[0]["prescription_id"]}})
    return {
        "patient_name": profile["full_name"],
        "items": items,
        "disclaimer": "AI-generated summary. Review source records before making clinical decisions.",
    }


@router.post("/doctor/prescriptions-legacy")
def upload_prescription_legacy(body: PrescriptionUpload, principal: Principal = Depends(require_roles("DOCTOR")), store: Store = Depends(get_store)):
    if not body.confirmed:
        raise HTTPException(400, detail="Uploading a prescription will notify the patient and add it to their Health Record. Continue?")
    appt = store.appointments.get(body.appointment_id)
    if not appt or appt["doctor_id"] != principal.doctor_id:
        raise HTTPException(403, detail="You don't have permission to view this record.")
    ok, msg = doctor_may_access_patient(store, principal, appt["patient_id"])
    if not ok:
        raise HTTPException(403, detail=msg)
    rx_id = new_id()
    store.prescriptions[rx_id] = {
        "id": rx_id,
        "patient_id": appt["patient_id"],
        "doctor_id": principal.doctor_id,
        "appointment_id": appt["id"],
        "document_id": None,
        "issued_at": utcnow().date().isoformat(),
        "notes": body.notes,
    }
    for med in body.medicines:
        mid = new_id()
        store.medications[mid] = {
            "id": mid,
            "prescription_id": rx_id,
            "patient_id": appt["patient_id"],
            "name": med.get("name"),
            "dose": med.get("dose"),
            "frequency": med.get("frequency"),
            "duration": med.get("duration"),
            "instructions": med.get("instructions"),
            "extracted_exactly": True,
        }
        period = med.get("period") or "morning"
        store.schedules.append({"id": new_id(), "medication_id": mid, "period": period, "reminder_enabled": True})
    appt["status"] = "COMPLETED"
    patient_user = store.patients[appt["patient_id"]]["user_id"]
    doctor = store.doctors[principal.doctor_id]
    store.add_notification(
        patient_user,
        "doctor_uploaded_document",
        "New prescription",
        f"{doctor['full_name']} added a prescription to your Health Record.",
        "prescription",
        rx_id,
    )
    store.add_timeline(appt["patient_id"], "prescription", "Prescription added", "prescriptions", rx_id, "pill")
    store.health_records[rx_id] = {
        "id": rx_id,
        "patient_id": appt["patient_id"],
        "record_type": "prescription",
        "title": "Prescription",
        "source_table": "prescriptions",
        "source_id": rx_id,
        "official": True,
        "created_at": utcnow(),
    }
    store.audit_event(principal.user_id, principal.role, "prescription.uploaded", "prescription", rx_id, {})
    return {"id": rx_id, "status": "READY"}


@router.get("/admin/summary")
def admin_summary(principal: Principal = Depends(require_roles("HOSPITAL_ADMIN")), store: Store = Depends(get_store)):
    hid = principal.hospital_id
    appts = [a for a in store.appointments.values() if a["hospital_id"] == hid]
    docs = [d for d in store.doctors.values() if d["hospital_id"] == hid]
    depts = [d for d in store.departments.values() if d["hospital_id"] == hid]
    return {
        "hospital": store.hospitals[hid],
        "appointment_count": len(appts),
        "upcoming": [a for a in appts if a["status"] in ("CONFIRMED", "UPCOMING")],
        "doctors": docs,
        "departments": depts,
        "note": "Patient clinical details are hidden from hospital operations unless required for the operational function.",
    }
