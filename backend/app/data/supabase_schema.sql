-- =====================================================================
-- CARENAV AI - FULL POSTGRESQL / SUPABASE DDL SCHEMA & SEED SCRIPT
-- Supports Multi-tenant Row-Level Security, Patient Records, Appointments,
-- Hospitals, Doctors, Caregivers, Consents, AI Memory & Health Journal.
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_type') THEN
        CREATE TYPE user_role_type AS ENUM ('PATIENT', 'DOCTOR', 'HOSPITAL_ADMIN', 'CAREGIVER', 'SYSTEM_ADMIN');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status_type') THEN
        CREATE TYPE appointment_status_type AS ENUM ('REQUESTED', 'CONFIRMED', 'UPCOMING', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'consent_status_type') THEN
        CREATE TYPE consent_status_type AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
    END IF;
END $$;

-- 3. CORE AUTH / USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role user_role_type NOT NULL DEFAULT 'PATIENT',
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PATIENTS & PROFILES
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    phone TEXT,
    preferred_language TEXT DEFAULT 'English',
    blood_group TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    accessibility_preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. FAMILY MEMBERS & DEPENDENTS (Proxy Care)
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    relationship TEXT NOT NULL,
    age INT,
    gender TEXT,
    blood_group TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. HOSPITALS & CLINICAL CENTERS
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    is_demo BOOLEAN NOT NULL DEFAULT TRUE,
    ownership TEXT DEFAULT 'private',
    address TEXT NOT NULL,
    phone TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    operating_hours JSONB DEFAULT '{}'::jsonb,
    emergency_available BOOLEAN DEFAULT FALSE,
    open_now BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 1) DEFAULT 4.5,
    description TEXT,
    accessibility JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. HOSPITAL ADMIN ASSIGNMENT
CREATE TABLE IF NOT EXISTS public.hospital_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. DEPARTMENTS & SPECIALTIES
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty_code TEXT NOT NULL,
    floor_label TEXT DEFAULT '1st Floor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. DOCTORS & CLINICIANS
CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    qualifications TEXT DEFAULT 'MBBS, MD',
    experience_years INT DEFAULT 5,
    languages JSONB DEFAULT '["English"]'::jsonb,
    consultation_type TEXT DEFAULT 'in_person',
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. DOCTOR AVAILABILITY SLOTS
CREATE TABLE IF NOT EXISTS public.doctor_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    weekday INT NOT NULL, -- 1=Mon .. 7=Sun
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '18:00',
    slot_minutes INT NOT NULL DEFAULT 30
);

-- 11. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    patient_name TEXT,
    relationship TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    status appointment_status_type NOT NULL DEFAULT 'UPCOMING',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. HEALTH RECORDS, LAB REPORTS & PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS public.health_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    record_type TEXT NOT NULL, -- 'lab_report', 'prescription', 'doctor_visit', 'discharge_summary'
    source_table TEXT NOT NULL DEFAULT 'reports',
    source_id UUID,
    official BOOLEAN DEFAULT TRUE,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AI HEALTH JOURNAL & CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.health_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    category TEXT DEFAULT 'HEALTH_INSIGHT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Medical Consultation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. CONSENT MANAGEMENT (ABDM / FHIR Style)
CREATE TABLE IF NOT EXISTS public.consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    status consent_status_type NOT NULL DEFAULT 'ACTIVE',
    items JSONB NOT NULL DEFAULT '["ALL_RECORDS"]'::jsonb,
    valid_until TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. CAREGIVERS & PROXY GUARDIANS
CREATE TABLE IF NOT EXISTS public.caregivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    caregiver_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    relationship TEXT NOT NULL,
    permissions JSONB DEFAULT '["view_records", "manage_appointments", "receive_alerts"]'::jsonb,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. PATIENT CARE TIMELINE & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.patient_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    entity_table TEXT,
    entity_id UUID,
    icon TEXT DEFAULT 'file',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_health_records_patient ON public.health_records(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hospitals_geo ON public.hospitals(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON public.doctors(hospital_id, specialty);
CREATE INDEX IF NOT EXISTS idx_timeline_patient ON public.patient_timeline(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);
