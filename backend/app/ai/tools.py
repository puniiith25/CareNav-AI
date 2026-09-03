from __future__ import annotations

from datetime import datetime
from typing import Any, Callable

from app.data.store import Store
from app.security.authz import Principal, doctor_may_access_patient, patient_owns
from app.services.clinical import compare_reports, list_availability, serialize_appointment


class ToolDenied(Exception):
    def __init__(self, message: str) -> None:
        self.message = message
        super().__init__(message)


def _patient_scope(store: Store, principal: Principal, patient_id: str | None) -> str:
    if principal.role == "PATIENT":
        if not principal.patient_id:
            raise ToolDenied("You don't have permission to view this record.")
        if patient_id and patient_id != principal.patient_id:
            raise ToolDenied("You don't have permission to view this record.")
        return principal.patient_id
    if principal.role == "DOCTOR":
        if not patient_id:
            raise ToolDenied("Patient information has not been shared with you.")
        ok, msg = doctor_may_access_patient(store, principal, patient_id)
        if not ok:
            raise ToolDenied(msg or "Patient information has not been shared with you.")
        return patient_id
    raise ToolDenied("You don't have permission to view this record.")


def get_patient_profile(store: Store, principal: Principal, **kwargs: Any) -> dict:
    pid = _patient_scope(store, principal, kwargs.get("patient_id"))
    patient = store.patients[pid]
    profile = store.profiles[patient["user_id"]]
    return {"patient": patient, "profile": profile}


def get_health_records(store: Store, principal: Principal, **kwargs: Any) -> list:
    pid = _patient_scope(store, principal, kwargs.get("patient_id"))
    return [r for r in store.health_records.values() if r["patient_id"] == pid]


def get_medical_reports(store: Store, principal: Principal, **kwargs: Any) -> list:
    pid = _patient_scope(store, principal, kwargs.get("patient_id"))
    reports = [r for r in store.reports.values() if r["patient_id"] == pid]
    reports.sort(key=lambda r: r.get("report_date") or "", reverse=True)
    return reports


def get_report_details(store: Store, principal: Principal, **kwargs: Any) -> dict:
    rid = kwargs.get("report_id")
    report = store.reports.get(rid)
    if not report:
        raise ToolDenied("I don't have enough information in your records to answer that reliably.")
    _patient_scope(store, principal, report["patient_id"])
    values = [v for v in store.report_values if v["report_id"] == rid]
    doc = store.documents.get(report.get("document_id"))
    return {"report": report, "values": values, "source_document": doc}


def compare_reports_tool(store: Store, principal: Principal, **kwargs: Any) -> dict:
    reports = get_medical_reports(store, principal, **kwargs)
    if len(reports) < 2:
        raise ToolDenied("I don't have enough information in your records to answer that reliably.")
    a, b = reports[1]["id"], reports[0]["id"]
    if kwargs.get("report_a") and kwargs.get("report_b"):
        a, b = kwargs["report_a"], kwargs["report_b"]
        _patient_scope(store, principal, store.reports[a]["patient_id"])
        _patient_scope(store, principal, store.reports[b]["patient_id"])
    return compare_reports(store, a, b)


def get_health_timeline(store: Store, principal: Principal, **kwargs: Any) -> list:
    pid = _patient_scope(store, principal, kwargs.get("patient_id"))
    events = [e for e in store.timeline if e["patient_id"] == pid]
    events.sort(key=lambda e: e["occurred_at"], reverse=True)
    return events


def get_medications(store: Store, principal: Principal, **kwargs: Any) -> dict:
    pid = _patient_scope(store, principal, kwargs.get("patient_id"))
    meds = [m for m in store.medications.values() if m["patient_id"] == pid]
    schedule = []
    for m in meds:
        for s in store.schedules:
            if s["medication_id"] == m["id"]:
                schedule.append({**s, "medication": m})
    return {"medications": meds, "schedule": schedule}


def get_appointments(store: Store, principal: Principal, **kwargs: Any) -> list:
    if principal.role == "PATIENT":
        rows = [a for a in store.appointments.values() if a["patient_id"] == principal.patient_id]
    elif principal.role == "DOCTOR":
        rows = [a for a in store.appointments.values() if a["doctor_id"] == principal.doctor_id]
    else:
        raise ToolDenied("You don't have permission to view this record.")
    return [serialize_appointment(store, a) for a in rows]


def find_healthcare_services(store: Store, principal: Principal, **kwargs: Any) -> list:
    query = (kwargs.get("query") or "").lower()
    out = []
    for s in store.services.values():
        if not query or query in s["name"].lower() or query in s["code"]:
            out.append(s)
    return out


def find_hospitals(store: Store, principal: Principal, **kwargs: Any) -> list:
    specialty = (kwargs.get("specialty") or kwargs.get("query") or "").lower()
    results = []
    for h in store.hospitals.values():
        depts = [d for d in store.departments.values() if d["hospital_id"] == h["id"]]
        if specialty and not any(specialty in (d["name"] + d.get("specialty_code", "")).lower() for d in depts):
            if specialty not in (h["name"] + h["description"]).lower():
                continue
        results.append({**h, "departments": depts, "is_demo": True})
    return results


def find_doctors(store: Store, principal: Principal, **kwargs: Any) -> list:
    q = (kwargs.get("query") or kwargs.get("specialty") or "").lower()
    hid = kwargs.get("hospital_id")
    out = []
    for d in store.doctors.values():
        if hid and d["hospital_id"] != hid:
            continue
        blob = (d["full_name"] + d["specialty"]).lower()
        if q and q not in blob:
            continue
        out.append({**d, "hospital": store.hospitals[d["hospital_id"]]})
    return out


def get_doctor_availability(store: Store, principal: Principal, **kwargs: Any) -> dict:
    doctor_id = kwargs.get("doctor_id")
    if not doctor_id or doctor_id not in store.doctors:
        raise ToolDenied("I don't have enough information in your records to answer that reliably.")
    day = kwargs.get("day")
    if isinstance(day, str):
        day_dt = datetime.fromisoformat(day.replace("Z", "+00:00"))
    else:
        day_dt = datetime(2026, 9, 3, tzinfo=datetime.now().astimezone().tzinfo)
    return {"doctor": store.doctors[doctor_id], "slots": list_availability(store, doctor_id, day_dt)}


def create_appointment_tool(store: Store, principal: Principal, **kwargs: Any) -> dict:
    raise ToolDenied("Booking requires explicit confirmation in the appointment flow. I cannot create appointments silently.")


def cancel_appointment_tool(store: Store, principal: Principal, **kwargs: Any) -> dict:
    raise ToolDenied("Cancelling an appointment requires explicit confirmation in the app.")


def get_hospital_details(store: Store, principal: Principal, **kwargs: Any) -> dict:
    hid = kwargs.get("hospital_id")
    h = store.hospitals.get(hid)
    if not h:
        raise ToolDenied("I don't have enough information in your records to answer that reliably.")
    doctors = [d for d in store.doctors.values() if d["hospital_id"] == hid]
    depts = [d for d in store.departments.values() if d["hospital_id"] == hid]
    return {"hospital": h, "departments": depts, "doctors": doctors, "disclaimer": "Demo facility — not a real-world verified provider."}


def get_consent_status(store: Store, principal: Principal, **kwargs: Any) -> list:
    if principal.role == "PATIENT":
        return [c for c in store.consents.values() if c["patient_id"] == principal.patient_id]
    if principal.role == "DOCTOR":
        return [c for c in store.consents.values() if c["doctor_id"] == principal.doctor_id]
    raise ToolDenied("You don't have permission to view this record.")


def grant_consent_tool(store: Store, principal: Principal, **kwargs: Any) -> dict:
    raise ToolDenied("Sharing records requires explicit confirmation. Use the consent screen.")


def revoke_consent_tool(store: Store, principal: Principal, **kwargs: Any) -> dict:
    raise ToolDenied("Revoking access requires explicit confirmation. Use the consent screen.")


def get_recovery_plan(store: Store, principal: Principal, **kwargs: Any) -> dict:
    pid = _patient_scope(store, principal, kwargs.get("patient_id"))
    plans = [p for p in store.recovery_plans.values() if p["patient_id"] == pid]
    tasks = [t for t in store.recovery_tasks if any(t["plan_id"] == p["id"] for p in plans)]
    return {"plans": plans, "tasks": tasks}


def get_health_memory(store: Store, principal: Principal, **kwargs: Any) -> dict:
    pid = _patient_scope(store, principal, kwargs.get("patient_id"))
    return {
        "journal": [j for j in store.journal.values() if j["patient_id"] == pid],
        "conversations": [c for c in store.conversations.values() if c["patient_id"] == pid],
    }


def get_doctor_profile(store: Store, principal: Principal, **kwargs: Any) -> dict:
    did = kwargs.get("doctor_id")
    d = store.doctors.get(did)
    if not d:
        raise ToolDenied("I don't have enough information in your records to answer that reliably.")
    return {**d, "hospital": store.hospitals[d["hospital_id"]]}


def get_hospital_profile(store: Store, principal: Principal, **kwargs: Any) -> dict:
    return get_hospital_details(store, principal, **kwargs)


def create_health_memory_entry(store: Store, principal: Principal, **kwargs: Any) -> dict:
    raise ToolDenied("Saving to Health Memory requires your confirmation in the app.")


def create_consent(store: Store, principal: Principal, **kwargs: Any) -> dict:
    raise ToolDenied("Sharing records requires explicit confirmation. Use the consent screen.")


def get_consents(store: Store, principal: Principal, **kwargs: Any) -> list:
    return get_consent_status(store, principal, **kwargs)


def get_notifications(store: Store, principal: Principal, **kwargs: Any) -> list:
    rows = [n for n in store.notifications.values() if n["user_id"] == principal.user_id]
    rows.sort(key=lambda n: n["created_at"], reverse=True)
    return rows


TOOL_REGISTRY: dict[str, Callable[..., Any]] = {
    "get_patient_profile": get_patient_profile,
    "get_health_records": get_health_records,
    "get_medical_reports": get_medical_reports,
    "get_report_details": get_report_details,
    "compare_reports": compare_reports_tool,
    "get_health_timeline": get_health_timeline,
    "get_medications": get_medications,
    "get_appointments": get_appointments,
    "find_healthcare_services": find_healthcare_services,
    "find_hospitals": find_hospitals,
    "find_doctors": find_doctors,
    "get_doctor_availability": get_doctor_availability,
    "create_appointment": create_appointment_tool,
    "cancel_appointment": cancel_appointment_tool,
    "get_hospital_details": get_hospital_details,
    "get_consent_status": get_consent_status,
    "grant_consent": grant_consent_tool,
    "revoke_consent": revoke_consent_tool,
    "get_recovery_plan": get_recovery_plan,
    "get_notifications": get_notifications,
    "get_health_memory": get_health_memory,
    "get_doctor_profile": get_doctor_profile,
    "get_hospital_profile": get_hospital_profile,
    "get_report": get_report_details,
    "create_health_memory_entry": create_health_memory_entry,
    "create_consent": create_consent,
    "get_consents": get_consents,
}


def execute_tool(store: Store, principal: Principal, name: str, **kwargs: Any) -> dict:
    fn = TOOL_REGISTRY.get(name)
    if not fn:
        raise ToolDenied("Unknown tool.")
    # Never trust model-supplied patient/doctor ids for patients
    if principal.role == "PATIENT":
        kwargs.pop("patient_id", None)
        kwargs["patient_id"] = principal.patient_id
    try:
        result = fn(store, principal, **kwargs)
        return {"ok": True, "tool": name, "result": result}
    except ToolDenied as exc:
        return {"ok": False, "tool": name, "error": exc.message}
