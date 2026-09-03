from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    full_name: str = Field(min_length=2, max_length=120)
    date_of_birth: str | None = None
    phone: str | None = None
    preferred_language: str = "en"


class ProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    preferred_language: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    accessibility_preferences: dict | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class RenameConversation(BaseModel):
    title: str = Field(min_length=1, max_length=80)


class MedicationLog(BaseModel):
    action: str
    period: str | None = None


class FamilyMemberCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    relationship: str = Field(min_length=2, max_length=60) # Mother, Father, Spouse, Child, Sibling, Grandparent, Other
    age: int | None = None
    gender: str | None = None
    blood_group: str | None = None
    allergies: list[str] = []
    chronic_conditions: list[str] = []
    notes: str | None = None


class CaregiverInvite(BaseModel):
    name: str
    email: EmailStr
    permissions: list[str]
    confirmed: bool = False


class NavigateRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation_id: str | None = None
    image_url: str | None = None
    family_member_id: str | None = None


class BookAppointmentRequest(BaseModel):
    doctor_id: str
    starts_at: datetime
    reason: str = "Consultation"
    document_ids: list[str] = []
    share_items: list[str] = []
    duration_label: str = "7 days"
    confirmed: bool = False
    family_member_id: str | None = None
    patient_name: str | None = None


class CancelAppointmentRequest(BaseModel):
    confirmed: bool = False


class UpdateAppointmentRequest(BaseModel):
    starts_at: datetime | None = None
    reason: str | None = None
    notes: str | None = None
    family_member_id: str | None = None
    patient_name: str | None = None


class ConsentRequest(BaseModel):
    doctor_id: str
    appointment_id: str | None = None
    items: list[str]
    duration_label: str = "7 days"
    confirmed: bool = False


class MemoryAction(BaseModel):
    conversation_id: str | None = None
    document_id: str | None = None
    report_id: str | None = None
    action: str
    title: str | None = None
    summary: str | None = None


class CompareRequest(BaseModel):
    report_a: str
    report_b: str


class PrescriptionUpload(BaseModel):
    appointment_id: str
    medicines: list[dict]
    notes: str | None = None
    confirmed: bool = False


class UpdateAppointmentStatusRequest(BaseModel):
    status: str
    notes: str | None = None


class ConsultationNoteCreate(BaseModel):
    appointment_id: str
    patient_id: str
    chief_concern: str
    clinical_notes: str
    assessment: str
    plan: str
    follow_up_notes: str | None = None


class PrescriptionMedicineItem(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    dosage: str = Field(min_length=1, max_length=80)
    frequency: str = Field(min_length=1, max_length=80)
    duration: str = Field(min_length=1, max_length=80)
    instructions: str = Field(default="", max_length=300)
    period: str = "morning"  # morning, afternoon, night, all


class PrescriptionCreate(BaseModel):
    patient_id: str
    appointment_id: str | None = None
    medicines: list[PrescriptionMedicineItem]
    notes: str | None = None
    signed: bool = False


class FollowUpCreate(BaseModel):
    patient_id: str
    doctor_id: str | None = None
    follow_up_date: str  # YYYY-MM-DD
    reason: str
    documents_required: list[str] = []
    notes: str | None = None


class RecoveryTaskItem(BaseModel):
    section: str
    content: str
    completed: bool = False


class RecoveryPlanCreate(BaseModel):
    patient_id: str
    title: str
    tasks: list[RecoveryTaskItem]
    follow_up_date: str | None = None
    notes: str | None = None


class DoctorAvailabilityItem(BaseModel):
    weekday: int  # 1 (Mon) to 7 (Sun)
    start_time: str  # "09:00"
    end_time: str  # "17:00"
    slot_minutes: int = 20
    is_active: bool = True


class DoctorScheduleUpdate(BaseModel):
    availability: list[DoctorAvailabilityItem]
    consultation_type: str = "in_person"
    breaks: list[dict] = []
    leaves: list[str] = []
    max_daily_appointments: int = 25


class DoctorAIChatRequest(BaseModel):
    patient_id: str
    message: str


class HospitalProfileUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    phone: str | None = None
    email: str | None = None
    website: str | None = None
    emergency_available: bool | None = None
    operating_hours: dict | None = None


class HospitalDoctorCreate(BaseModel):
    full_name: str
    specialty: str
    qualifications: str
    experience_years: int
    languages: list[str] = ["English"]
    department_id: str | None = None
    consultation_type: str = "in_person"
    bio: str | None = None
    email: str | None = None


class HospitalDoctorUpdate(BaseModel):
    full_name: str | None = None
    specialty: str | None = None
    qualifications: str | None = None
    experience_years: int | None = None
    languages: list[str] | None = None
    department_id: str | None = None
    consultation_type: str | None = None
    bio: str | None = None
    is_active: bool | None = None


class HospitalDepartmentCreate(BaseModel):
    name: str
    specialty_code: str
    floor_label: str = "1"
    operating_hours: str = "08:00–20:00"
    description: str | None = None


class HospitalDepartmentUpdate(BaseModel):
    name: str | None = None
    specialty_code: str | None = None
    floor_label: str | None = None
    operating_hours: str | None = None
    is_active: bool | None = None


class HospitalServiceCreate(BaseModel):
    name: str
    code: str
    category: str = "HOSPITAL"
    description: str | None = None


class HospitalFacilityUpdate(BaseModel):
    facilities: list[str]  # e.g. ["Emergency", "ICU", "Pharmacy", "Laboratory", "MRI", "CT", "X-Ray", "Wheelchair Accessibility", "Parking", "Waiting Area"]


class HospitalAIChatRequest(BaseModel):
    message: str

