"use client";

import Link from "next/link";
import { Calendar, Stethoscope, Bot, Sparkles, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";

export default function DoctorDashboardPage() {
  return (
    <DoctorAppShell>
      <div className="space-y-8 max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-teal-400" />
            Doctor Clinical Station
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage patient appointments and conduct consultation reviews.
          </p>
        </div>

        {/* 3 Core Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Appointments */}
          <Link
            href="/appointments"
            className="group bg-slate-900 border border-slate-800 hover:border-teal-600/60 rounded-2xl p-6 space-y-4 transition-all hover:shadow-xl hover:shadow-teal-900/20"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-600/20 border border-teal-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Appointments</h2>
              <p className="text-xs text-slate-400 mt-1">
                View hospital-approved patient appointments assigned to your queue.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 group-hover:gap-2.5 transition-all">
              <span>Open Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Patient Review */}
          <Link
            href="/consultations"
            className="group bg-slate-900 border border-slate-800 hover:border-emerald-600/60 rounded-2xl p-6 space-y-4 transition-all hover:shadow-xl hover:shadow-emerald-900/20"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Stethoscope className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Patient Review</h2>
              <p className="text-xs text-slate-400 mt-1">
                Conduct consultation reviews and send official reports directly to patients.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:gap-2.5 transition-all">
              <span>Start Review</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* AI Assistant */}
          <Link
            href="/ai"
            className="group bg-gradient-to-br from-teal-950 to-slate-900 border border-teal-700/40 hover:border-teal-500/60 rounded-2xl p-6 space-y-4 transition-all hover:shadow-xl hover:shadow-teal-900/30"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                AI Assistant
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ask AI to review patient reports, summarize history, or suggest treatment plans.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-300 group-hover:gap-2.5 transition-all">
              <span>Open AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Quick How-to */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">How It Works</h3>
          <div className="space-y-3">
            {[
              { step: "1", text: "Hospital Admin approves a patient appointment → it appears in your Appointments queue.", color: "bg-blue-500" },
              { step: "2", text: "Open the appointment → fill in the Patient Review form with your clinical findings.", color: "bg-teal-500" },
              { step: "3", text: "Submit the review → an official clinical report is automatically sent to the patient.", color: "bg-emerald-500" },
              { step: "4", text: "Use AI Assistant to analyze patient reports, get summaries, or ask clinical questions.", color: "bg-purple-500" },
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
    </DoctorAppShell>
  );
}
