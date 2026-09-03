"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Users,
  Stethoscope,
  Activity,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Bot,
  Sparkles,
  BarChart3,
  Layers,
  Clock,
} from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";
import { api } from "@/lib/api";

export default function HospitalDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDash() {
      try {
        const res = await api<any>("/api/hospital/dashboard");
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDash();
  }, []);

  if (loading) {
    return (
      <HospitalAppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-slate-900 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-900 rounded-xl" />
        </div>
      </HospitalAppShell>
    );
  }

  const metrics = data?.metrics || {
    today_appointments: 126,
    doctors_working: 34,
    patients_today: 98,
    emergency_cases: 7,
    available_slots: 42,
  };

  const hospital = data?.hospital || {
    name: "Bengaluru Heart & Multispecialty Hospital",
    address: "12 Demo Health Avenue, Bengaluru",
    emergency_available: true,
  };

  return (
    <HospitalAppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>{hospital.name}</span>
              <span className="text-blue-400">🏥</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Operational Command Center • Bengaluru, Karnataka • Emergency: {hospital.emergency_available ? "24x7 Active" : "Inactive"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/hospital/ai"
              className="px-3.5 py-2 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/40 text-xs font-semibold hover:bg-blue-600/30 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Operational AI</span>
            </Link>
          </div>
        </div>

        {/* 5 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Today&apos;s Appointments</span>
            <div className="text-2xl font-bold text-white mt-1">{metrics.today_appointments}</div>
            <div className="text-[11px] text-blue-400 mt-1 font-medium">+14 booked today</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Doctors Working</span>
            <div className="text-2xl font-bold text-white mt-1">{metrics.doctors_working}</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-medium">8 departments staffed</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Patients Today</span>
            <div className="text-2xl font-bold text-white mt-1">{metrics.patients_today}</div>
            <div className="text-[11px] text-slate-400 mt-1">Check-in active</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Emergency Cases</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{metrics.emergency_cases}</div>
            <div className="text-[11px] text-rose-400 mt-1 font-medium">ICU Beds: 4 Available</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Available Slots</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{metrics.available_slots}</div>
            <div className="text-[11px] text-emerald-400 mt-1 font-medium">Next open: 05:00 PM</div>
          </div>
        </div>

        {/* Operational Overview: Department Load & Real-Time Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Volume */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Department Appointment Volume</span>
            </h3>
            <div className="space-y-3">
              {[
                { name: "Cardiology", count: 48, pct: 80 },
                { name: "Orthopedics", count: 32, pct: 60 },
                { name: "Internal Medicine", count: 28, pct: 50 },
                { name: "Diagnostics & Imaging", count: 22, pct: 40 },
                { name: "Emergency Medicine", count: 18, pct: 30 },
              ].map((d) => (
                <div key={d.name} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{d.name}</span>
                    <span className="font-bold text-white">{d.count} visits</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${d.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Flow Queue */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Operational Patient Flow</span>
                </h3>
                <p className="text-xs text-slate-400">Manage patient state: Booked → Checked In → Waiting → In Consultation → Completed</p>
              </div>
              <Link href="/hospital/appointments" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <span>All Appointments</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {[
                { name: "Arjun Mehta", time: "06:30 PM", doc: "Dr. Ananya Sharma", dept: "Cardiology", status: "WAITING" },
                { name: "Rahul Kumar", time: "05:00 PM", doc: "Dr. Rahul Menon", dept: "Cardiology", status: "CHECKED_IN" },
                { name: "Sneha Rao", time: "04:30 PM", doc: "Dr. Kavya Rao", dept: "Orthopedics", status: "IN_CONSULTATION" },
                { name: "Vikram Sethi", time: "03:00 PM", doc: "Dr. Arjun Nair", dept: "Neurology", status: "COMPLETED" },
              ].map((row, idx) => (
                <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div>
                    <p className="font-bold text-white">{row.name}</p>
                    <p className="text-[11px] text-slate-400">{row.time} • {row.doc} ({row.dept})</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      row.status === "WAITING"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : row.status === "IN_CONSULTATION"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : row.status === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </HospitalAppShell>
  );
}
