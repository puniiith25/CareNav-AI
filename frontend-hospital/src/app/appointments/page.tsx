"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Check,
  X,
  Send,
  AlertTriangle,
  User,
  Stethoscope,
  Building2,
} from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";
import { api } from "@/lib/api";

export default function HospitalAppointmentsOpsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  async function fetchAppts() {
    try {
      const data = await api<any[]>("/api/hospital/appointments");
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppts();
  }, []);

  async function handleAcceptOrReject(id: string, status: "ACCEPTED" | "REJECTED", patientName: string, doctorName: string) {
    try {
      await api(`/api/doctor/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: status === "ACCEPTED" ? "CONFIRMED" : "CANCELLED",
          notes: status === "ACCEPTED" ? "Approved by Hospital Admin & assigned to doctor." : "Rejected by Hospital Admin.",
        }),
      });

      if (status === "ACCEPTED") {
        setActionSuccess(`✓ Appointment for ${patientName} ACCEPTED & dispatched to ${doctorName}'s queue!`);
      } else {
        setActionSuccess(`Appointment for ${patientName} was REJECTED.`);
      }
      setTimeout(() => setActionSuccess(null), 5000);
      fetchAppts();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <HospitalAppShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Banner Alert */}
        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-lg animate-in slide-in-from-top-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="p-1 hover:bg-emerald-800/40 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              <span>Hospital Admin Appointment Triage</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Review user appointment requests, accept to route to doctors, or reject with instant notification.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {appointments.filter((a) => a.status === "REQUESTED" || a.status === "CONFIRMED").length} Active Bookings
            </span>
          </div>
        </div>

        {/* Clean Appointments List */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Incoming Patient Appointments</span>
            </h3>
            <span className="text-[11px] text-slate-400">Live Hospital Queue</span>
          </div>

          <div className="divide-y divide-slate-800">
            {appointments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No appointments found.</div>
            ) : (
              appointments.map((a) => {
                const isPendingOrConfirmed = a.status === "REQUESTED" || a.status === "CONFIRMED";
                const isCompleted = a.status === "COMPLETED";
                const isCancelled = a.status === "CANCELLED" || a.status === "REJECTED";

                return (
                  <div
                    key={a.id}
                    className="p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    {/* Patient & Doctor info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm sm:text-base text-white">
                          {a.patient_name || "Arjun Mehta"}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {a.relationship || "Self"}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isCompleted
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : isCancelled
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {a.status === "CONFIRMED" ? "ACCEPTED & ROUTED" : a.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <div className="flex items-center gap-1 text-slate-300 font-medium">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                          <span>{a.doctor_name || "Doctor"} ({a.department_name || "Department"})</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>
                            {a.starts_at ? new Date(a.starts_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Scheduled Time"}
                          </span>
                        </div>
                      </div>

                      {a.reason && (
                        <p className="text-xs text-slate-400 mt-1">
                          <span className="font-semibold text-slate-300">Concern:</span> {a.reason}
                        </p>
                      )}
                    </div>

                    {/* Simple Action Controls: Accept / Reject */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                      {!isCompleted && !isCancelled && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptOrReject(a.id, "ACCEPTED", a.patient_name, a.doctor_name)}
                            className="flex-1 md:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 hover:scale-102"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept & Send to Doctor</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleAcceptOrReject(a.id, "REJECTED", a.patient_name, a.doctor_name)}
                            className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-800/40">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Doctor Review & Report Completed</span>
                        </div>
                      )}

                      {isCancelled && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-800/40">
                          <XCircle className="w-4 h-4" />
                          <span>Rejected / Cancelled</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </HospitalAppShell>
  );
}
