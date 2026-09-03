export type UserRole = "PATIENT" | "DOCTOR" | "HOSPITAL_ADMIN" | "CAREGIVER";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  date_of_birth: string;
  phone: string;
  preferred_language: string;
  accessibility_preferences?: Record<string, boolean>;
}

export interface Patient {
  id: string;
  user_id: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  profile?: Profile;
}

export interface Hospital {
  id: string;
  name: string;
  slug: string;
  is_demo: boolean;
  ownership?: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  emergency_available: boolean;
  rating?: number;
  description?: string;
  departments?: Department[];
  services?: Service[];
  facilities?: string[];
  why_this_hospital?: string[];
}

export interface Department {
  id: string;
  hospital_id: string;
  name: string;
  specialty_code?: string;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
}

export interface Doctor {
  id: string;
  hospital_id: string;
  department_id?: string;
  full_name: string;
  specialty: string;
  qualifications?: string;
  experience_years?: number;
  languages?: string[];
  consultation_type?: string;
  bio?: string;
  hospital?: Hospital;
  department?: Department;
}

export interface ReportValue {
  id: string;
  report_id: string;
  test_name: string;
  value: string;
  unit?: string;
  reference_range?: string;
  confidence?: number;
  needs_verification?: boolean;
}

export interface MedicalReport {
  id: string;
  patient_id: string;
  document_id?: string;
  report_date: string;
  hospital_or_lab: string;
  doctor_name?: string;
  test_name: string;
  document_type: string;
  extraction_confidence?: number;
  values?: ReportValue[];
  explanation?: {
    what_this_report_is?: string;
    key_results?: ReportValue[];
    what_these_tests_measure?: string;
    questions_for_doctor?: string[];
    disclaimer?: string;
  };
}

export interface Medication {
  id: string;
  prescription_id?: string;
  patient_id: string;
  name: string;
  dose: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  department_id?: string;
  starts_at: string;
  ends_at: string;
  status: "REQUESTED" | "CONFIRMED" | "UPCOMING" | "COMPLETED" | "CANCELLED";
  reason?: string;
  doctor: Doctor;
  hospital: Hospital;
  department?: Department;
  documents?: any[];
  consent?: any;
}

export interface TimelineEvent {
  id: string;
  patient_id: string;
  event_type: string;
  title: string;
  occurred_at: string;
  source_table?: string;
  source_id?: string;
  icon?: string;
}

export interface ConsentRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  duration_label: string;
  starts_at: string;
  expires_at?: string;
  items?: { id: string; item_type: string }[];
  doctor?: Doctor;
}

export interface RecoveryPlan {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export interface RecoveryTask {
  id: string;
  plan_id: string;
  section: string;
  content: string;
  documented: boolean;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  resource_type?: string;
  resource_id?: string;
  created_at: string;
}
