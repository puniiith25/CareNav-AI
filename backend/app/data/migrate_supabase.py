import json
import psycopg2
from psycopg2.extras import Json
from app.config import settings
from app.data.store import store
from app.data import ids as I
from app.utils.time import new_id

def migrate_and_seed_supabase():
    print(f"Connecting to Supabase Database...")
    conn = psycopg2.connect(settings.database_url)
    conn.autocommit = True
    cur = conn.cursor()

    try:
        print("1. Applying DDL Schema...")
        with open("app/data/supabase_schema.sql", "r") as f:
            ddl_sql = f.read()
            cur.execute(ddl_sql)
        print("   DDL Schema successfully applied!")

        print("2. Seeding Users...")
        for u in store.users.values():
            profile = store.profiles.get(u["id"], {})
            full_name = profile.get("full_name") or u.get("full_name") or "User"
            cur.execute("""
                INSERT INTO public.users (id, email, role, password_hash, full_name, is_active, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    role = EXCLUDED.role,
                    password_hash = EXCLUDED.password_hash,
                    full_name = EXCLUDED.full_name;
            """, (u["id"], u["email"], u["role"], u["password_hash"], full_name, u["is_active"], u.get("created_at") or "NOW()"))

        print("3. Seeding Patients...")
        for p in store.patients.values():
            cur.execute("""
                INSERT INTO public.patients (id, user_id, emergency_contact_name, emergency_contact_phone)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    emergency_contact_name = EXCLUDED.emergency_contact_name,
                    emergency_contact_phone = EXCLUDED.emergency_contact_phone;
            """, (p["id"], p["user_id"], p.get("emergency_contact_name"), p.get("emergency_contact_phone")))

        print("4. Seeding Family Members...")
        for fm in store.family_members.values():
            cur.execute("""
                INSERT INTO public.family_members (id, patient_id, full_name, relationship, age, gender, blood_group, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (fm["id"], fm["patient_id"], fm["full_name"], fm["relationship"], fm.get("age"), fm.get("gender"), fm.get("blood_group"), fm.get("notes")))

        print("5. Seeding Hospitals...")
        for h in store.hospitals.values():
            cur.execute("""
                INSERT INTO public.hospitals (id, name, slug, is_demo, ownership, address, phone, latitude, longitude, operating_hours, emergency_available, open_now, rating, description, accessibility)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    address = EXCLUDED.address,
                    phone = EXCLUDED.phone,
                    latitude = EXCLUDED.latitude,
                    longitude = EXCLUDED.longitude,
                    operating_hours = EXCLUDED.operating_hours,
                    emergency_available = EXCLUDED.emergency_available,
                    description = EXCLUDED.description;
            """, (
                h["id"], h["name"], h["slug"], h.get("is_demo", True), h.get("ownership", "private"),
                h["address"], h.get("phone"), h["latitude"], h["longitude"],
                Json(h.get("operating_hours", {})), h.get("emergency_available", False),
                h.get("open_now", True), h.get("rating", 4.5), h.get("description"),
                Json(h.get("accessibility", []))
            ))

        print("6. Seeding Hospital Admin links...")
        for ha in store.hospital_admins.values():
            cur.execute("""
                INSERT INTO public.hospital_admins (id, user_id, hospital_id)
                VALUES (%s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (ha["id"], ha["user_id"], ha["hospital_id"]))

        print("7. Seeding Departments...")
        for d in store.departments.values():
            cur.execute("""
                INSERT INTO public.departments (id, hospital_id, name, specialty_code, floor_label)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (d["id"], d["hospital_id"], d["name"], d.get("specialty_code", "general"), d.get("floor_label", "1st Floor")))

        print("8. Seeding Doctors...")
        for doc in store.doctors.values():
            cur.execute("""
                INSERT INTO public.doctors (id, user_id, hospital_id, department_id, full_name, specialty, qualifications, experience_years, languages, consultation_type, bio)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    full_name = EXCLUDED.full_name,
                    specialty = EXCLUDED.specialty,
                    hospital_id = EXCLUDED.hospital_id;
            """, (
                doc["id"], doc.get("user_id"), doc["hospital_id"], doc.get("department_id"),
                doc["full_name"], doc["specialty"], doc.get("qualifications", "MBBS, MD"),
                doc.get("experience_years", 8), Json(doc.get("languages", ["English"])),
                doc.get("consultation_type", "in_person"), doc.get("bio")
            ))

        print("9. Seeding Doctor Availability...")
        for av in store.availability:
            cur.execute("""
                INSERT INTO public.doctor_availability (id, doctor_id, weekday, start_time, end_time, slot_minutes)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (av["id"], av["doctor_id"], av["weekday"], av["start_time"], av.get("end_time", "18:00"), av.get("slot_minutes", 30)))

        print("10. Seeding Appointments...")
        for a in store.appointments.values():
            cur.execute("""
                INSERT INTO public.appointments (id, patient_id, doctor_id, hospital_id, family_member_id, patient_name, relationship, starts_at, ends_at, status, reason, notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    starts_at = EXCLUDED.starts_at,
                    ends_at = EXCLUDED.ends_at,
                    status = EXCLUDED.status,
                    reason = EXCLUDED.reason;
            """, (
                a["id"], a["patient_id"], a["doctor_id"], a["hospital_id"],
                a.get("family_member_id"), a.get("patient_name"), a.get("relationship"),
                a["starts_at"], a["ends_at"], a["status"], a.get("reason"), a.get("notes")
            ))

        print("11. Seeding Health Records & Lab Results...")
        for hr in store.health_records.values():
            cur.execute("""
                INSERT INTO public.health_records (id, patient_id, family_member_id, doctor_id, hospital_id, title, record_type, source_table, source_id, official, details, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    details = EXCLUDED.details;
            """, (
                hr["id"], hr["patient_id"], hr.get("family_member_id"), hr.get("doctor_id"),
                hr.get("hospital_id"), hr["title"], hr["record_type"], hr.get("source_table", "reports"),
                hr.get("source_id"), hr.get("official", True), Json(hr.get("details", {})), hr.get("created_at") or "NOW()"
            ))

        print("12. Seeding Health Journal...")
        for j in store.journal.values():
            cur.execute("""
                INSERT INTO public.health_journal (id, patient_id, title, summary, category)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (j["id"], j["patient_id"], j["title"], j["summary"], j.get("category", "HEALTH_INSIGHT")))

        print("13. Seeding Consents...")
        for c in store.consents.values():
            valid_until = c.get("expires_at") or c.get("valid_until") or "NOW() + interval '7 days'"
            cur.execute("""
                INSERT INTO public.consents (id, patient_id, doctor_id, appointment_id, status, items, valid_until)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (c["id"], c["patient_id"], c["doctor_id"], c.get("appointment_id"), c["status"], Json(c.get("items", ["ALL"])), valid_until))

        print("14. Seeding Caregivers...")
        for cg in store.caregivers.values():
            rel = cg.get("relationship") or "Family Caregiver"
            cur.execute("""
                INSERT INTO public.caregivers (id, patient_id, name, email, phone, relationship, permissions, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (cg["id"], cg["patient_id"], cg["name"], cg["email"], cg.get("phone"), rel, Json(cg.get("permissions", [])), cg.get("status", "ACTIVE")))

        print("15. Seeding Patient Timeline & Notifications...")
        for t in store.timeline:
            occurred_at = t.get("occurred_at") or t.get("created_at") or "NOW()"
            source_table = t.get("source_table") or t.get("entity_table")
            source_id = t.get("source_id") or t.get("entity_id")
            cur.execute("""
                INSERT INTO public.patient_timeline (id, patient_id, event_type, title, entity_table, entity_id, icon, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (t.get("id") or new_id(), t["patient_id"], t["event_type"], t["title"], source_table, source_id, t.get("icon", "file"), occurred_at))

        for n in store.notifications.values():
            event_type = n.get("type") or n.get("event_type") or "system"
            message = n.get("body") or n.get("message") or ""
            entity_type = n.get("resource_type") or n.get("entity_type")
            entity_id = n.get("resource_id") or n.get("entity_id")
            cur.execute("""
                INSERT INTO public.notifications (id, user_id, event_type, title, message, entity_type, entity_id, read, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """, (n["id"], n["user_id"], event_type, n["title"], message, entity_type, entity_id, n.get("read", False), n.get("created_at") or "NOW()"))

        conn.commit()
        print("\n🎉 ALL TABLES CREATED AND SEED DATA STORED IN SUPABASE SUCCESSFULLY!")

    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    migrate_and_seed_supabase()
