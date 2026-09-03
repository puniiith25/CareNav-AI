# CareNav AI — Doctor Portal & Hospital Administration Portal

**CareNav AI** connects patients, doctors, and hospitals into one unified, secure healthcare journey with healthcare journey intelligence.

---

## 🚀 Key Portal Features

### 1. Doctor Portal (`/doctor/*`)
- **Protected Clinical Dashboard (`/doctor/dashboard`)**: Displays today's appointment load, waiting room queue, completed sessions, follow-ups due, and schedule timeline.
- **Authorized Patient Directory (`/doctor/patients`)**: RBAC + consent-gated directory showing only patients with active consents.
- **Patient Profile (`/doctor/patients/[patientId]`)**: Comprehensive clinical profile with consented medical reports, current medications, prescriptions, recovery plans, and patient health timeline.
- **Structured Report Viewer (`/doctor/reports/[reportId]`) & Comparison (`/doctor/reports/compare`)**: Side-by-side delta calculation and test extraction verification.
- **Consultation Workspace (`/doctor/consultations/[appointmentId]`)**: Triple-column clinical station with real-time patient overview, chief concern, clinical observations, assessment, and treatment plan.
- **Prescription Builder & Signing (`/doctor/prescriptions/new`)**: Medication duration, frequency, schedule periods, clinical signing workflow, and immediate sync to patient timeline & medications.
- **Schedule Management (`/doctor/schedule`)**: Configure weekly consultation hours, slot duration, and consultation types.
- **Doctor AI Assistant (`/doctor/ai`)**: Grounded in authorized records, summarization, test comparison, and strict anti-hallucination guardrails.
- **Clinical Audit & Notifications (`/doctor/audit`, `/doctor/notifications`)**: Full HIPAA-grade access logging and appointment updates.

### 2. Hospital Administration Portal (`/hospital/*`)
- **Operational Command Center (`/hospital/dashboard`)**: Institutional metrics (today's appointments, on-call doctors, patients today, emergency readiness, available slots).
- **Staff Roster (`/hospital/doctors`)**: Add, edit, and assign doctors across clinical departments.
- **Clinical Departments (`/hospital/departments`)**: Manage departmental hours, room allocations, and medical staffing.
- **Healthcare Services (`/hospital/services`)**: Configure discoverable clinical services broadcasted to Healthcare Map.
- **Facilities & Amenities (`/hospital/facilities`)**: Manage ICU, trauma center, pharmacy, imaging (MRI/CT), and wheelchair accessibility.
- **Realtime Patient Flow (`/hospital/patients`, `/hospital/appointments`)**: 5-stage Kanban/pipeline from Booked → Checked In → Waiting Room → In Consultation → Completed.
- **Geo-Location & Indoor Navigation (`/hospital/map`)**: Configure coordinates, emergency availability, and multi-floor indoor navigation schema.
- **Operational Analytics (`/hospital/analytics`)**: Department load distribution, consultation duration metrics, and hourly patient flow charts.
- **Hospital AI Assistant (`/hospital/ai`)**: Operational inquiries for scheduling capacity, clinic load, and emergency status.
- **Audit Logs (`/hospital/audit`) & Profile Configuration (`/hospital/settings/profile`)**: Institutional security logging and hospital contact info.

---

## 🔐 Credentials & Quick Demo Logins

| Role | Email | Password | Portal Route |
|---|---|---|---|
| **Doctor** (Dr. Ananya Sharma) | `dr.sharma@carenav.demo` | `CareNavDemo!23` | `/doctor/dashboard` |
| **Hospital Admin** (Kiran Mehta) | `admin.city@carenav.demo` | `CareNavDemo!23` | `/hospital/dashboard` |
| **Patient** (Arjun Mehta) | `demo.patient@carenav.demo` | `CareNavDemo!23` | `/` |

---

## 🛠 Running the Application

### Backend (FastAPI + Python)
```bash
cd backend
source .venv/bin/activate
pytest  # Run 14 unit and integration tests
uvicorn app.main:app --reload --port 8000
```

### Frontend (Next.js + TypeScript + Tailwind CSS)
```bash
cd frontend
npm run dev
# or build
npx next build --webpack
```
