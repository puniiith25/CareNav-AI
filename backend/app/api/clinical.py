from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.deps import get_principal, get_store, require_roles
from app.data.store import Store
from app.schemas.api import (
    BookAppointmentRequest,
    CancelAppointmentRequest,
    CompareRequest,
    ConsentRequest,
    FamilyMemberCreate,
    MemoryAction,
    ProfileUpdate,
    RenameConversation,
    MedicationLog,
    CaregiverInvite,
    NavigateRequest,
    UpdateAppointmentRequest,
)
from app.security.authz import Principal, assert_patient_or_authorized_doctor, doctor_may_access_patient
from app.services.clinical import compare_reports, create_appointment, demo_extract_lipid_panel, list_availability, serialize_appointment, navigate_need
from app.utils.time import iso, new_id, utcnow

router = APIRouter(prefix="/api", tags=["patient"])

ALLOWED_MIME = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
}
MAX_BYTES = 10 * 1024 * 1024


def _ser_dt(row: dict) -> dict:
    return {k: iso(v) if isinstance(v, datetime) else v for k, v in row.items()}


def _ser_doc(doc: dict | None) -> dict | None:
    if not doc:
        return None
    return {k: v for k, v in _ser_dt(doc).items() if not k.startswith("_")}


@router.get("/patients/me")
def patients_me(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    p = store.patients[principal.patient_id]
    return {**p, "profile": store.profiles[principal.user_id]}


@router.get("/health-records")
def health_records(principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    pid = principal.patient_id
    if principal.role == "DOCTOR":
        raise HTTPException(400, detail="Specify a patient via the doctor records endpoint.")
    return [_ser_dt(r) for r in store.health_records.values() if r["patient_id"] == pid]


@router.get("/timeline")
def timeline(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    events = [e for e in store.timeline if e["patient_id"] == principal.patient_id]
    events.sort(key=lambda e: e["occurred_at"], reverse=True)
    return [_ser_dt(e) for e in events]


@router.get("/medications")
def medications(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    meds = [m for m in store.medications.values() if m["patient_id"] == principal.patient_id]
    schedule = {"morning": [], "afternoon": [], "night": []}
    for m in meds:
        for s in store.schedules:
            if s["medication_id"] == m["id"]:
                schedule[s["period"]].append(m)
    return {"medications": meds, "today": schedule}


@router.get("/reports")
def reports(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    rows = []
    for r in store.reports.values():
        if r["patient_id"] != principal.patient_id:
            continue
        values = [v for v in store.report_values if v["report_id"] == r["id"]]
        rows.append({**_ser_dt(r), "values": values, "document": _ser_doc(store.documents.get(r.get("document_id")))})
    rows.sort(key=lambda r: r.get("report_date") or "", reverse=True)
    return rows


@router.get("/reports/{report_id}")
def report_detail(report_id: str, principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    r = store.reports.get(report_id)
    if not r:
        raise HTTPException(404, detail="That report could not be found.")
    assert_patient_or_authorized_doctor(store, principal, r["patient_id"])
    values = [v for v in store.report_values if v["report_id"] == report_id]
    previous = [
        x
        for x in store.reports.values()
        if x["patient_id"] == r["patient_id"] and x["id"] != report_id and x.get("test_name") == r.get("test_name")
    ]
    explanation = {
        "what_this_report_is": f"This document is recorded as a {r.get('document_type') or 'laboratory report'} ({r.get('test_name')}).",
        "key_results": values,
        "what_these_tests_measure": "A lipid panel lists cholesterol and triglyceride values printed on the lab report. These descriptions are educational, not a diagnosis.",
        "questions_for_doctor": [
            "What do these documented values mean in the context of my history?",
            "Should any lifestyle or medication plan change based on this report?",
            "When should this panel be repeated?",
        ],
        "disclaimer": "AI-generated explanation — not a medical diagnosis.",
    }
    return {**_ser_dt(r), "values": values, "document": _ser_doc(store.documents.get(r.get("document_id"))), "previous_reports": previous, "explanation": explanation}


@router.post("/reports/compare")
def report_compare(body: CompareRequest, principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    a = store.reports.get(body.report_a)
    b = store.reports.get(body.report_b)
    if not a or not b:
        raise HTTPException(404, detail="That report could not be found.")
    assert_patient_or_authorized_doctor(store, principal, a["patient_id"])
    assert_patient_or_authorized_doctor(store, principal, b["patient_id"])
    return compare_reports(store, body.report_a, body.report_b)


@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    principal: Principal = Depends(require_roles("PATIENT")),
    store: Store = Depends(get_store),
):
    if file.content_type not in ALLOWED_MIME and not (file.filename or "").lower().endswith((".pdf", ".jpg", ".jpeg", ".png", ".webp")):
        raise HTTPException(400, detail="That file type is not supported. Upload a PDF, JPG, or PNG.")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, detail="Your document could not be uploaded. Please try again.")
    if not data:
        raise HTTPException(400, detail="Your document could not be uploaded. Please try again.")
    doc_id = new_id()
    store.documents[doc_id] = {
        "id": doc_id,
        "patient_id": principal.patient_id,
        "uploaded_by": principal.user_id,
        "document_type": "lab_report",
        "title": file.filename or "Captured Camera Medical Photo",
        "storage_bucket": "medical-documents",
        "storage_path": f"{principal.user_id}/{doc_id}",
        "mime_type": file.content_type or "image/jpeg",
        "status": "PROCESSING",
        "source": "patient",
        "appointment_id": None,
        "created_at": utcnow(),
        "bytes": len(data),
        "_raw_data": data,
    }
    store.audit_event(principal.user_id, principal.role, "document.uploaded", "medical_document", doc_id, {"filename": file.filename})
    return {"id": doc_id, "status": "PROCESSING", "prompt": "Would you like to save this to your Health Memory?"}


@router.get("/documents/{doc_id}/file")
def get_document_file(doc_id: str, principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    from fastapi.responses import Response

    doc = store.documents.get(doc_id)
    if not doc:
        raise HTTPException(404, detail="That document could not be found.")
    raw_data = doc.get("_raw_data")
    if not raw_data:
        raise HTTPException(404, detail="File data not available.")
    return Response(content=raw_data, media_type=doc.get("mime_type") or "image/jpeg")


@router.post("/reports/{doc_id}/analyze")
async def analyze(doc_id: str, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    from app.ai.provider import ai_provider

    doc = store.documents.get(doc_id)
    if not doc or doc["patient_id"] != principal.patient_id:
        raise HTTPException(404, detail="That document could not be found.")
    doc["status"] = "ANALYZING"
    
    raw_data = doc.get("_raw_data")
    mime = doc.get("mime_type") or "image/jpeg"
    
    if raw_data:
        extracted = await ai_provider.analyze_image(raw_data, mime)
    else:
        raise HTTPException(400, detail="Document data is empty. Please capture or upload a document photo.")

    rid = new_id()
    store.reports[rid] = {
        "id": rid,
        "patient_id": principal.patient_id,
        "document_id": doc_id,
        "report_date": extracted.get("report_date") or utcnow().date().isoformat(),
        "hospital_or_lab": extracted.get("hospital_or_lab") or "Diagnostic Facility",
        "doctor_name": extracted.get("doctor") or "Attending Physician",
        "test_name": extracted.get("test_name") or "Medical Laboratory Report",
        "document_type": extracted.get("document_type") or "Laboratory Report",
        "notes": extracted.get("summary"),
        "extraction_confidence": 0.95,
        "needs_verification": False,
        "created_at": utcnow(),
    }
    for v in extracted.get("values", []):
        conf = float(v.get("confidence", 0.9))
        store.report_values.append({
            "id": new_id(),
            "report_id": rid,
            "test_name": v.get("test_name", "Parameter"),
            "value": str(v.get("value", "Normal")),
            "unit": v.get("unit", ""),
            "reference_range": v.get("reference_range", "Normal"),
            "notes": None,
            "source_location": None,
            "confidence": conf,
            "needs_verification": conf < 0.8,
        })
    doc["status"] = "READY"
    store.add_timeline(principal.patient_id, "report", f"{store.reports[rid]['test_name']} uploaded and analyzed", "medical_reports", rid, "document")
    store.audit_event(principal.user_id, principal.role, "ai.analyzed_report", "medical_report", rid, {})
    store.add_notification(principal.user_id, "new_health_record", "Report analyzed", "Your uploaded document is ready to review.", "medical_report", rid)
    return {
        "status": "READY",
        "report_id": rid,
        "message": "Report analyzed.",
        "extracted": extracted,
        "memory_prompt": "Would you like to save this to your Health Memory?",
        "disclaimer": "AI-generated explanation — not a medical diagnosis.",
    }


@router.get("/health-memory")
def health_memory(q: str | None = None, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    chats = [c for c in store.conversations.values() if c["patient_id"] == principal.patient_id]
    journal = [j for j in store.journal.values() if j["patient_id"] == principal.patient_id]
    official = [r for r in store.health_records.values() if r["patient_id"] == principal.patient_id]
    if q:
        ql = q.lower()
        journal = [j for j in journal if ql in (j["title"] + (j.get("summary") or "")).lower()]
        chats = [c for c in chats if ql in (c.get("title") or "").lower()]
    return {
        "level1_chat_history": [_ser_dt(c) for c in chats],
        "level2_health_journal": [_ser_dt(j) for j in journal],
        "level3_official_records": [_ser_dt(r) for r in official],
    }


@router.post("/health-memory")
def health_memory_action(body: MemoryAction, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    if body.action == "delete":
        return {"ok": True}
    if body.action == "keep_chat":
        return {"ok": True, "level": 1}
    jid = new_id()
    store.journal[jid] = {
        "id": jid,
        "patient_id": principal.patient_id,
        "source_type": "ai_report_explanation" if body.report_id else "ai_conversation",
        "source_id": body.report_id or body.conversation_id or body.document_id,
        "title": body.title or "Saved to Health Memory",
        "summary": body.summary or "AI-generated content saved by the patient. Not an official medical record.",
        "user_approved": True,
        "ai_generated": True,
        "created_at": utcnow(),
    }
    if body.action == "add_official":
        hid = new_id()
        store.health_records[hid] = {
            "id": hid,
            "patient_id": principal.patient_id,
            "record_type": "verified_patient_information",
            "title": body.title or "Added to Health Record",
            "source_table": "health_journal",
            "source_id": jid,
            "official": True,
            "created_at": utcnow(),
        }
        store.audit_event(principal.user_id, principal.role, "health_record.promoted", "health_record", hid, {"confirmed": True})
        return {"ok": True, "level": 3, "id": hid}
    store.audit_event(principal.user_id, principal.role, "health_memory.saved", "health_journal", jid, {})
    return {"ok": True, "level": 2, "id": jid}


@router.get("/appointments")
def appointments(principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    if principal.role == "PATIENT":
        rows = [a for a in store.appointments.values() if a["patient_id"] == principal.patient_id]
    elif principal.role == "DOCTOR":
        rows = [a for a in store.appointments.values() if a["doctor_id"] == principal.doctor_id]
    else:
        rows = [a for a in store.appointments.values() if a["hospital_id"] == principal.hospital_id]
    rows.sort(key=lambda a: a["starts_at"])
    return [serialize_appointment(store, a) for a in rows]


@router.get("/appointments/{appointment_id}")
def appointment_detail(appointment_id: str, principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    a = store.appointments.get(appointment_id)
    if not a:
        raise HTTPException(404, detail="That appointment could not be found.")
    if principal.role == "PATIENT" and a["patient_id"] != principal.patient_id:
        raise HTTPException(403, detail="You don't have permission to view this record.")
    if principal.role == "DOCTOR" and a["doctor_id"] != principal.doctor_id:
        raise HTTPException(403, detail="You don't have permission to view this record.")
    docs = [_ser_doc(store.documents[d]) for appt, d in store.appointment_documents if appt == appointment_id and d in store.documents]
    consent = store.active_consent(a["doctor_id"], a["patient_id"])
    return {**serialize_appointment(store, a), "documents": docs, "consent": consent}


@router.post("/appointments")
def book(body: BookAppointmentRequest, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    return create_appointment(
        store,
        principal,
        body.doctor_id,
        body.starts_at if body.starts_at.tzinfo else body.starts_at.replace(tzinfo=timezone.utc),
        body.reason,
        body.document_ids,
        body.share_items,
        body.duration_label,
        body.confirmed,
        body.family_member_id,
        body.patient_name,
    )


@router.get("/family-members")
def get_family_members(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    fms = [fm for fm in store.family_members.values() if fm["patient_id"] == principal.patient_id]
    fms.sort(key=lambda x: x.get("created_at") or utcnow(), reverse=False)
    return [_ser_dt(fm) for fm in fms]


@router.post("/family-members")
def add_family_member(body: FamilyMemberCreate, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    fm_id = new_id()
    store.family_members[fm_id] = {
        "id": fm_id,
        "patient_id": principal.patient_id,
        "full_name": body.full_name,
        "relationship": body.relationship,
        "age": body.age,
        "gender": body.gender,
        "blood_group": body.blood_group,
        "allergies": body.allergies,
        "chronic_conditions": body.chronic_conditions,
        "notes": body.notes,
        "created_at": utcnow(),
    }
    store.audit_event(principal.user_id, principal.role, "family_member.added", "family_member", fm_id, {"name": body.full_name, "rel": body.relationship})
    store.add_timeline(principal.patient_id, "family", f"Added family profile: {body.full_name} ({body.relationship})", "family_members", fm_id, "users")
    return _ser_dt(store.family_members[fm_id])


@router.delete("/family-members/{fm_id}")
def delete_family_member(fm_id: str, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    fm = store.family_members.get(fm_id)
    if not fm or fm["patient_id"] != principal.patient_id:
        raise HTTPException(404, detail="Family member not found.")
    del store.family_members[fm_id]
    return {"ok": True, "id": fm_id}


@router.patch("/appointments/{appointment_id}")
def cancel(appointment_id: str, body: CancelAppointmentRequest, principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    from app.services.clinical import cancel_appointment

    return cancel_appointment(store, principal, appointment_id, body.confirmed)


@router.put("/appointments/{appointment_id}")
def update_appointment(
    appointment_id: str,
    body: UpdateAppointmentRequest,
    principal: Principal = Depends(require_roles("PATIENT")),
    store: Store = Depends(get_store),
):
    appt = store.appointments.get(appointment_id)
    if not appt or appt["patient_id"] != principal.patient_id:
        raise HTTPException(404, detail="Appointment not found.")

    if body.starts_at:
        new_starts = body.starts_at if body.starts_at.tzinfo else body.starts_at.replace(tzinfo=timezone.utc)
        # Release old slot
        store.booked_slots.discard((appt["doctor_id"], iso(appt["starts_at"])))
        # Check slot availability
        new_key = (appt["doctor_id"], iso(new_starts))
        if new_key in store.booked_slots:
            raise HTTPException(409, detail="That appointment slot is no longer available.")
        store.booked_slots.add(new_key)
        appt["starts_at"] = new_starts
        appt["ends_at"] = new_starts + timedelta(minutes=20)

    if body.reason is not None:
        appt["reason"] = body.reason
    if body.notes is not None:
        appt["notes"] = body.notes

    if body.family_member_id is not None:
        if body.family_member_id == "self":
            appt["family_member_id"] = None
            appt["patient_name"] = "Arjun Mehta"
            appt["relationship"] = "Self"
        else:
            fm = store.family_members.get(body.family_member_id)
            if fm and fm["patient_id"] == principal.patient_id:
                appt["family_member_id"] = fm["id"]
                appt["patient_name"] = fm["full_name"]
                appt["relationship"] = fm["relationship"]

    store.audit_event(principal.user_id, principal.role, "appointment.updated", "appointment", appointment_id, {})
    return serialize_appointment(store, appt)


@router.get("/consents")
def consents(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    rows = [c for c in store.consents.values() if c["patient_id"] == principal.patient_id]
    out = []
    for c in rows:
        items = [i for i in store.consent_items if i["consent_id"] == c["id"]]
        doctor = store.doctors[c["doctor_id"]]
        out.append({**_ser_dt(c), "items": items, "doctor": doctor})
    return out


@router.post("/consents")
def grant_consent(body: ConsentRequest, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    if not body.confirmed:
        raise HTTPException(
            400,
            detail=f"You're about to share {len(body.items)} item groups with this doctor for {body.duration_label}. Continue?",
        )
    cid = new_id()
    from datetime import timedelta

    expires = utcnow() + timedelta(days=7)
    if body.duration_label == "24 hours":
        expires = utcnow() + timedelta(hours=24)
    store.consents[cid] = {
        "id": cid,
        "patient_id": principal.patient_id,
        "doctor_id": body.doctor_id,
        "appointment_id": body.appointment_id,
        "status": "ACTIVE",
        "duration_label": body.duration_label,
        "starts_at": utcnow(),
        "expires_at": expires,
        "created_at": utcnow(),
    }
    for item in body.items:
        store.consent_items.append({"id": new_id(), "consent_id": cid, "item_type": item, "resource_id": None})
    store.audit_event(principal.user_id, principal.role, "consent.granted", "consent", cid, {"items": body.items})
    store.add_notification(principal.user_id, "consent_granted", "Consent granted", "You shared selected records with a doctor.", "consent", cid)
    return {"id": cid, "status": "ACTIVE"}


@router.delete("/consents/{consent_id}")
def revoke_consent(consent_id: str, confirmed: bool = False, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    c = store.consents.get(consent_id)
    if not c or c["patient_id"] != principal.patient_id:
        raise HTTPException(404, detail="That consent record could not be found.")
    if not confirmed:
        raise HTTPException(400, detail="You're about to revoke access. Continue?")
    c["status"] = "REVOKED"
    store.audit_event(principal.user_id, principal.role, "consent.revoked", "consent", consent_id, {})
    store.add_notification(principal.user_id, "consent_revoked", "Consent revoked", "Access was revoked.", "consent", consent_id)
    return {"id": consent_id, "status": "REVOKED"}


@router.get("/notifications")
def notifications(principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    rows = [n for n in store.notifications.values() if n["user_id"] == principal.user_id]
    rows.sort(key=lambda n: n["created_at"], reverse=True)
    return [_ser_dt(n) for n in rows]


@router.get("/audit-log")
def audit_log(principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    rows = [a for a in store.audit if a.get("actor_user_id") == principal.user_id]
    if principal.role == "PATIENT":
        extra = [a for a in store.audit if a.get("resource_type") in ("consent", "medical_report", "prescription", "appointment")]
        rows = extra[-50:]
    return [_ser_dt(a) for a in rows][-80:]


@router.get("/recovery")
def recovery(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    plans = [p for p in store.recovery_plans.values() if p["patient_id"] == principal.patient_id]
    tasks = [t for t in store.recovery_tasks if any(t["plan_id"] == p["id"] for p in plans)]
    return {"plans": [_ser_dt(p) for p in plans], "tasks": tasks}


@router.get("/dashboard")
def dashboard(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    appts = [serialize_appointment(store, a) for a in store.appointments.values() if a["patient_id"] == principal.patient_id]
    upcoming = [a for a in appts if a["status"] in ("CONFIRMED", "UPCOMING", "REQUESTED")]
    upcoming.sort(key=lambda a: a["starts_at"])
    reports = [r for r in store.reports.values() if r["patient_id"] == principal.patient_id]
    reports.sort(key=lambda r: r.get("report_date") or "", reverse=True)
    hour = utcnow().hour
    greet = "Good evening" if hour >= 17 or hour < 5 else ("Good morning" if hour < 12 else "Good afternoon")
    return {
        "greeting": greet,
        "upcoming_appointment": upcoming[0] if upcoming else None,
        "recent_activity": [_ser_dt(e) for e in sorted([e for e in store.timeline if e["patient_id"] == principal.patient_id], key=lambda e: e["occurred_at"], reverse=True)[:4]],
        "latest_report": reports[0] if reports else None,
        "recovery": [p for p in store.recovery_plans.values() if p["patient_id"] == principal.patient_id],
        "medications": [m for m in store.medications.values() if m["patient_id"] == principal.patient_id],
        "first_name": (store.profiles.get(principal.user_id) or {}).get("full_name", "").split(" ")[0],
        "demo": True,
    }


@router.patch("/patients/me")
def update_profile(body: ProfileUpdate, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    profile = store.profiles[principal.user_id]
    patient = store.patients[principal.patient_id]
    if body.full_name:
        profile["full_name"] = body.full_name
    if body.phone is not None:
        profile["phone"] = body.phone
    if body.preferred_language:
        profile["preferred_language"] = body.preferred_language
    if body.accessibility_preferences is not None:
        profile["accessibility_preferences"] = body.accessibility_preferences
    if body.emergency_contact_name is not None:
        patient["emergency_contact_name"] = body.emergency_contact_name
    if body.emergency_contact_phone is not None:
        patient["emergency_contact_phone"] = body.emergency_contact_phone
    return {**patient, "profile": profile}


@router.get("/documents")
def documents(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    return [_ser_doc(d) for d in store.documents.values() if d["patient_id"] == principal.patient_id]


@router.get("/search")
def global_search(q: str = "", principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    ql = q.lower().strip()
    if not ql:
        return {"results": []}
    results = []
    for r in store.reports.values():
        if r["patient_id"] == principal.patient_id and ql in (r.get("test_name") or "").lower():
            results.append({"type": "report", "title": r["test_name"], "href": f"/reports/{r['id']}"})
    for a in store.appointments.values():
        if a["patient_id"] != principal.patient_id:
            continue
        doc = store.doctors[a["doctor_id"]]
        if ql in doc["specialty"].lower() or ql in doc["full_name"].lower() or ql in "appointment":
            results.append({"type": "appointment", "title": f"{doc['full_name']} · {doc['specialty']}", "href": f"/appointments/{a['id']}"})
    for d in store.doctors.values():
        if ql in d["full_name"].lower() or ql in d["specialty"].lower():
            results.append({"type": "doctor", "title": d["full_name"], "href": f"/doctors/{d['id']}"})
    for h in store.hospitals.values():
        if ql in h["name"].lower() or ql in (h.get("description") or "").lower():
            results.append({"type": "hospital", "title": h["name"], "href": f"/hospitals/{h['id']}"})
    for m in store.medications.values():
        if m["patient_id"] == principal.patient_id and ql in m["name"].lower():
            results.append({"type": "medication", "title": m["name"], "href": "/medications"})
    for j in store.journal.values():
        if j["patient_id"] == principal.patient_id and ql in (j["title"] + (j.get("summary") or "")).lower():
            results.append({"type": "memory", "title": j["title"], "href": "/health"})
    for e in store.timeline:
        if e["patient_id"] == principal.patient_id and ql in e["title"].lower():
            results.append({"type": "timeline", "title": e["title"], "href": "/timeline"})
    return {"results": results[:20]}


@router.patch("/ai/conversations/{cid}")
def rename_conversation(cid: str, body: RenameConversation, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    c = store.conversations.get(cid)
    if not c or c["patient_id"] != principal.patient_id:
        raise HTTPException(404, detail="That conversation could not be found.")
    c["title"] = body.title
    return c


@router.post("/medications/{mid}/log")
def medication_log(mid: str, body: MedicationLog, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    med = store.medications.get(mid)
    if not med or med["patient_id"] != principal.patient_id:
        raise HTTPException(404, detail="That medication could not be found.")
    if body.action not in ("taken", "skip"):
        raise HTTPException(400, detail="Choose taken or skip.")
    store.medication_logs.append(
        {"id": new_id(), "medication_id": mid, "action": body.action, "period": body.period, "at": utcnow(), "patient_id": principal.patient_id}
    )
    return {"ok": True, "history": [l for l in store.medication_logs if l["medication_id"] == mid]}


@router.get("/caregivers")
def caregivers(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    return [_ser_dt(c) for c in store.caregivers.values() if c["patient_id"] == principal.patient_id]


@router.post("/caregivers")
def invite_caregiver(body: CaregiverInvite, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    if not body.confirmed:
        raise HTTPException(400, detail="You're about to invite a caregiver. Continue?")
    cid = new_id()
    store.caregivers[cid] = {
        "id": cid,
        "patient_id": principal.patient_id,
        "name": body.name,
        "email": str(body.email),
        "permissions": body.permissions,
        "status": "active",
        "created_at": utcnow(),
    }
    store.audit_event(principal.user_id, principal.role, "caregiver.invited", "caregiver", cid, {"permissions": body.permissions})
    return store.caregivers[cid]


@router.delete("/caregivers/{cid}")
def revoke_caregiver(cid: str, confirmed: bool = False, principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    c = store.caregivers.get(cid)
    if not c or c["patient_id"] != principal.patient_id:
        raise HTTPException(404, detail="That caregiver could not be found.")
    if not confirmed:
        raise HTTPException(400, detail="You're about to revoke caregiver access. Continue?")
    c["status"] = "revoked"
    return c


@router.post("/ai/navigate")
def ai_navigate(body: NavigateRequest, principal: Principal = Depends(require_roles("PATIENT"))):
    return navigate_need(body.query)


@router.post("/notifications/{nid}/read")
def read_notification(nid: str, principal: Principal = Depends(get_principal), store: Store = Depends(get_store)):
    n = store.notifications.get(nid)
    if not n or n["user_id"] != principal.user_id:
        raise HTTPException(404, detail="That notification could not be found.")
    n["read"] = True
    return n


@router.post("/demo/simulate-prescription")
def simulate_prescription(principal: Principal = Depends(require_roles("PATIENT")), store: Store = Depends(get_store)):
    from app.data import ids as I

    rx_id = new_id()
    store.prescriptions[rx_id] = {
        "id": rx_id,
        "patient_id": principal.patient_id,
        "doctor_id": I.DOCTOR_SHARMA,
        "appointment_id": None,
        "document_id": None,
        "issued_at": utcnow().date().isoformat(),
        "notes": "DEMO ONLY — simulated clinician upload.",
    }
    store.add_notification(
        principal.user_id,
        "doctor_uploaded_document",
        "New prescription added",
        "Dr. Ananya Sharma added a prescription to your Health Record (demo simulation).",
        "prescription",
        rx_id,
    )
    store.add_timeline(principal.patient_id, "prescription", "Prescription added after consultation", "prescriptions", rx_id, "pill")
    return {"ok": True, "id": rx_id}
