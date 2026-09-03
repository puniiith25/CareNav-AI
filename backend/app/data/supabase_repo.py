"""
CareNav AI - Supabase Database Layer
Executes direct PostgreSQL queries against Supabase tables filtered by authenticated user / patient.
"""
from __future__ import annotations
import psycopg2
from psycopg2.extras import RealDictCursor
from app.config import settings

def get_db_connection():
    """Connect to Supabase PostgreSQL database."""
    return psycopg2.connect(settings.database_url, cursor_factory=RealDictCursor)

class SupabaseRepository:
    """User-scoped query repository for Supabase."""

    @staticmethod
    def get_patient_profile(user_id: str) -> dict | None:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT u.id as user_id, u.email, u.role, u.full_name,
                           p.id as patient_id, p.date_of_birth, p.phone,
                           p.preferred_language, p.blood_group,
                           p.emergency_contact_name, p.emergency_contact_phone,
                           p.accessibility_preferences
                    FROM public.users u
                    LEFT JOIN public.patients p ON p.user_id = u.id
                    WHERE u.id = %s;
                """, (user_id,))
                return cur.fetchone()

    @staticmethod
    def get_patient_appointments(patient_id: str) -> list[dict]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT a.id, a.patient_id, a.doctor_id, a.hospital_id,
                           a.family_member_id, a.patient_name, a.relationship,
                           a.starts_at, a.ends_at, a.status, a.reason, a.notes,
                           d.full_name as doctor_name, d.specialty as doctor_specialty,
                           h.name as hospital_name, h.address as hospital_address
                    FROM public.appointments a
                    LEFT JOIN public.doctors d ON d.id = a.doctor_id
                    LEFT JOIN public.hospitals h ON h.id = a.hospital_id
                    WHERE a.patient_id = %s
                    ORDER BY a.starts_at DESC;
                """, (patient_id,))
                return cur.fetchall()

    @staticmethod
    def get_patient_health_records(patient_id: str) -> list[dict]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT r.id, r.patient_id, r.family_member_id, r.doctor_id,
                           r.hospital_id, r.title, r.record_type, r.source_table,
                           r.source_id, r.official, r.details, r.created_at,
                           d.full_name as doctor_name,
                           h.name as hospital_name
                    FROM public.health_records r
                    LEFT JOIN public.doctors d ON d.id = r.doctor_id
                    LEFT JOIN public.hospitals h ON h.id = r.hospital_id
                    WHERE r.patient_id = %s
                    ORDER BY r.created_at DESC;
                """, (patient_id,))
                return cur.fetchall()

    @staticmethod
    def get_patient_family_members(patient_id: str) -> list[dict]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, patient_id, full_name, relationship, age, gender, blood_group, notes, created_at
                    FROM public.family_members
                    WHERE patient_id = %s
                    ORDER BY created_at ASC;
                """, (patient_id,))
                return cur.fetchall()

    @staticmethod
    def get_patient_timeline(patient_id: str) -> list[dict]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, patient_id, event_type, title, entity_table, entity_id, icon, created_at
                    FROM public.patient_timeline
                    WHERE patient_id = %s
                    ORDER BY created_at DESC;
                """, (patient_id,))
                return cur.fetchall()

    @staticmethod
    def get_user_notifications(user_id: str) -> list[dict]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, user_id, event_type, title, message, entity_type, entity_id, read, created_at
                    FROM public.notifications
                    WHERE user_id = %s
                    ORDER BY created_at DESC;
                """, (user_id,))
                return cur.fetchall()

    @staticmethod
    def get_all_hospitals() -> list[dict]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id, name, slug, is_demo, ownership, address, phone,
                           latitude, longitude, operating_hours, emergency_available,
                           open_now, rating, description, accessibility
                    FROM public.hospitals
                    ORDER BY rating DESC;
                """)
                return cur.fetchall()
