"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  FileText,
  Activity,
  ChevronRight,
  Play,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { api } from "@/lib/api";

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api<any>("/api/doctor/dashboard");
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load doctor dashboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DoctorAppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-800/60 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-800/60 rounded-xl" />
        </div>
      </DoctorAppShell>
    );
  }

  const doctorName = data?.doctor?.full_name || "Dr. Ananya Sharma";
  const stats = data?.stats || {
    today_appointments: 8,
    waiting_patients: 3,
    completed_today: 5,
    followups_due: 4,
  };
  const schedule = data?.today_schedule || [];

  return (
    <DoctorAppShell>
      <div className="space-y-8">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Good morning, {doctorName}</span>
              <span className="text-teal-400">🩺</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              September 3, 2026 • Department of Cardiology • Bengaluru Heart & Multispecialty Hospital
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/doctor/ai"
              className="px-3.5 py-2 rounded-lg bg-teal-600/20 text-teal-300 border border-teal-500/40 text-xs font-semibold hover:bg-teal-600/30 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Doctor AI Summary</span>
            </Link>
          </div>
        </div>

        {/* 4 Clinical Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today&apos;s Appointments</span>
              <Calendar className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{stats.today_appointments}</div>
            <div className="text-[11px] text-teal-400 font-medium mt-1">2 remaining morning slots</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Waiting Patients</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400 mt-2">{stats.waiting_patients}</div>
            <div className="text-[11px] text-slate-400 mt-1">Arjun Mehta in queue</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Completed Today</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{stats.completed_today}</div>
            <div className="text-[11px] text-emerald-400 mt-1">Prescriptions signed</div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Follow-ups Due</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mt-2">{stats.followups_due}</div>
            <div className="text-[11px] text-blue-400 mt-1">Blood reports pending review</div>
          </div>
        </div>

        {/* Schedule & Queue Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Today&apos;s Schedule & Patient Queue</h2>
              <p className="text-xs text-slate-400">Manage in-person consultations, review authorized shared records, and conduct sessions.</p>
            </div>
            <Link href="/doctor/appointments" className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-y border-slate-800">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Shared Records</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {schedule.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                      {item.starts_at ? new Date(item.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "04:30 PM"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 text-teal-300 flex items-center justify-center text-[10px] font-bold">
                          {item.patient_name?.[0] || "P"}
                        </div>
                        <span>{item.patient_name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{item.reason || "Cardiology Consultation"}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.status === "WAITING"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : item.status === "COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                        }`}
                      >
                        {item.status || "Confirmed"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <span className="inline-flex items-center gap-1.5 text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <ShieldCheck className="w-3 h-3 text-teal-400" />
                        <span>{item.shared_documents_count || 3} items consented</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/doctor/patients/${item.patient_id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-colors"
                        >
                          View Patient
                        </Link>
                        <Link
                          href={`/doctor/consultations/${item.id}`}
                          className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start Consultation</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DoctorAppShell>
  );
}
