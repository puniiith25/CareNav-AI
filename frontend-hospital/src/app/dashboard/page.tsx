"use client";

import Link from "next/link";
import { Calendar, Users, Bot, Building2, Sparkles, ArrowRight, Check } from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";

export default function HospitalDashboardPage() {
  return (
    <HospitalAppShell>
      <div className="space-y-8 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            Hospital Admin Portal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Accept or reject patient appointments and review patient reports.
          </p>
        </div>

        {/* 3 Core Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Appointments */}
          <Link
            href="/appointments"
            className="group bg-slate-900 border border-slate-800 hover:border-blue-600/60 rounded-2xl p-6 space-y-4 transition-all hover:shadow-xl hover:shadow-blue-900/20"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Appointments</h2>
              <p className="text-xs text-slate-400 mt-1">
                Review incoming patient booking requests. Accept to assign to doctor, or reject.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:gap-2.5 transition-all">
              <span>Manage Bookings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Patient Reviews */}
          <Link
            href="/patients"
            className="group bg-slate-900 border border-slate-800 hover:border-emerald-600/60 rounded-2xl p-6 space-y-4 transition-all hover:shadow-xl hover:shadow-emerald-900/20"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Patient Reviews</h2>
              <p className="text-xs text-slate-400 mt-1">
                View patient details and consultation reports submitted by doctors.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:gap-2.5 transition-all">
              <span>View Patients</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* AI Assistant */}
          <Link
            href="/ai"
            className="group bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-700/40 hover:border-blue-500/60 rounded-2xl p-6 space-y-4 transition-all hover:shadow-xl hover:shadow-blue-900/30"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                AI Assistant
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Use AI to analyze patient reports, summarize appointment data, or answer queries.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 group-hover:gap-2.5 transition-all">
              <span>Open AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Workflow guide */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Appointment Workflow</h3>
          <div className="space-y-3">
            {[
              { step: "1", text: "Patient books an appointment through the CareNav Patient App.", color: "bg-blue-500" },
              { step: "2", text: "You review the request in Appointments → click Accept to route to doctor or Reject.", color: "bg-blue-600" },
              { step: "3", text: "Accepted appointments appear in the Doctor's clinical queue automatically.", color: "bg-teal-500" },
              { step: "4", text: "After the doctor completes their review, the patient receives an official report.", color: "bg-emerald-500" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className={`w-5 h-5 rounded-full ${item.color} text-white text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5`}>
                  {item.step}
                </span>
                <p className="text-xs text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </HospitalAppShell>
  );
}
