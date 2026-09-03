"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, CheckCircle2, XCircle, Search, Filter } from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";
import { api } from "@/lib/api";

export default function HospitalAppointmentsOpsPage() {
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

  async function updateStatus(id: string, status: string) {
    try {
      await api(`/api/doctor/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      fetchAppts();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <HospitalAppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-400" />
            <span>Hospital Operational Appointments</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Realtime reception check-in, waiting queue, and appointment operations.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Time</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Doctor & Department</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Operational Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {appointments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                    {a.starts_at ? new Date(a.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Scheduled"}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">{a.patient_name || "Arjun Mehta"}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-semibold text-slate-200">{a.doctor_name}</p>
                    <p className="text-[11px] text-slate-400">{a.department_name}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === "WAITING"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : a.status === "CHECKED_IN"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : a.status === "COMPLETED"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {a.status === "CONFIRMED" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(a.id, "CHECKED_IN")}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold"
                      >
                        Check In
                      </button>
                    )}
                    {a.status === "CHECKED_IN" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(a.id, "WAITING")}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold"
                      >
                        Queue in Waiting Room
                      </button>
                    )}
                    {a.status !== "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => updateStatus(a.id, "COMPLETED")}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold"
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </HospitalAppShell>
  );
}
