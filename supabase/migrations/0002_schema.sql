-- CareNav AI core schema (synthetic / prototype — not a clinical system)

create type user_role as enum (
  'PATIENT',
  'DOCTOR',
  'HOSPITAL_ADMIN',
  'CAREGIVER',
  'SYSTEM_ADMIN'
);

create type appointment_status as enum (
  'REQUESTED',
  'CONFIRMED',
  'UPCOMING',
  'CHECKED_IN',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
  'RESCHEDULED',
  'NO_SHOW'
);

create type document_status as enum (
  'UPLOADING',
  'PROCESSING',
  'ANALYZING',
  'READY',
  'FAILED',
  'NEEDS_REVIEW'
);

create type consent_status as enum (
  'ACTIVE',
  'EXPIRED',
  'REVOKED'
);

create type facility_category as enum (
  'HOSPITAL',
  'CLINIC',
  'DIAGNOSTIC_CENTER',
  'PHARMACY',
  'EMERGENCY',
  'DENTAL',
  'EYE_CENTER',
  'BLOOD_BANK'
);

create type memory_level as enum (
  'CHAT_HISTORY',
  'HEALTH_JOURNAL',
  'OFFICIAL_RECORD'
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role user_role not null,
  password_hash text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  full_name text not null,
  date_of_birth date,
  phone text,
  preferred_language text default 'en',
  accessibility_preferences jsonb not null default '{}'::jsonb,
  avatar_path text,
  created_at timestamptz not null default now()
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz not null default now()
);

create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  is_demo boolean not null default true,
  ownership text check (ownership in ('government', 'private')),
  address text,
  phone text,
  latitude double precision,
  longitude double precision,
  operating_hours jsonb not null default '{}'::jsonb,
  emergency_available boolean not null default false,
  rating numeric(3,2),
  photos text[] not null default '{}',
  description text,
  created_at timestamptz not null default now()
);

create table public.hospital_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id) on delete cascade
);

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  name text not null,
  specialty_code text,
  floor_label text,
  created_at timestamptz not null default now()
);

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  educational_blurb text
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category facility_category,
  description text
);

create table public.hospital_services (
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (hospital_id, service_id)
);

create table public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  full_name text not null,
  specialty text not null,
  qualifications text,
  experience_years int,
  languages text[] not null default '{}',
  consultation_type text default 'in_person',
  bio text,
  photo_path text,
  created_at timestamptz not null default now()
);

create table public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes int not null default 20
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete restrict,
  hospital_id uuid not null references public.hospitals(id) on delete restrict,
  department_id uuid references public.departments(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status appointment_status not null default 'REQUESTED',
  reason text,
  notes text,
  created_at timestamptz not null default now(),
  unique (doctor_id, starts_at)
);

create table public.medical_documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  uploaded_by uuid references public.users(id),
  document_type text,
  title text,
  storage_bucket text not null,
  storage_path text not null,
  mime_type text,
  status document_status not null default 'UPLOADING',
  source text check (source in ('patient', 'doctor', 'hospital', 'system')),
  appointment_id uuid references public.appointments(id),
  created_at timestamptz not null default now()
);

create table public.appointment_documents (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  document_id uuid not null references public.medical_documents(id) on delete cascade,
  primary key (appointment_id, document_id)
);

create table public.medical_reports (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  document_id uuid references public.medical_documents(id) on delete set null,
  report_date date,
  hospital_or_lab text,
  doctor_name text,
  test_name text,
  document_type text,
  notes text,
  extraction_confidence numeric(4,3),
  needs_verification boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.report_values (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.medical_reports(id) on delete cascade,
  test_name text not null,
  value text,
  unit text,
  reference_range text,
  notes text,
  confidence numeric(4,3),
  source_location text,
  needs_verification boolean not null default false
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id),
  appointment_id uuid references public.appointments(id),
  document_id uuid references public.medical_documents(id),
  issued_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid not null references public.prescriptions(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  name text not null,
  dose text,
  frequency text,
  duration text,
  instructions text,
  extracted_exactly boolean not null default true
);

create table public.medication_schedules (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  period text not null check (period in ('morning', 'afternoon', 'night')),
  reminder_enabled boolean not null default true
);

create table public.consultation_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id),
  patient_id uuid not null references public.patients(id),
  summary text,
  follow_up_instructions text,
  created_at timestamptz not null default now()
);

create table public.health_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  record_type text not null,
  title text not null,
  source_table text,
  source_id uuid,
  official boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.health_timeline_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  event_type text not null,
  title text not null,
  occurred_at timestamptz not null,
  source_table text,
  source_id uuid,
  icon text,
  created_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool', 'system')),
  content text,
  tool_name text,
  tool_result_reference jsonb,
  created_at timestamptz not null default now()
);

create table public.health_journal (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  title text not null,
  summary text,
  user_approved boolean not null default false,
  ai_generated boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id),
  appointment_id uuid references public.appointments(id),
  status consent_status not null default 'ACTIVE',
  duration_label text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.consent_items (
  id uuid primary key default gen_random_uuid(),
  consent_id uuid not null references public.consents(id) on delete cascade,
  item_type text not null,
  resource_id uuid
);

create table public.caregivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  relationship text,
  unique (user_id, patient_id)
);

create table public.caregiver_permissions (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.caregivers(id) on delete cascade,
  permission text not null
);

create table public.recovery_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  source_document_id uuid references public.medical_documents(id),
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table public.recovery_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.recovery_plans(id) on delete cascade,
  section text not null,
  content text not null,
  documented boolean not null default true
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  resource_type text,
  resource_id uuid,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id),
  actor_role user_role,
  action text not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.hospital_facilities (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  category facility_category not null,
  name text not null,
  accessibility jsonb not null default '{}'::jsonb
);

create table public.hospital_maps (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null unique references public.hospitals(id) on delete cascade,
  title text not null
);

create table public.hospital_floors (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.hospital_maps(id) on delete cascade,
  level int not null,
  label text not null
);

create table public.hospital_rooms (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid not null references public.hospital_floors(id) on delete cascade,
  name text not null,
  kind text not null,
  x numeric,
  y numeric
);

create table public.hospital_routes (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references public.hospital_maps(id) on delete cascade,
  from_room_id uuid references public.hospital_rooms(id),
  to_room_id uuid references public.hospital_rooms(id),
  steps jsonb not null default '[]'::jsonb
);

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  content text not null,
  kind text not null check (kind in ('education', 'policy', 'navigation', 'hospital')),
  created_at timestamptz not null default now()
);

create table public.embeddings (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.knowledge_documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(768)
);

create index idx_patients_user on public.patients(user_id);
create index idx_doctors_hospital on public.doctors(hospital_id);
create index idx_doctors_dept on public.doctors(department_id);
create index idx_appointments_patient on public.appointments(patient_id);
create index idx_appointments_doctor on public.appointments(doctor_id);
create index idx_appointments_hospital on public.appointments(hospital_id);
create index idx_appointments_starts on public.appointments(starts_at);
create index idx_appointments_status on public.appointments(status);
create index idx_docs_patient on public.medical_documents(patient_id);
create index idx_docs_type on public.medical_documents(document_type);
create index idx_reports_patient on public.medical_reports(patient_id);
create index idx_timeline_patient_date on public.health_timeline_events(patient_id, occurred_at desc);
create index idx_consents_patient on public.consents(patient_id);
create index idx_consents_doctor on public.consents(doctor_id);
create index idx_consents_status on public.consents(status);
create index idx_consents_expiry on public.consents(expires_at);
create index idx_notifications_user on public.notifications(user_id, read);
create index idx_audit_actor on public.audit_logs(actor_user_id, created_at desc);
create index idx_meds_patient on public.medications(patient_id);
create index idx_health_journal_patient on public.health_journal(patient_id);
