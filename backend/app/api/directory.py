from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_principal, get_store
from app.data.store import Store
from app.security.authz import Principal
from app.services.clinical import list_availability
from datetime import datetime, timezone

router = APIRouter(prefix="/api", tags=["directory"])

DISCLAIMER = "Fictional demo facilities for CareNav. Not real-world verified healthcare providers."


@router.get("/hospitals")
def hospitals(
    specialty: str | None = None,
    emergency: bool | None = None,
    ownership: str | None = None,
    store: Store = Depends(get_store),
):
    out = []
    for h in store.hospitals.values():
        if emergency is True and not h["emergency_available"]:
            continue
        if ownership and h.get("ownership") != ownership:
            continue
        depts = [d for d in store.departments.values() if d["hospital_id"] == h["id"]]
        if specialty and not any(specialty.lower() in (d["name"] + d.get("specialty_code", "")).lower() for d in depts):
            continue
        svcs = [
            store.services[sid]
            for hid, sid in store.hospital_services
            if hid == h["id"] and sid in store.services
        ]
        out.append({**h, "departments": depts, "services": svcs, "disclaimer": DISCLAIMER})
    return {"disclaimer": DISCLAIMER, "hospitals": out, "points_of_interest": store.poi}


@router.get("/hospitals/{hospital_id}")
def hospital_detail(hospital_id: str, store: Store = Depends(get_store)):
    h = store.hospitals.get(hospital_id)
    if not h:
        raise HTTPException(404, detail="That hospital could not be found.")
    doctors = [d for d in store.doctors.values() if d["hospital_id"] == hospital_id]
    depts = [d for d in store.departments.values() if d["hospital_id"] == hospital_id]
    why = []
    if any("cardiology" in d.get("specialty_code", "") for d in depts):
        why.append("Offers Cardiology")
    if any(s for hid, sid in store.hospital_services if hid == hospital_id):
        why.append("Listed services are based on demo facility data")
    if h["emergency_available"]:
        why.append("Emergency facility available")
    if h.get("open_now"):
        why.append("Listed as open now in demo data")
    why.append("Distance is based on the demo map, not live traffic")
    indoor = store.maps.get(hospital_id)
    floors = [f for f in store.floors if indoor and f["map_id"] == indoor["id"]]
    rooms = [r for r in store.rooms if r["floor_id"] in {f["id"] for f in floors}]
    routes = [rt for rt in store.routes if indoor and rt["map_id"] == indoor["id"]]
    svcs = [store.services[sid] for hid, sid in store.hospital_services if hid == hospital_id and sid in store.services]
    facilities = h.get("accessibility") or []
    return {
        "hospital": h,
        "departments": depts,
        "doctors": doctors,
        "services": svcs,
        "facilities": facilities,
        "why_this_hospital": why,
        "indoor": {"map": indoor, "floors": floors, "rooms": rooms, "routes": routes},
        "disclaimer": DISCLAIMER,
    }


@router.get("/doctors")
def doctors(specialty: str | None = None, hospital_id: str | None = None, store: Store = Depends(get_store)):
    out = []
    for d in store.doctors.values():
        if hospital_id and d["hospital_id"] != hospital_id:
            continue
        if specialty and specialty.lower() not in d["specialty"].lower():
            continue
        out.append({**d, "hospital": store.hospitals[d["hospital_id"]], "department": store.departments.get(d.get("department_id") or "")})
    return out


@router.get("/doctors/{doctor_id}")
def doctor_detail(doctor_id: str, store: Store = Depends(get_store)):
    d = store.doctors.get(doctor_id)
    if not d:
        raise HTTPException(404, detail="That doctor could not be found.")
    return {**d, "hospital": store.hospitals[d["hospital_id"]], "department": store.departments.get(d.get("department_id") or "")}


@router.get("/doctors/{doctor_id}/availability")
def availability(doctor_id: str, day: str = Query(default="2026-09-03"), store: Store = Depends(get_store)):
    if doctor_id not in store.doctors:
        raise HTTPException(404, detail="That doctor could not be found.")
    day_dt = datetime.fromisoformat(day).replace(tzinfo=timezone.utc)
    return {"slots": list_availability(store, doctor_id, day_dt)}


@router.get("/map")
def healthcare_map(store: Store = Depends(get_store)):
    markers = []
    for h in store.hospitals.values():
        markers.append(
            {
                "id": h["id"],
                "kind": "hospital",
                "name": h["name"],
                "lat": h["latitude"],
                "lng": h["longitude"],
                "rating": h["rating"],
                "emergency": h["emergency_available"],
                "departments": [d["name"] for d in store.departments.values() if d["hospital_id"] == h["id"]],
                "is_demo": True,
            }
        )
    for p in store.poi:
        markers.append(
            {
                "id": p["id"],
                "kind": p["category"].lower(),
                "name": p["name"],
                "lat": p["latitude"],
                "lng": p["longitude"],
                "rating": p["rating"],
                "emergency": p["emergency_available"],
                "departments": [],
                "is_demo": True,
            }
        )
    return {"disclaimer": DISCLAIMER, "center": [12.9716, 77.5946], "markers": markers}


@router.get("/emergency")
def emergency(store: Store = Depends(get_store), principal: Principal = Depends(get_principal)):
    nearby = [h for h in store.hospitals.values() if h["emergency_available"]]
    nearby += [p for p in store.poi if p["emergency_available"]]
    profile = store.profiles.get(principal.user_id)
    patient = store.patients.get(principal.patient_id) if principal.patient_id else None
    return {
        "message": "CareNav cannot determine whether you are safe. Contact emergency services if this may be life-threatening.",
        "facilities": nearby,
        "emergency_contact": {
            "name": patient.get("emergency_contact_name") if patient else None,
            "phone": patient.get("emergency_contact_phone") if patient else None,
        },
        "profile": profile,
    }
