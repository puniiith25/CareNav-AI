"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Filter,
  FileText,
  User,
} from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { api } from "@/lib/api";

export default function DoctorAppointmentsPage() {
  const [tab, setTab] = useState<"today" | "upcoming" | "completed" | "cancelled">("today");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const data = await api<any[]>(`/api/doctor/appointments?tab=${tab}`);
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, [tab]);

  async function handleStatusUpdate(id: string, status: string) {
    try {
      await api(`/api/doctor/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      fetchAppointments();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <DoctorAppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Appointments & Clinical Queue</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Review booked appointments, shared records, start clinical consultations, and update status.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          {(["today", "upcoming", "completed", "cancelled"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                tab === t
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-900 border border-slate-800 rounded-xl" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <Calendar className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No {tab} appointments found</p>
            <p className="text-xs text-slate-500">New patient bookings will appear here in real time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                    {appt.patient_name?.[0] || "P"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{appt.patient_name}</span>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {appt.department_name || "Cardiology"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-teal-400" />
                        {appt.starts_at ? new Date(appt.starts_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : "Scheduled"}
                      </span>
                      <span>•</span>
                      <span>{appt.appointment_type || "Cardiology Consultation"}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-teal-300 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {appt.documents_shared || 3} Consented Records
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href={`/doctor/patients/${appt.patient_id}`}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    View Patient
                  </Link>
                  <Link
                    href={`/doctor/consultations/${appt.id}`}
                    className="px-3 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Consultation</span>
                  </Link>
                  {appt.status !== "COMPLETED" && (
                    <button
                      onClick={() => handleStatusUpdate(appt.id, "COMPLETED")}
                      className="p-1.5 rounded bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-400 border border-slate-700 transition-colors"
                      title="Mark Completed"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {appt.status !== "NO_SHOW" && (
                    <button
                      onClick={() => handleStatusUpdate(appt.id, "NO_SHOW")}
                      className="p-1.5 rounded bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 border border-slate-700 transition-colors"
                      title="Mark No-Show"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DoctorAppShell>
  );
}
