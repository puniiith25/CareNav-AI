from __future__ import annotations

import threading
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from typing import Any

from app.data import ids as I
from app.security.passwords import hash_password
from app.utils.time import iso, new_id, utcnow

DEMO_PASSWORD = "CareNavDemo!23"


def _dt(days: int, hour: int = 10, minute: int = 0) -> datetime:
    base = datetime(2026, 9, 2, hour, minute, tzinfo=timezone.utc)
    return base + timedelta(days=days)


class Store:
    """In-memory replica of the CareNav schema for local/demo mode."""

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self.users: dict[str, dict] = {}
        self.profiles: dict[str, dict] = {}
        self.patients: dict[str, dict] = {}
        self.hospitals: dict[str, dict] = {}
        self.hospital_admins: dict[str, dict] = {}
        self.departments: dict[str, dict] = {}
        self.specialties: list[dict] = []
        self.services: dict[str, dict] = {}
        self.hospital_services: list[tuple[str, str]] = []
        self.doctors: dict[str, dict] = {}
        self.availability: list[dict] = []
        self.appointments: dict[str, dict] = {}
        self.documents: dict[str, dict] = {}
        self.appointment_documents: list[tuple[str, str]] = []
        self.reports: dict[str, dict] = {}
        self.report_values: list[dict] = []
        self.prescriptions: dict[str, dict] = {}
        self.medications: dict[str, dict] = {}
        self.schedules: list[dict] = []
        self.consultations: dict[str, dict] = {}
        self.health_records: dict[str, dict] = {}
        self.timeline: list[dict] = []
        self.conversations: dict[str, dict] = {}
        self.messages: list[dict] = []
        self.journal: dict[str, dict] = {}
        self.consents: dict[str, dict] = {}
        self.consent_items: list[dict] = []
        self.recovery_plans: dict[str, dict] = {}
        self.recovery_tasks: list[dict] = []
        self.notifications: dict[str, dict] = {}
        self.audit: list[dict] = []
        self.facilities: list[dict] = []
        self.maps: dict[str, dict] = {}
        self.floors: list[dict] = []
        self.rooms: list[dict] = []
        self.routes: list[dict] = []
        self.knowledge: list[dict] = []
        self.booked_slots: set[tuple[str, str]] = set()
        self.caregivers: dict[str, dict] = {}
        self.medication_logs: list[dict] = []
        self.family_members: dict[str, dict] = {}
        self._seed()

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return deepcopy(
                {
                    "users": self.users,
                    "patients": self.patients,
                    "doctors": self.doctors,
                }
            )

    def _seed(self) -> None:
        hashed = hash_password(DEMO_PASSWORD)
        self._add_user(I.PATIENT_USER, "demo.patient@carenav.demo", "PATIENT", hashed, "Arjun Mehta")
        self._add_user(I.DOCTOR_USER, "dr.sharma@carenav.demo", "DOCTOR", hashed, "Dr. Ananya Sharma")
        self._add_user(I.ADMIN_USER, "admin.city@carenav.demo", "HOSPITAL_ADMIN", hashed, "Kiran Mehta")
        self._add_user(I.PATIENT_B_USER, "patient.b@carenav.demo", "PATIENT", hashed, "Rohan Iyer")

        self.patients[I.PATIENT_ID] = {
            "id": I.PATIENT_ID,
            "user_id": I.PATIENT_USER,
            "emergency_contact_name": "Neha Mehta",
            "emergency_contact_phone": "+91 90000 11111",
        }
        self.patients[I.PATIENT_B_ID] = {
            "id": I.PATIENT_B_ID,
            "user_id": I.PATIENT_B_USER,
            "emergency_contact_name": "Meera Iyer",
            "emergency_contact_phone": "+91 90000 22222",
        }

        self.hospitals = {
            I.HOSPITAL_CITY: {
                "id": I.HOSPITAL_CITY,
                "name": "Bengaluru Heart & Multispecialty Hospital",
                "slug": "bengaluru-heart-multispecialty",
                "is_demo": True,
                "ownership": "private",
                "address": "12 Demo Health Avenue, Bengaluru (fictional)",
                "phone": "+91 80 4000 1000",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "operating_hours": {"mon_fri": "08:00–20:00", "sat": "08:00–14:00", "emergency": "24x7"},
                "emergency_available": True,
                "open_now": True,
                "rating": 4.6,
                "photos": [],
                "description": "Demo Facility — fictional multi-specialty hospital for CareNav demos.",
                "accessibility": ["wheelchair", "accessible restrooms", "parking"],
            },
            I.HOSPITAL_RIVERSIDE: {
                "id": I.HOSPITAL_RIVERSIDE,
                "name": "South City Orthopedic Center",
                "slug": "south-city-orthopedic",
                "is_demo": True,
                "ownership": "private",
                "address": "88 Koramangala Demo Road, Bengaluru (fictional)",
                "phone": "+91 80 4000 2000",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "operating_hours": {"mon_sat": "09:00–18:00"},
                "emergency_available": False,
                "open_now": True,
                "rating": 4.3,
                "photos": [],
                "description": "Demo Facility — fictional orthopedic and physiotherapy center.",
                "accessibility": ["wheelchair"],
            },
            I.HOSPITAL_NEURO: {
                "id": I.HOSPITAL_NEURO,
                "name": "Bengaluru Neuro & Wellness Hospital",
                "slug": "bengaluru-neuro-wellness",
                "is_demo": True,
                "ownership": "private",
                "address": "21 Indiranagar Demo Street, Bengaluru (fictional)",
                "phone": "+91 80 4000 4000",
                "latitude": 12.9784,
                "longitude": 77.6408,
                "operating_hours": {"daily": "08:00–20:00"},
                "emergency_available": True,
                "open_now": True,
                "rating": 4.5,
                "photos": [],
                "description": "Demo Facility — fictional neurology and neurosurgery hospital.",
                "accessibility": ["wheelchair", "accessible parking"],
            },
            I.HOSPITAL_VISION: {
                "id": I.HOSPITAL_VISION,
                "name": "VisionCare Bengaluru",
                "slug": "visioncare-bengaluru",
                "is_demo": True,
                "ownership": "private",
                "address": "9 Whitefield Demo Lane, Bengaluru (fictional)",
                "phone": "+91 80 4000 5000",
                "latitude": 12.9698,
                "longitude": 77.7499,
                "operating_hours": {"mon_sat": "09:00–19:00"},
                "emergency_available": False,
                "open_now": True,
                "rating": 4.7,
                "photos": [],
                "description": "Demo Facility — fictional ophthalmology and eye diagnostics center.",
                "accessibility": ["wheelchair"],
            },
            I.HOSPITAL_LAKESIDE: {
                "id": I.HOSPITAL_LAKESIDE,
                "name": "CityCare General Hospital",
                "slug": "citycare-general",
                "is_demo": True,
                "ownership": "government",
                "address": "5 Hebbal Demo Park, Bengaluru (fictional)",
                "phone": "+91 80 4000 3000",
                "latitude": 13.0358,
                "longitude": 77.5970,
                "operating_hours": {"daily": "00:00–24:00"},
                "emergency_available": True,
                "open_now": True,
                "rating": 4.2,
                "photos": [],
                "description": "Demo Facility — fictional general hospital with emergency and pediatrics.",
                "accessibility": ["wheelchair", "accessible parking"],
            },
        }

        self.hospital_admins[I.ADMIN_USER] = {
            "id": new_id(),
            "user_id": I.ADMIN_USER,
            "hospital_id": I.HOSPITAL_CITY,
        }

        cardio = I.DEPT_CARDIO
        ortho = new_id()
        self.departments = {
            cardio: {"id": cardio, "hospital_id": I.HOSPITAL_CITY, "name": "Cardiology", "specialty_code": "cardiology", "floor_label": "3rd Floor"},
            ortho: {"id": ortho, "hospital_id": I.HOSPITAL_CITY, "name": "Orthopedics", "specialty_code": "orthopedics", "floor_label": "2nd Floor"},
            new_id(): {"id": None, "hospital_id": I.HOSPITAL_CITY, "name": "Emergency", "specialty_code": "emergency", "floor_label": "Ground"},
        }
        # fix the emergency dept id
        emergency_id = new_id()
        internal_id = new_id()
        self.departments = {
            cardio: {"id": cardio, "hospital_id": I.HOSPITAL_CITY, "name": "Cardiology", "specialty_code": "cardiology", "floor_label": "3rd Floor"},
            ortho: {"id": ortho, "hospital_id": I.HOSPITAL_CITY, "name": "Orthopedics", "specialty_code": "orthopedics", "floor_label": "2nd Floor"},
            emergency_id: {"id": emergency_id, "hospital_id": I.HOSPITAL_CITY, "name": "Emergency", "specialty_code": "emergency", "floor_label": "Ground"},
            internal_id: {"id": internal_id, "hospital_id": I.HOSPITAL_CITY, "name": "Internal Medicine", "specialty_code": "general", "floor_label": "1st Floor"},
        }
        self._emergency_dept = emergency_id
        self._ortho_dept = ortho

        for hid, names in [
            (I.HOSPITAL_RIVERSIDE, [("Orthopedics", "orthopedics"), ("Physiotherapy", "physiotherapy"), ("Diagnostics", "diagnostics")]),
            (I.HOSPITAL_NEURO, [("Neurology", "neurology"), ("Neurosurgery", "neurology"), ("Diagnostics", "diagnostics")]),
            (I.HOSPITAL_VISION, [("Ophthalmology", "ophthalmology"), ("Eye Diagnostics", "diagnostics")]),
            (I.HOSPITAL_LAKESIDE, [("Emergency", "emergency"), ("Pediatrics", "pediatrics"), ("General Medicine", "general"), ("Diagnostics", "diagnostics")]),
        ]:
            for name, code in names:
                did = new_id()
                self.departments[did] = {"id": did, "hospital_id": hid, "name": name, "specialty_code": code, "floor_label": "1"}

        self.specialties = [
            {"code": "cardiology", "name": "Cardiology", "educational_blurb": "Heart and blood-vessel related care. Educational only — not a diagnosis."},
            {"code": "orthopedics", "name": "Orthopedics", "educational_blurb": "Bones, joints, and musculoskeletal care."},
            {"code": "ophthalmology", "name": "Eye care", "educational_blurb": "Vision and eye health services."},
            {"code": "emergency", "name": "Emergency", "educational_blurb": "Immediate professional medical attention."},
            {"code": "diagnostics", "name": "Diagnostics", "educational_blurb": "Laboratory and imaging services."},
        ]

        svc_defs = [
            ("cardiology", "Cardiology", "HOSPITAL"),
            ("orthopedics", "Orthopedics", "HOSPITAL"),
            ("neurology", "Neurology", "HOSPITAL"),
            ("ophthalmology", "Ophthalmology", "EYE_CENTER"),
            ("oncology", "Oncology", "HOSPITAL"),
            ("pediatrics", "Pediatrics", "HOSPITAL"),
            ("dermatology", "Dermatology", "CLINIC"),
            ("dental", "Dental clinic", "DENTAL"),
            ("emergency", "Emergency", "EMERGENCY"),
            ("diagnostics", "Diagnostic center", "DIAGNOSTIC_CENTER"),
            ("pharmacy", "Pharmacy", "PHARMACY"),
            ("physiotherapy", "Physiotherapy", "CLINIC"),
        ]
        for code, name, cat in svc_defs:
            sid = new_id()
            self.services[sid] = {"id": sid, "code": code, "name": name, "category": cat, "description": name}
            if code in ("cardiology", "orthopedics", "emergency", "diagnostics", "pharmacy", "internal"):
                self.hospital_services.append((I.HOSPITAL_CITY, sid))
            if code in ("orthopedics", "diagnostics", "pharmacy", "physiotherapy"):
                self.hospital_services.append((I.HOSPITAL_RIVERSIDE, sid))
            if code in ("diagnostics", "emergency", "pediatrics"):
                self.hospital_services.append((I.HOSPITAL_LAKESIDE, sid))
            if code in ("neurology", "diagnostics", "emergency"):
                self.hospital_services.append((I.HOSPITAL_NEURO, sid))
            if code in ("ophthalmology", "diagnostics"):
                self.hospital_services.append((I.HOSPITAL_VISION, sid))

        extra_facilities = [
            ("Demo Green Pharmacy", "PHARMACY", 12.9730, 77.5900, False),
            ("Demo Sight Eye Center", "EYE_CENTER", 12.9788, 77.6090, False),
            ("Demo Smile Dental", "DENTAL", 12.9600, 77.6010, False),
            ("Demo Emergency Hub", "EMERGENCY", 12.9820, 77.5800, True),
        ]
        self.poi = []
        for name, cat, lat, lng, em in extra_facilities:
            self.poi.append(
                {
                    "id": new_id(),
                    "name": name,
                    "category": cat,
                    "is_demo": True,
                    "latitude": lat,
                    "longitude": lng,
                    "emergency_available": em,
                    "address": "Fictional demo location, Bengaluru",
                    "rating": 4.2,
                    "ownership": "private",
                    "open_now": True,
                }
            )

        self.doctors[I.DOCTOR_SHARMA] = {
            "id": I.DOCTOR_SHARMA,
            "user_id": I.DOCTOR_USER,
            "hospital_id": I.HOSPITAL_CITY,
            "department_id": cardio,
            "full_name": "Dr. Ananya Sharma",
            "specialty": "Cardiology",
            "qualifications": "MBBS, MD (Cardiology)",
            "experience_years": 12,
            "languages": ["English", "Hindi", "Kannada"],
            "consultation_type": "in_person",
            "bio": "Fictional cardiologist for CareNav demos.",
        }
        self.doctors[I.DOCTOR_RAO] = {
            "id": I.DOCTOR_RAO,
            "user_id": None,
            "hospital_id": I.HOSPITAL_CITY,
            "department_id": ortho,
            "full_name": "Dr. Kavya Rao",
            "specialty": "Orthopedics",
            "qualifications": "MBBS, MS (Ortho)",
            "experience_years": 9,
            "languages": ["English", "Kannada"],
            "consultation_type": "in_person",
            "bio": "Fictional orthopedic surgeon for demos.",
        }

        names = [
            ("Dr. Rahul Menon", "Cardiology", I.HOSPITAL_CITY),
            ("Dr. Leela Krishnan", "Internal Medicine", I.HOSPITAL_CITY),
            ("Dr. Sameer Joshi", "Orthopedics", I.HOSPITAL_RIVERSIDE),
            ("Dr. Arjun Nair", "Neurology", I.HOSPITAL_NEURO),
            ("Dr. Meera Kapoor", "Neurology", I.HOSPITAL_NEURO),
            ("Dr. Priya Iyer", "Ophthalmology", I.HOSPITAL_VISION),
            ("Dr. Nisha Patel", "Pediatrics", I.HOSPITAL_LAKESIDE),
            ("Dr. Omar Farooq", "Emergency Medicine", I.HOSPITAL_LAKESIDE),
            ("Dr. Hannah Cole", "Emergency Medicine", I.HOSPITAL_CITY),
            ("Dr. Elena Rossi", "Diagnostics", I.HOSPITAL_LAKESIDE),
        ]
        for name, spec, hid in names:
            did = new_id()
            dept = next((d["id"] for d in self.departments.values() if d["hospital_id"] == hid and spec.lower().split()[0] in d["name"].lower()), None)
            self.doctors[did] = {
                "id": did,
                "user_id": None,
                "hospital_id": hid,
                "department_id": dept,
                "full_name": name,
                "specialty": spec,
                "qualifications": "MBBS",
                "experience_years": 7,
                "languages": ["English"],
                "consultation_type": "in_person",
                "bio": "Fictional clinician for CareNav demos.",
            }

        for doc in self.doctors.values():
            for wd in range(1, 6):
                self.availability.append(
                    {
                        "id": new_id(),
                        "doctor_id": doc["id"],
                        "weekday": wd,
                        "start_time": "09:00",
                        "end_time": "17:00",
                        "slot_minutes": 20,
                    }
                )

        # Previous completed appointment
        prev_appt = new_id()
        self.appointments[prev_appt] = {
            "id": prev_appt,
            "patient_id": I.PATIENT_ID,
            "doctor_id": I.DOCTOR_SHARMA,
            "hospital_id": I.HOSPITAL_CITY,
            "department_id": cardio,
            "starts_at": _dt(-5, 11, 0),
            "ends_at": _dt(-5, 11, 20),
            "status": "COMPLETED",
            "reason": "Follow-up after blood work",
            "notes": "Discussed lipid panel from previous report.",
        }

        tomorrow = datetime(2026, 9, 3, 16, 30, tzinfo=timezone.utc)
        self.appointments[I.APPT_TODAY] = {
            "id": I.APPT_TODAY,
            "patient_id": I.PATIENT_ID,
            "doctor_id": I.DOCTOR_SHARMA,
            "hospital_id": I.HOSPITAL_CITY,
            "department_id": cardio,
            "starts_at": tomorrow,
            "ends_at": tomorrow + timedelta(minutes=20),
            "status": "CONFIRMED",
            "reason": "Cardiology consultation",
            "notes": "",
        }
        self.booked_slots.add((I.DOCTOR_SHARMA, iso(tomorrow)))
        self.consents[I.CONSENT_DEMO] = {
            "id": I.CONSENT_DEMO,
            "patient_id": I.PATIENT_ID,
            "doctor_id": I.DOCTOR_SHARMA,
            "appointment_id": I.APPT_TODAY,
            "status": "ACTIVE",
            "duration_label": "7 days",
            "starts_at": utcnow(),
            "expires_at": utcnow() + timedelta(days=7),
            "created_at": utcnow(),
        }
        self.consent_items.append({"id": new_id(), "consent_id": I.CONSENT_DEMO, "item_type": "reports", "resource_id": I.REPORT_LATEST})
        self.consent_items.append({"id": new_id(), "consent_id": I.CONSENT_DEMO, "item_type": "previous_visits", "resource_id": None})

        self.documents[I.DOC_PREV] = {
            "id": I.DOC_PREV,
            "patient_id": I.PATIENT_ID,
            "uploaded_by": I.PATIENT_USER,
            "document_type": "lab_report",
            "title": "Lipid Profile — August 2026",
            "storage_bucket": "medical-documents",
            "storage_path": f"{I.PATIENT_USER}/{I.DOC_PREV}.pdf",
            "mime_type": "application/pdf",
            "status": "READY",
            "source": "patient",
            "appointment_id": prev_appt,
            "created_at": _dt(-22),
        }
        self.documents[I.DOC_LATEST] = {
            "id": I.DOC_LATEST,
            "patient_id": I.PATIENT_ID,
            "uploaded_by": I.PATIENT_USER,
            "document_type": "lab_report",
            "title": "Lipid panel — September 2026",
            "storage_bucket": "medical-documents",
            "storage_path": f"{I.PATIENT_USER}/{I.DOC_LATEST}.pdf",
            "mime_type": "application/pdf",
            "status": "READY",
            "source": "patient",
            "appointment_id": None,
            "created_at": _dt(-1),
        }

        self._add_report(
            I.REPORT_PREV,
            I.DOC_PREV,
            date="2026-08-10",
            test_name="Lipid Profile",
            values=[
                ("LDL Cholesterol", "148", "mg/dL", "100–129", 0.92),
                ("HDL Cholesterol", "42", "mg/dL", ">40", 0.9),
                ("Triglycerides", "180", "mg/dL", "<150", 0.88),
                ("Total Cholesterol", "220", "mg/dL", "<200", 0.91),
            ],
        )
        self._add_report(
            I.REPORT_LATEST,
            I.DOC_LATEST,
            date="2026-09-01",
            test_name="Basic Metabolic Panel",
            values=[
                ("Glucose", "98", "mg/dL", "70–99", 0.93),
                ("Creatinine", "0.9", "mg/dL", "0.7–1.3", 0.91),
                ("Sodium", "139", "mmol/L", "136–145", 0.94),
                ("Potassium", "4.2", "mmol/L", "3.5–5.1", 0.92),
            ],
        )

        self.documents[I.DOC_CBC_PREV] = {
            "id": I.DOC_CBC_PREV,
            "patient_id": I.PATIENT_ID,
            "uploaded_by": I.PATIENT_USER,
            "document_type": "lab_report",
            "title": "Blood Test — August 2026",
            "storage_bucket": "medical-documents",
            "storage_path": f"{I.PATIENT_USER}/{I.DOC_CBC_PREV}.pdf",
            "mime_type": "application/pdf",
            "status": "READY",
            "source": "patient",
            "appointment_id": None,
            "created_at": _dt(-23),
        }
        self.documents[I.DOC_CBC_LATEST] = {
            "id": I.DOC_CBC_LATEST,
            "patient_id": I.PATIENT_ID,
            "uploaded_by": I.PATIENT_USER,
            "document_type": "lab_report",
            "title": "Blood Test — September 2026",
            "storage_bucket": "medical-documents",
            "storage_path": f"{I.PATIENT_USER}/{I.DOC_CBC_LATEST}.pdf",
            "mime_type": "application/pdf",
            "status": "READY",
            "source": "patient",
            "appointment_id": None,
            "created_at": _dt(-1),
        }
        self._add_report(
            I.REPORT_CBC_PREV,
            I.DOC_CBC_PREV,
            date="2026-08-10",
            test_name="Complete Blood Count",
            values=[
                ("Hemoglobin", "13.1", "g/dL", "13.0-17.0", 0.97),
                ("WBC", "7.2", "x10^9/L", "4.0-11.0", 0.95),
                ("Platelets", "215", "x10^9/L", "150-400", 0.94),
            ],
        )
        self._add_report(
            I.REPORT_CBC_LATEST,
            I.DOC_CBC_LATEST,
            date="2026-09-01",
            test_name="Complete Blood Count",
            values=[
                ("Hemoglobin", "13.8", "g/dL", "13.0-17.0", 0.98),
                ("WBC", "7.0", "x10^9/L", "4.0-11.0", 0.95),
                ("Platelets", "228", "x10^9/L", "150-400", 0.94),
            ],
        )

        rx_id = new_id()
        self.prescriptions[rx_id] = {
            "id": rx_id,
            "patient_id": I.PATIENT_ID,
            "doctor_id": I.DOCTOR_SHARMA,
            "appointment_id": prev_appt,
            "document_id": None,
            "issued_at": "2026-08-28",
            "notes": "DEMO PRESCRIPTION — synthetic data only.",
        }
        meds = [
            ("Demo Medicine A", "500 mg", "As documented", "7 days", "Take as prescribed. DEMO ONLY.", "morning"),
            ("Demo Medicine B", "As prescribed", "As documented", "7 days", "Take at night as documented. DEMO ONLY.", "night"),
        ]
        for name, dose, freq, dur, instr, period in meds:
            mid = new_id()
            self.medications[mid] = {
                "id": mid,
                "prescription_id": rx_id,
                "patient_id": I.PATIENT_ID,
                "name": name,
                "dose": dose,
                "frequency": freq,
                "duration": dur,
                "instructions": instr,
                "extracted_exactly": True,
            }
            self.schedules.append({"id": new_id(), "medication_id": mid, "period": period, "reminder_enabled": True})

        plan_id = new_id()
        self.recovery_plans[plan_id] = {
            "id": plan_id,
            "patient_id": I.PATIENT_ID,
            "title": "Post-consultation activity plan (documented)",
            "source_document_id": None,
            "status": "active",
            "created_at": _dt(-11),
        }
        for section, content in [
            ("Medications", "Continue Demo Medicine A and Demo Medicine B exactly as documented on the 28 Aug prescription."),
            ("Follow-up appointments", "Cardiology follow-up booked at Bengaluru Heart & Multispecialty Hospital (Demo Facility)."),
            ("Activity instructions", "Documented: walking 20 minutes daily as tolerated."),
            ("Warning signs explicitly documented", "Seek urgent care for chest pain, sudden breathlessness, or fainting — as written by the clinician."),
            ("Important dates", "Next cardiology visit: 3 September 2026, 4:30 PM."),
        ]:
            self.recovery_tasks.append({"id": new_id(), "plan_id": plan_id, "section": section, "content": content, "documented": True})

        self.timeline = [
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "appointment_booked", "title": "Appointment booked — Cardiology", "occurred_at": datetime(2026, 9, 2, 10, 0, tzinfo=timezone.utc), "source_table": "appointments", "source_id": I.APPT_TODAY, "icon": "calendar"},
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "report", "title": "Blood Report uploaded and analyzed", "occurred_at": datetime(2026, 9, 1, 9, 0, tzinfo=timezone.utc), "source_table": "medical_reports", "source_id": I.REPORT_CBC_LATEST, "icon": "document"},
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "report", "title": "Basic Metabolic Panel uploaded", "occurred_at": datetime(2026, 9, 1, 8, 30, tzinfo=timezone.utc), "source_table": "medical_reports", "source_id": I.REPORT_LATEST, "icon": "document"},
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "prescription", "title": "Prescription added after consultation", "occurred_at": datetime(2026, 8, 28, 17, 20, tzinfo=timezone.utc), "source_table": "prescriptions", "source_id": rx_id, "icon": "pill"},
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "consultation", "title": "Doctor visit — Cardiology consultation", "occurred_at": datetime(2026, 8, 28, 11, 0, tzinfo=timezone.utc), "source_table": "appointments", "source_id": prev_appt, "icon": "stethoscope"},
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "recovery", "title": "Recovery plan created", "occurred_at": datetime(2026, 8, 28, 17, 40, tzinfo=timezone.utc), "source_table": "recovery_plans", "source_id": plan_id, "icon": "heart"},
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "consent", "title": "Records shared with Dr. Sharma", "occurred_at": datetime(2026, 9, 2, 10, 5, tzinfo=timezone.utc), "source_table": "consents", "source_id": I.CONSENT_DEMO, "icon": "shield"},
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "report", "title": "Previous blood test uploaded", "occurred_at": datetime(2026, 8, 10, 9, 0, tzinfo=timezone.utc), "source_table": "medical_reports", "source_id": I.REPORT_CBC_PREV, "icon": "document"},
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "report", "title": "Previous lipid profile uploaded", "occurred_at": datetime(2026, 8, 10, 9, 20, tzinfo=timezone.utc), "source_table": "medical_reports", "source_id": I.REPORT_PREV, "icon": "document"},
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "memory", "title": "AI Health Journal note saved", "occurred_at": datetime(2026, 8, 12, 18, 0, tzinfo=timezone.utc), "source_table": "health_journal", "source_id": I.CONV_ID, "icon": "brain"},
            {"id": new_id(), "patient_id": I.PATIENT_ID, "event_type": "medication", "title": "Medication schedule started", "occurred_at": datetime(2026, 8, 28, 18, 0, tzinfo=timezone.utc), "source_table": "medications", "source_id": rx_id, "icon": "pill"},
        ]

        self.health_records = {
            I.REPORT_CBC_LATEST: {"id": new_id(), "patient_id": I.PATIENT_ID, "record_type": "report", "title": "Blood Test — Sep 1", "source_table": "medical_reports", "source_id": I.REPORT_CBC_LATEST, "official": True, "created_at": datetime(2026, 9, 1, tzinfo=timezone.utc)},
            I.REPORT_LATEST: {"id": new_id(), "patient_id": I.PATIENT_ID, "record_type": "report", "title": "Basic Metabolic Panel — Sep 1", "source_table": "medical_reports", "source_id": I.REPORT_LATEST, "official": True, "created_at": datetime(2026, 9, 1, tzinfo=timezone.utc)},
            I.REPORT_CBC_PREV: {"id": new_id(), "patient_id": I.PATIENT_ID, "record_type": "report", "title": "Blood Test — Aug 10", "source_table": "medical_reports", "source_id": I.REPORT_CBC_PREV, "official": True, "created_at": datetime(2026, 8, 10, tzinfo=timezone.utc)},
            I.REPORT_PREV: {"id": new_id(), "patient_id": I.PATIENT_ID, "record_type": "report", "title": "Lipid Profile — Aug 10", "source_table": "medical_reports", "source_id": I.REPORT_PREV, "official": True, "created_at": datetime(2026, 8, 10, tzinfo=timezone.utc)},
            rx_id: {"id": new_id(), "patient_id": I.PATIENT_ID, "record_type": "prescription", "title": "Prescription — Aug 28", "source_table": "prescriptions", "source_id": rx_id, "official": True, "created_at": datetime(2026, 8, 28, tzinfo=timezone.utc)},
            prev_appt: {"id": new_id(), "patient_id": I.PATIENT_ID, "record_type": "doctor_visit", "title": "Cardiology visit — Aug 28", "source_table": "appointments", "source_id": prev_appt, "official": True, "created_at": datetime(2026, 8, 28, tzinfo=timezone.utc)},
        }

        seeds = [
            (I.CONV_ID, "Can you explain my blood report?", "Your latest documented blood report is a Complete Blood Count dated 01 Sep 2026 from Demo Diagnostics. Hemoglobin 13.8 g/dL, WBC 7.0, Platelets 228. AI-generated explanation — not a medical diagnosis."),
            (new_id(), "What does hemoglobin mean?", "Hemoglobin is a protein in red blood cells that carries oxygen. Educational information only — discuss your own values with a clinician."),
            (new_id(), "I want to find a cardiologist", "A cardiology service may be relevant. Open Healthcare Map with Cardiology selected. This is not a diagnosis. Demo facilities only."),
            (new_id(), "When is my next appointment?", "You have a confirmed visit with Dr. Ananya Sharma at Bengaluru Heart & Multispecialty Hospital on 3 Sep 2026 at 4:30 PM."),
            (new_id(), "What did my doctor prescribe?", "Your records list Demo Medicine A 500 mg (morning) and Demo Medicine B at night, as documented on 28 Aug. I cannot change prescriptions."),
            (new_id(), "Compare my previous and latest reports", "Comparing documented CBC values: Hemoglobin 13.1 → 13.8, WBC 7.2 → 7.0, Platelets 215 → 228. Comparison of documented values only — not a diagnosis."),
        ]
        for i, (cid, user_q, reply) in enumerate(seeds):
            self.conversations[cid] = {
                "id": cid,
                "patient_id": I.PATIENT_ID,
                "title": user_q[:48],
                "created_at": _dt(-6 + i),
                "updated_at": _dt(-6 + i),
            }
            self.messages.append({"id": new_id(), "conversation_id": cid, "role": "user", "content": user_q, "tool_name": None, "tool_result_reference": None, "created_at": _dt(-6 + i)})
            self.messages.append({"id": new_id(), "conversation_id": cid, "role": "assistant", "content": reply, "tool_name": None, "tool_result_reference": None, "created_at": _dt(-6 + i, 10, 1)})

        cg = new_id()
        self.caregivers[cg] = {
            "id": cg,
            "patient_id": I.PATIENT_ID,
            "name": "Neha Mehta",
            "email": "neha.mehta@carenav.demo",
            "permissions": ["appointments", "medications", "recovery"],
            "status": "active",
            "created_at": _dt(-15),
        }

        # Seed Family Members for multi-profile family care
        fm_mom = new_id()
        self.family_members[fm_mom] = {
            "id": fm_mom,
            "patient_id": I.PATIENT_ID,
            "full_name": "Savitri Mehta",
            "relationship": "Mother",
            "age": 62,
            "gender": "Female",
            "blood_group": "B+",
            "allergies": ["Penicillin"],
            "chronic_conditions": ["Type 2 Diabetes", "Hypertension"],
            "notes": "Elderly mother with limited smartphone literacy. Managed by Arjun.",
            "created_at": _dt(-30),
        }
        fm_dad = new_id()
        self.family_members[fm_dad] = {
            "id": fm_dad,
            "patient_id": I.PATIENT_ID,
            "full_name": "Ramesh Mehta",
            "relationship": "Father",
            "age": 66,
            "gender": "Male",
            "blood_group": "O+",
            "allergies": [],
            "chronic_conditions": ["Joint Arthritis", "High Cholesterol"],
            "notes": "Requires quarterly lipid and orthopedic checkups.",
            "created_at": _dt(-30),
        }

        jid = new_id()
        self.journal[jid] = {
            "id": jid,
            "patient_id": I.PATIENT_ID,
            "source_type": "ai_report_explanation",
            "source_id": I.REPORT_PREV,
            "title": "August lipid panel — saved explanation",
            "summary": "AI-generated explanation of the August lipid panel. Not a medical diagnosis.",
            "user_approved": True,
            "ai_generated": True,
            "created_at": _dt(-21),
        }

        # Patient B private record — must never leak to Patient A
        b_doc = new_id()
        self.documents[b_doc] = {
            "id": b_doc,
            "patient_id": I.PATIENT_B_ID,
            "uploaded_by": I.PATIENT_B_USER,
            "document_type": "lab_report",
            "title": "Patient B private report",
            "storage_bucket": "medical-documents",
            "storage_path": f"{I.PATIENT_B_USER}/{b_doc}.pdf",
            "mime_type": "application/pdf",
            "status": "READY",
            "source": "patient",
            "appointment_id": None,
            "created_at": _dt(-5),
        }

        self._seed_indoor()
        self.knowledge = [
            {
                "id": new_id(),
                "title": "What a lipid panel measures (educational)",
                "source": "CareNav trusted education pack",
                "kind": "education",
                "content": "A lipid panel lists cholesterol and triglyceride values as printed on the lab report. Educational descriptions are not diagnoses.",
            },
            {
                "id": new_id(),
                "title": "CareNav safety policy",
                "source": "Application policy",
                "kind": "policy",
                "content": "CareNav does not diagnose disease or prescribe medicine. Patients control sharing. Official records are not created from chat unless the user confirms.",
            },
            {
                "id": new_id(),
                "title": "Knee pain — service navigation",
                "source": "Healthcare navigator",
                "kind": "navigation",
                "content": "A musculoskeletal/orthopedic service may be relevant for knee discomfort. This is not a diagnosis.",
            },
        ]

        self.add_notification(
            I.PATIENT_USER,
            "appointment_confirmed",
            "Appointment confirmed",
            "Your cardiology visit with Dr. Ananya Sharma is confirmed for 3 Sep, 4:30 PM.",
            "appointment",
            I.APPT_TODAY,
        )

        self.audit_event(I.PATIENT_USER, "PATIENT", "seeded_demo", "system", None, {"note": "synthetic data only"})

    def _add_user(self, uid: str, email: str, role: str, hashed: str, name: str) -> None:
        self.users[uid] = {
            "id": uid,
            "email": email,
            "role": role,
            "password_hash": hashed,
            "is_active": True,
        }
        self.profiles[uid] = {
            "id": new_id(),
            "user_id": uid,
            "full_name": name,
            "date_of_birth": "1992-03-14" if uid == I.PATIENT_USER else ("1988-04-12" if role == "PATIENT" else None),
            "phone": "+91 90000 00000",
            "preferred_language": "en",
            "accessibility_preferences": {},
        }

    def _add_report(self, rid: str, doc_id: str, date: str, values: list[tuple], test_name: str = "Laboratory report") -> None:
        self.reports[rid] = {
            "id": rid,
            "patient_id": I.PATIENT_ID,
            "document_id": doc_id,
            "report_date": date,
            "hospital_or_lab": "Demo Diagnostics (fictional)",
            "doctor_name": "Dr. Ananya Sharma",
            "test_name": test_name,
            "document_type": test_name,
            "notes": "Synthetic demo values.",
            "extraction_confidence": 0.91,
            "needs_verification": False,
            "created_at": utcnow(),
        }
        if not isinstance(self.report_values, list):
            self.report_values = []
        for name, value, unit, ref, conf in values:
            self.report_values.append(
                {
                    "id": new_id(),
                    "report_id": rid,
                    "test_name": name,
                    "value": value,
                    "unit": unit,
                    "reference_range": ref,
                    "notes": None,
                    "confidence": conf,
                    "source_location": "demo table",
                    "needs_verification": conf < 0.8,
                }
            )

    def _seed_indoor(self) -> None:
        map_id = new_id()
        self.maps[I.HOSPITAL_CITY] = {"id": map_id, "hospital_id": I.HOSPITAL_CITY, "title": "Demo City Hospital indoor map"}
        labels = [(0, "Ground"), (1, "First"), (2, "Second"), (3, "Third")]
        floor_ids = {}
        for level, label in labels:
            fid = new_id()
            floor_ids[level] = fid
            self.floors.append({"id": fid, "map_id": map_id, "level": level, "label": label})
        rooms_def = [
            (0, "Entrance", "entrance", 20, 80),
            (0, "Reception", "reception", 40, 80),
            (0, "Elevator", "elevator", 60, 80),
            (0, "Emergency", "emergency", 80, 40),
            (0, "Pharmacy", "pharmacy", 20, 40),
            (3, "Cardiology", "department", 40, 50),
            (3, "Room 304", "room", 70, 50),
        ]
        room_ids = {}
        for level, name, kind, x, y in rooms_def:
            rid = new_id()
            room_ids[name] = rid
            self.rooms.append({"id": rid, "floor_id": floor_ids[level], "name": name, "kind": kind, "x": x, "y": y})
        self.routes.append(
            {
                "id": new_id(),
                "map_id": map_id,
                "from_room_id": room_ids["Entrance"],
                "to_room_id": room_ids["Room 304"],
                "steps": [
                    "Entrance",
                    "Reception",
                    "Elevator",
                    "Third Floor",
                    "Cardiology",
                    "Room 304",
                ],
            }
        )

    # --- lookups ---
    def user_by_email(self, email: str) -> dict | None:
        email = email.lower()
        return next((u for u in self.users.values() if u["email"] == email), None)

    def user(self, uid: str) -> dict | None:
        return self.users.get(uid)

    def patient_for_user(self, uid: str) -> dict | None:
        return next((p for p in self.patients.values() if p["user_id"] == uid), None)

    def doctor_for_user(self, uid: str) -> dict | None:
        return next((d for d in self.doctors.values() if d.get("user_id") == uid), None)

    def admin_hospital(self, uid: str) -> str | None:
        row = self.hospital_admins.get(uid)
        return row["hospital_id"] if row else None

    def active_consent(self, doctor_id: str, patient_id: str) -> dict | None:
        matches = [
            c
            for c in self.consents.values()
            if c["doctor_id"] == doctor_id and c["patient_id"] == patient_id
        ]
        if not matches:
            return None
        matches.sort(key=lambda c: c["created_at"], reverse=True)
        # Check the most recent consent
        latest = matches[0]
        if self.consent_expired(latest):
            return latest
        return latest

    def consent_expired(self, consent: dict) -> bool:
        exp = consent.get("expires_at")
        if consent.get("status") == "EXPIRED":
            return True
        if exp and utcnow() > exp:
            consent["status"] = "EXPIRED"
            return True
        return False

    def audit_event(self, actor: str | None, role: str | None, action: str, resource_type: str | None, resource_id: str | None, metadata: dict | None = None) -> None:
        self.audit.append(
            {
                "id": new_id(),
                "actor_user_id": actor,
                "actor_role": role,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "metadata": metadata or {},
                "created_at": utcnow(),
            }
        )

    def add_notification(self, user_id: str, type_: str, title: str, body: str, resource_type: str | None, resource_id: str | None) -> dict:
        row = {
            "id": new_id(),
            "user_id": user_id,
            "type": type_,
            "title": title,
            "body": body,
            "read": False,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "created_at": utcnow(),
        }
        self.notifications[row["id"]] = row
        return row

    def add_timeline(self, patient_id: str, event_type: str, title: str, source_table: str, source_id: str, icon: str) -> None:
        self.timeline.append(
            {
                "id": new_id(),
                "patient_id": patient_id,
                "event_type": event_type,
                "title": title,
                "occurred_at": utcnow(),
                "source_table": source_table,
                "source_id": source_id,
                "icon": icon,
            }
        )


store = Store()
