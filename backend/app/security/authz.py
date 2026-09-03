from dataclasses import dataclass

from fastapi import HTTPException, status

from app.data.store import Store


@dataclass
class Principal:
    user_id: str
    role: str
    email: str
    patient_id: str | None = None
    doctor_id: str | None = None
    hospital_id: str | None = None


def unauthorized(msg: str = "You don't have permission to view this record.") -> None:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=msg)


def patient_owns(principal: Principal, patient_id: str) -> bool:
    return principal.role == "PATIENT" and principal.patient_id == patient_id


def doctor_may_access_patient(store: Store, principal: Principal, patient_id: str) -> tuple[bool, str | None]:
    if principal.role != "DOCTOR" or not principal.doctor_id:
        return False, "You don't have permission to view this record."
    consent = store.active_consent(principal.doctor_id, patient_id)
    if consent is None:
        return False, "Patient information has not been shared with you."
    if store.consent_expired(consent):
        return False, "Access to this patient's records has expired."
    if consent["status"] == "REVOKED":
        return False, "Access to this patient's records has been revoked."
    return True, None


def assert_patient_or_authorized_doctor(store: Store, principal: Principal, patient_id: str) -> None:
    if principal.role == "SYSTEM_ADMIN":
        return
    if patient_owns(principal, patient_id):
        return
    ok, msg = doctor_may_access_patient(store, principal, patient_id)
    if not ok:
        unauthorized(msg or "You don't have permission to view this record.")


def assert_hospital_admin(principal: Principal, hospital_id: str) -> None:
    if principal.role == "SYSTEM_ADMIN":
        return
    if principal.role != "HOSPITAL_ADMIN" or principal.hospital_id != hospital_id:
        unauthorized("You don't have permission to manage this hospital.")
