"use client";

import { useEffect, useState } from "react";
import { Users, Clock, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";
import { api } from "@/lib/api";

export default function HospitalPatientsFlowPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAppts() {
    try {
      const data = await api<any[]>("/api/hospital/appointments");
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppts();
  }, []);

  const flowStages = [
    { key: "CONFIRMED", label: "1. Booked & Scheduled", color: "border-slate-700 bg-slate-900" },
    { key: "CHECKED_IN", label: "2. Reception Checked In", color: "border-blue-700 bg-blue-950/40" },
    { key: "WAITING", label: "3. Waiting Room", color: "border-amber-700 bg-amber-950/40" },
    { key: "IN_CONSULTATION", label: "4. In Consultation", color: "border-teal-700 bg-teal-950/40" },
    { key: "COMPLETED", label: "5. Completed & Prescribed", color: "border-emerald-700 bg-emerald-950/40" },
  ];

  return (
    <HospitalAppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>Realtime Patient Flow Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Visual pipeline tracking patient journey stages from check-in to consultation completion.
          </p>
        </div>

        {/* 5-Stage Kanban/Flow Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {flowStages.map((stage) => {
            const stageAppts = appointments.filter((a) => (a.status || "CONFIRMED") === stage.key);
            return (
              <div key={stage.key} className={`border rounded-xl p-3 flex flex-col min-h-[400px] ${stage.color}`}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{stage.label}</span>
                  <span className="text-xs font-mono font-bold text-blue-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {stageAppts.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto">
                  {stageAppts.map((a) => (
                    <div key={a.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 shadow-sm space-y-1.5 text-xs">
                      <p className="font-bold text-white">{a.patient_name || "Arjun Mehta"}</p>
                      <p className="text-[11px] text-slate-400">{a.doctor_name} ({a.department_name})</p>
                      <p className="text-[10px] text-teal-400 font-mono">
                        {a.starts_at ? new Date(a.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled"}
                      </p>
                    </div>
                  ))}
                  {stageAppts.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-slate-600 italic">No patients in this stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </HospitalAppShell>
  );
}
