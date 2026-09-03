"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pill, Clock, CheckCircle2, AlertCircle, Calendar, Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Medication } from "@/types";

export default function MedicationsPage() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedule, setSchedule] = useState<{ morning: Medication[]; afternoon: Medication[]; night: Medication[] }>({
    morning: [],
    afternoon: [],
    night: [],
  });
  const [takenLogs, setTakenLogs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMeds() {
      try {
        const data = await api<{ medications: Medication[]; today: any }>("/api/medications");
        setMedications(data.medications || []);
        setSchedule(data.today || { morning: [], afternoon: [], night: [] });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMeds();
  }, []);

  async function handleAdherence(medId: string, action: "taken" | "skip", period: string) {
    try {
      await api(`/api/medications/${medId}/log`, {
        method: "POST",
        body: JSON.stringify({ action, period }),
      });
      setTakenLogs((prev) => ({ ...prev, [`${medId}-${period}`]: action === "taken" }));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">My Medications</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Prescription schedules, exact clinician dosage, and daily adherence tracking.
            </p>
          </div>
          <button
            onClick={() => router.push("/ai?prompt=" + encodeURIComponent("What did my doctor prescribe?"))}
            className="btn btn-ghost text-xs flex items-center gap-1.5 self-start sm:self-auto bg-white"
          >
            <Sparkles className="w-4 h-4 text-[#0f6e6e]" />
            <span>Ask AI About Medications</span>
          </button>
        </div>

        {/* Daily Schedule Blocks */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#5c6b73]">
            Today&apos;s Medication Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Morning */}
            <div className="card p-5 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#d9d1c3]/60">
                <span className="font-bold text-xs text-[#15232b] flex items-center gap-1.5">
                  <span>🌅 Morning</span>
                </span>
                <span className="text-[0.7rem] font-semibold text-[#5c6b73]">Breakfast</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[#f3efe6] space-y-1.5">
                  <div className="font-bold text-xs text-[#15232b]">Vitamin D3 (Demo)</div>
                  <div className="text-[0.7rem] text-[#5c6b73]">60,000 IU · Once weekly with milk</div>
                  <div className="pt-2 flex gap-1.5">
                    <button
                      onClick={() => handleAdherence("99999999-9999-9999-9999-999999999902", "taken", "morning")}
                      className={`btn text-[0.7rem] px-2.5 py-1 min-h-0 flex-1 ${
                        takenLogs["99999999-9999-9999-9999-999999999902-morning"]
                          ? "bg-emerald-600 text-white"
                          : "btn-primary"
                      }`}
                    >
                      {takenLogs["99999999-9999-9999-9999-999999999902-morning"] ? "Taken ✓" : "Mark Taken"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Afternoon */}
            <div className="card p-5 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#d9d1c3]/60">
                <span className="font-bold text-xs text-[#15232b] flex items-center gap-1.5">
                  <span>☀️ Afternoon</span>
                </span>
                <span className="text-[0.7rem] font-semibold text-[#5c6b73]">Lunch</span>
              </div>
              <div className="py-6 text-center text-xs text-[#5c6b73]">No afternoon medicines scheduled.</div>
            </div>

            {/* Night */}
            <div className="card p-5 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#d9d1c3]/60">
                <span className="font-bold text-xs text-[#15232b] flex items-center gap-1.5">
                  <span>🌙 Night</span>
                </span>
                <span className="text-[0.7rem] font-semibold text-[#5c6b73]">After dinner</span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[#f3efe6] space-y-1.5">
                  <div className="font-bold text-xs text-[#15232b]">Atorvastatin (Demo)</div>
                  <div className="text-[0.7rem] text-[#5c6b73]">10 mg · 1 tablet after food</div>
                  <div className="pt-2 flex gap-1.5">
                    <button
                      onClick={() => handleAdherence("99999999-9999-9999-9999-999999999901", "taken", "night")}
                      className={`btn text-[0.7rem] px-2.5 py-1 min-h-0 flex-1 ${
                        takenLogs["99999999-9999-9999-9999-999999999901-night"]
                          ? "bg-emerald-600 text-white"
                          : "btn-primary"
                      }`}
                    >
                      {takenLogs["99999999-9999-9999-9999-999999999901-night"] ? "Taken ✓" : "Mark Taken"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]/60">
            <h3 className="font-bold text-sm text-[#15232b]">Active Prescriptions from Doctors</h3>
            <span className="text-xs text-[#5c6b73]">2 Prescribed</span>
          </div>

          <div className="space-y-3">
            {medications.map((m) => (
              <div key={m.id} className="p-4 rounded-xl border border-[#d9d1c3] flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#15232b]">{m.name}</h4>
                  <div className="text-xs text-[#0f6e6e] font-semibold mt-0.5">
                    {m.dose} · {m.frequency}
                  </div>
                  {m.instructions && (
                    <p className="text-xs text-[#5c6b73] mt-1">{m.instructions}</p>
                  )}
                </div>
                <span className="text-[0.7rem] px-2 py-0.5 rounded bg-[#f3efe6] text-[#5c6b73] border border-[#d9d1c3]">
                  Exact Prescribed Dose
                </span>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-[#fff1f1] border border-[#f5c2c2] text-xs text-[#9b2c2c] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              CareNav AI will never modify clinical dosages. If you wish to change your medication regimen, please consult your prescribing doctor.
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
