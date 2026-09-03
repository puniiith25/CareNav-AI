from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.ai.tools import execute_tool
from app.config import settings
from app.data.store import Store
from app.security.authz import Principal
from app.utils.time import new_id, utcnow

SYSTEM = """You are CareNav, an AI healthcare navigator and health-memory assistant.
You are NOT a doctor. You do not diagnose, prescribe, or say the user is safe.
When answering about a patient, use only tool results. Never fabricate records.
If data is missing say: "I don't have enough information in your records to answer that reliably."
Style: clear, short, friendly, non-alarming. Use "Your report shows..." not "You definitely have..."
Distinguish educational knowledge from patient-specific facts.
If symptoms may be life-threatening, stop normal chat and urge emergency services and nearby emergency facilities.
"""

LIFE_THREAT = re.compile(
    r"chest pain|can't breathe|cannot breathe|suicidal|unconscious|severe bleeding|stroke|heart attack",
    re.I,
)


def plan_tools(message: str) -> list[tuple[str, dict]]:
    m = message.lower()
    steps: list[tuple[str, dict]] = []
    if LIFE_THREAT.search(message):
        return [("find_hospitals", {"query": "emergency"})]
    if "compare" in m and "report" in m:
        steps.append(("get_medical_reports", {}))
        steps.append(("compare_reports", {}))
    elif "blood report" in m or "latest report" in m or "last report" in m or "lab" in m:
        steps.append(("get_medical_reports", {}))
        steps.append(("get_report_details", {}))
    elif "medication" in m or "prescribe" in m or "medicine" in m:
        steps.append(("get_medications", {}))
    elif "appointment" in m:
        steps.append(("get_appointments", {}))
    elif "cardiolog" in m or "heart" in m or "consult" in m:
        steps.append(("find_healthcare_services", {"query": "cardiology"}))
        steps.append(("find_hospitals", {"specialty": "cardiology"}))
        steps.append(("find_doctors", {"specialty": "cardiology"}))
    elif "knee" in m or "orthopedic" in m or "bone" in m:
        steps.append(("find_healthcare_services", {"query": "orthopedics"}))
        steps.append(("find_hospitals", {"specialty": "orthopedics"}))
        steps.append(("find_doctors", {"specialty": "orthopedics"}))
    elif "hospital" in m or "map" in m or "near" in m or "doctor" in m or "consult" in m:
        steps.append(("find_healthcare_services", {"query": "cardiology"}))
        steps.append(("find_hospitals", {"specialty": "cardiology"}))
        steps.append(("find_doctors", {"specialty": "cardiology"}))
    elif "timeline" in m or "activity" in m or "summarize" in m:
        steps.append(("get_health_timeline", {}))
        steps.append(("get_medical_reports", {}))
        steps.append(("get_appointments", {}))
    elif "consent" in m or "shar" in m:
        steps.append(("get_consent_status", {}))
    elif "recover" in m:
        steps.append(("get_recovery_plan", {}))
    elif "book" in m or "tomorrow" in m:
        steps.append(("find_doctors", {"query": "sharma"}))
        steps.append(("get_doctor_availability", {}))
        steps.append(("create_appointment", {}))
    else:
        steps.append(("get_health_records", {}))
    return steps


def _render_without_llm(message: str, tool_outputs: list[dict]) -> str:
    if LIFE_THREAT.search(message):
        return (
            "This sounds potentially urgent. I cannot tell whether you are safe.\n\n"
            "Please contact local emergency services now and go to the nearest appropriate emergency facility. "
            "Open Emergency in CareNav for nearby demo emergency locations and directions."
        )
    m = message.lower()
    by = {t["tool"]: t for t in tool_outputs}
    if by.get("compare_reports", {}).get("ok"):
        cmp = by["compare_reports"]["result"]
        lines = ["Here is a comparison of your last two documented lipid panels. This is not a diagnosis.", ""]
        for row in cmp["rows"]:
            extra = f" ({row['note']})" if row.get("note") else ""
            lines.append(f"- {row['test']}: {row['previous']} → {row['current']} {row.get('unit') or ''}{extra}")
        lines.append("")
        lines.append("Source: your uploaded laboratory reports.")
        return "\n".join(lines)
    if "get_report_details" in by and by["get_report_details"].get("ok"):
        det = by["get_report_details"]["result"]
        report = det["report"]
        lines = [
            f"Your latest documented report is a {report['test_name']} dated {report['report_date']} from {report['hospital_or_lab']}.",
            "",
            "Key reported results:",
        ]
        for v in det["values"]:
            flag = " Needs verification." if v.get("needs_verification") else ""
            lines.append(f"- {v['test_name']}: {v['value']} {v['unit']} (report range {v['reference_range']}).{flag}")
        lines.append("")
        lines.append("AI-generated explanation — not a medical diagnosis. Open the source document from Reports.")
        return "\n".join(lines)
    if "find_doctors" in by and by["find_doctors"].get("ok"):
        if "knee" in m:
            intro = "A musculoskeletal/orthopedic service may be relevant. Here are nearby demo facilities offering orthopedic care. This is not a diagnosis."
        else:
            intro = "Here are demo cardiology services, hospitals, and doctors that match your request. These are fictional demo facilities."
        docs = by["find_doctors"]["result"][:4]
        lines = [intro, ""]
        for d in docs:
            lines.append(f"- {d['full_name']} · {d['specialty']} · {d['hospital']['name']}")
        lines.append("")
        lines.append("Open Healthcare Map to choose a hospital, then book with consent.")
        return "\n".join(lines)
    if "get_medications" in by and by["get_medications"].get("ok"):
        meds = by["get_medications"]["result"]["medications"]
        if not meds:
            return "I don't have enough information in your records to answer that reliably."
        lines = ["These medications are documented on your prescriptions. I cannot change dose or instructions.", ""]
        for med in meds:
            lines.append(f"- {med['name']} — {med['dose']}, {med['frequency']}. {med['instructions']}")
        return "\n".join(lines)
    if "get_appointments" in by and by["get_appointments"].get("ok"):
        appts = by["get_appointments"]["result"]
        upcoming = [a for a in appts if a["status"] in ("CONFIRMED", "UPCOMING", "REQUESTED")]
        if not upcoming:
            return "I don't see an upcoming appointment in your records."
        a = upcoming[0]
        return f"You have a {a['status'].lower()} visit with {a['doctor']['full_name']} at {a['hospital']['name']} on {a['starts_at']}."
    if "create_appointment" in by:
        return (
            "I found Dr. Ananya Sharma. Booking needs your confirmation, which records to share, and consent duration. "
            "Use Book on the doctor profile — I will not create an appointment without that confirmation."
        )
    if "get_health_timeline" in by and by["get_health_timeline"].get("ok"):
        events = by["get_health_timeline"]["result"][:6]
        lines = ["Recent documented healthcare activity:", ""]
        for e in events:
            lines.append(f"- {e['title']}")
        return "\n".join(lines)
    failed = [t for t in tool_outputs if not t.get("ok")]
    if failed and all(not t.get("ok") for t in tool_outputs):
        return failed[0].get("error") or "I don't have enough information in your records to answer that reliably."
    return "I used your records to look this up. Ask me about a report, medication, appointment, or finding care."


async def maybe_gemini(prompt: str, tool_outputs: list[dict]) -> str | None:
    if not settings.ai_api_key:
        return None
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": SYSTEM
                        + "\n\nUser message:\n"
                        + prompt
                        + "\n\nAuthorized tool results (JSON):\n"
                        + json.dumps(tool_outputs, default=str)[:12000]
                    }
                ],
            }
        ]
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.ai_model}:generateContent"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(url, params={"key": settings.ai_api_key}, json=payload)
            r.raise_for_status()
            data = r.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return None


class GeminiAIService:
    async def chat(self, message: str, tool_outputs: list[dict]) -> str:
        llm = await maybe_gemini(message, tool_outputs)
        return llm or _render_without_llm(message, tool_outputs)

    async def analyze_document(self, filename: str) -> dict:
        # Prototype: synthetic extraction for the demo lipid panel; never invent extra tests.
        from app.services.clinical import demo_extract_lipid_panel

        return demo_extract_lipid_panel()


ai_service = GeminiAIService()


async def run_agent(store: Store, principal: Principal, conversation_id: str | None, message: str, image_url: str | None = None) -> dict:
    if principal.role != "PATIENT" or not principal.patient_id:
        # doctors use briefing endpoint instead
        if principal.role != "DOCTOR":
            return {"error": "You don't have permission to view this record."}
    cid = conversation_id
    if principal.patient_id:
        if not cid:
            cid = new_id()
            store.conversations[cid] = {
                "id": cid,
                "patient_id": principal.patient_id,
                "title": message[:48],
                "created_at": utcnow(),
                "updated_at": utcnow(),
            }
        store.messages.append(
            {
                "id": new_id(),
                "conversation_id": cid,
                "role": "user",
                "content": message,
                "image_url": image_url,
                "tool_name": None,
                "tool_result_reference": None,
                "created_at": utcnow(),
            }
        )
    planned = plan_tools(message)
    outputs = []
    reports = None
    for name, args in planned:
        if name == "get_report_details" and reports:
            args = {"report_id": reports[0]["id"]}
        if name == "get_doctor_availability":
            docs = next((o["result"] for o in outputs if o["tool"] == "find_doctors" and o.get("ok")), None)
            if docs:
                args = {**args, "doctor_id": docs[0]["id"], "day": "2026-09-03T00:00:00+00:00"}
        result = execute_tool(store, principal, name, **args)
        outputs.append(result)
        store.audit_event(principal.user_id, principal.role, f"ai.tool.{name}", "ai_tool", None, {"ok": result.get("ok")})
        if name == "get_medical_reports" and result.get("ok"):
            reports = result["result"]
            if reports and any("detail" in message.lower() or "last" in message.lower() or "blood" in message.lower() for _ in [0]):
                pass
    from app.services.clinical import navigate_need

    nav = navigate_need(message)
    text = await ai_service.chat(message, outputs)
    sources = []
    if reports:
        sources.append({"label": "View report", "href": f"/reports/{reports[0]['id']}"})
    if nav["category"] != "all" or "map" in message.lower() or "hospital" in message.lower() or "doctor" in message.lower() or "consult" in message.lower():
        sources.append({"label": "Open Healthcare Map", "href": nav["href"]})
    if principal.patient_id:
        store.messages.append(
            {
                "id": new_id(),
                "conversation_id": cid,
                "role": "assistant",
                "content": text,
                "tool_name": ",".join(o["tool"] for o in outputs),
                "tool_result_reference": [{"tool": o["tool"], "ok": o.get("ok")} for o in outputs],
                "created_at": utcnow(),
            }
        )
    return {
        "conversation_id": cid,
        "message": text,
        "tools": [{"name": o["tool"], "ok": o.get("ok"), "error": o.get("error")} for o in outputs],
        "sources": sources,
        "navigate": nav,
        "emergency": bool(LIFE_THREAT.search(message)),
        "prompt_save_memory": "report" in message.lower() or "upload" in message.lower(),
        "disclaimer": "AI-generated — not a medical diagnosis.",
    }
