# CareNav AI 🩺

> **Intelligent Patient Healthcare Navigator, Clinical Triage & Hospital Coordination Ecosystem**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E?logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/AI%20Engine-Gemini%203.6%20Flash-4285F4?logo=google)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌐 Live Production Deployments

| Portal | Role | Live URL | Tech Stack |
|---|---|---|---|
| 🩺 **Patient Web App** | Patient / Family Caregiver | [**care-nav-ai-mhyb.vercel.app**](https://care-nav-ai-mhyb.vercel.app/) | Next.js 16, Tailwind CSS, Leaflet |
| ⚙️ **Backend API** | REST API & AI Engine | [**care-nav-ai-nine.vercel.app**](https://care-nav-ai-nine.vercel.app/) | FastAPI, Python 3.12, Uvicorn |
| 👨‍⚕️ **Doctor Clinician Portal** | Specialist Physician | Deployed / Local: Port `3001` | Next.js 16, Tailwind CSS |
| 🏥 **Hospital Admin Portal** | Facility Operations | Deployed / Local: Port `3002` | Next.js 16, Tailwind CSS |

---

## 📌 Executive Summary

Modern healthcare coordination is plagued by fragmented communication: patients struggle to interpret lab tests and locate emergency facilities; hospital administrators are overwhelmed by manual appointment coordination; and doctors spend excessive time writing post-consultation summaries.

**CareNav AI** solves this with a **three-portal connected platform**:
1. **Patients** prepare consultations, view lab reports with multimodal AI, navigate verified hospitals with live GPS distances, and track daily medications.
2. **Hospital Admins** triage patient booking requests in 1 click (**Accept** or **Reject**). Accepted appointments route directly into the assigned specialist's queue.
3. **Doctors** review the patient's records, submit clinical notes, and generate an official review report automatically sent back to the patient.

---

## ✨ Key Features by Portal

### 1. 🩺 Patient Healthcare Navigator (`/frontend`)
- **Multimodal AI Health Assistant (`/ai`)**: Grounded in patient health records. Explains Lipid Profiles, Complete Blood Count (CBC), and Metabolic Panels in plain language with bulleted findings and preparation questions for their doctor.
- **Interactive Healthcare Map (`/map`)**:
  - Live GPS geolocation calculation (Haversine formula) showing nearest hospitals in Bengaluru.
  - Search suggestion dropdown and quick chips for premier healthcare centers (*Apollo Bannerghatta, Manipal Old Airport Rd, Fortis Cunningham, Aster CMI, Bengaluru Heart & Multispecialty*).
  - Filter by 24/7 Emergency, Cardiology, Orthopedics, Neurology, and Pediatrics.
- **Emergency Medical Assistance (`/emergency`)**: Direct 1-tap dialer for **108 Emergency Services** with high-contrast, accessible UI for immediate critical care.
- **Medication Schedule & Reminders (`/medications`)**: Time-based dosage tracking with a **Mark as Taken** button and sound feedback.
- **Continuous Health Memory & Timeline (`/timeline`, `/health`)**: Aggregates lab records, doctor notes, and consent history chronologically.

### 2. 👨‍⚕️ Doctor Clinical Station (`/frontend-doctor`)
- **Streamlined 3-Feature Design**:
  - 📅 **Appointments Queue (`/appointments`)**: Live clinical queue showing hospital-approved patient appointments with status filtering.
  - 🩺 **Patient Review (`/consultations`)**: Structured review station (Diagnosis, Vitals, Prescription, Care Notes) that **automatically generates an official medical report** and delivers it directly to the patient upon completion.
  - 🤖 **Clinical AI Assistant (`/ai`)**: Assists physicians in summarizing long patient histories, lab deltas, and medication interactions.

### 3. 🏥 Hospital Operations Admin (`/frontend-hospital`)
- **Streamlined 3-Feature Design**:
  - 📅 **Appointments Triage (`/appointments`)**: 1-click **Accept** (immediately pushes appointment to assigned doctor) or **Reject** with automated patient notification.
  - 👥 **Patient Reviews (`/patients`)**: Institutional overview of patients and doctor-submitted clinical reports.
  - 🤖 **Hospital AI Assistant (`/ai`)**: Operational inquiries for scheduling capacity, clinic load, and emergency status.

---

## 🔐 Demo Credentials

All portals support **1-click instant demo login**:

| Portal | Demo User | Email | Password | Role |
|---|---|---|---|---|
| **Patient** | Arjun Mehta | `demo.patient@carenav.demo` | `CareNavDemo!23` | `PATIENT` |
| **Doctor** | Dr. Ananya Sharma (Cardiology) | `dr.sharma@carenav.demo` | `CareNavDemo!23` | `DOCTOR` |
| **Hospital Admin** | Kiran Mehta | `admin.city@carenav.demo` | `CareNavDemo!23` | `HOSPITAL_ADMIN` |

---

## 🏗 System Architecture

```
                       ┌─────────────────────────────────────┐
                       │          PostgreSQL Cloud           │
                       │             (Supabase)              │
                       └──────────────────┬──────────────────┘
                                          │
                        DATABASE_URL / SQL Migrations
                                          │
                       ┌──────────────────┴──────────────────┐
                       │       FastAPI Backend Engine        │
                       │    (care-nav-ai-nine.vercel.app)    │
                       └──────────┬────────────────┬─────────┘
                                  │                │
            JSON REST API / JWT   │                │ Google Gemini API
                                  │                │ (gemini-3.6-flash)
            ┌─────────────────────┼────────────────┼─────────────────────┐
            │                     │                                      │
            ▼                     ▼                                      ▼
┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
│     Patient App       │ │     Doctor Portal     │ │  Hospital Admin Hub   │
│     (Next.js 16)      │ │     (Next.js 16)      │ │     (Next.js 16)      │
│     Port 3000 / Web   │ │       Port 3001       │ │       Port 3002       │
└───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: `v18.18.0` or newer
- **Python**: `v3.12` or newer
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/puniiith25/CareNav-AI.git
cd CareNav-AI
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your Gemini API key and Supabase connection string are present in `.env`.

### 3. Start the Backend API (FastAPI)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run test suite (14/14 tests pass)
pytest

# Start the server on port 8000
uvicorn app.main:app --reload --port 8000
```
Backend API will be running at [http://localhost:8000](http://localhost:8000) (Swagger docs at `/docs`).

### 4. Run Frontend Portals (Root Commands)
Open a new terminal at the project root:

```bash
# Run Patient App (Port 3000)
npm run dev:patient

# Run Doctor Portal (Port 3001)
npm run dev:doctor

# Run Hospital Admin Portal (Port 3002)
npm run dev:hospital
```

Or test production builds across all 3 frontends:
```bash
npm run build:all
```

---

## 🗄 Database Migration & Seeding (Supabase)

To re-apply the database schema and re-seed all demo hospitals, doctors, patients, and health records into your live Supabase database:

```bash
cd backend
source .venv/bin/activate
python -c "from app.data.migrate_supabase import migrate_and_seed_supabase; migrate_and_seed_supabase()"
```

Output:
```
Connecting to Supabase Database...
1. Applying DDL Schema...
2. Seeding Users...
3. Seeding Patients...
4. Seeding Family Members...
5. Seeding Hospitals...
6. Seeding Hospital Admin links...
7. Seeding Departments...
8. Seeding Doctors...
9. Seeding Doctor Availability...
10. Seeding Appointments...
11. Seeding Health Records & Lab Results...
12. Seeding Health Journal...
13. Seeding Consents...
14. Seeding Caregivers...
15. Seeding Patient Timeline & Notifications...

🎉 ALL TABLES CREATED AND SEED DATA STORED IN SUPABASE SUCCESSFULLY!
```

---

## 🚀 Deployment Guide (Vercel)

### 1. Backend (`backend/`)
- Set **Root Directory** to `backend`
- Framework Preset: `Other`
- Build / Output Commands: Leave blank (uses `vercel.json` and `@vercel/python`)
- Environment Variables:
  - `APP_SECRET_KEY`: Random 32-byte hex string (`openssl rand -hex 32`)
  - `AI_API_KEY`: Google Gemini API Key
  - `AI_MODEL`: `gemini-3.6-flash`
  - `CORS_ORIGINS`: Comma-separated Vercel frontend URLs

### 2. Frontends (`frontend/`, `frontend-doctor/`, `frontend-hospital/`)
- Deploy as **3 separate Vercel projects** pointing to their respective directories.
- Framework Preset: `Next.js`
- Environment Variables for all 3:
  - `NEXT_PUBLIC_API_URL`: Your deployed backend URL (e.g. `https://care-nav-ai-nine.vercel.app`)

---

## 🛡 Clinical Safety & Ethical Guardrails

- **Educational Assistant Only**: CareNav AI explicitly clarifies that it does not provide clinical diagnoses, alter prescriptions, or replace certified physician consultations.
- **Strict Evidence Grounding**: The AI assistant responds exclusively using authorized lab reports and tool results without fabricating tests or medical facts.
- **Emergency Protocol**: Any mention of life-threatening symptoms (chest pain, severe breathing distress, trauma) interrupts general chat and immediately provides emergency 108 guidance and navigation to nearby emergency centers.
- **Patient Privacy Sovereignty**: Doctors and hospitals can only access patient files with active patient consent.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
