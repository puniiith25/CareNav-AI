"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Calendar,
  Clock,
  Pill,
  Activity,
  ArrowRight,
  FileText,
  AlertTriangle,
  Sparkles,
  MapPin,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const data = await api<any>("/api/dashboard");
        setDashboardData(data);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  function handleAiSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    router.push(`/ai?prompt=${encodeURIComponent(aiPrompt)}`);
  }

  const quickActions = [
    { label: "Explain my latest report", prompt: "Explain my latest blood report in simple terms" },
    { label: "Compare my reports", prompt: "Compare my previous and latest blood test reports" },
    { label: "Find a cardiologist", prompt: "I want to consult a cardiologist in Bengaluru" },
    { label: "Show my appointments", prompt: "What upcoming appointments do I have?" },
    { label: "Show my medications", prompt: "What medications did my doctor prescribe?" },
    { label: "Prepare me for my visit", prompt: "Prepare me with questions for my upcoming cardiology appointment" },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#15232b]">
              {dashboardData?.greeting || "Good evening"}, {user?.profile?.full_name?.split(" ")[0] || "Arjun"} 👋
            </h1>
            <p className="text-sm md:text-base text-[#5c6b73] mt-1">
              Let&apos;s take care of your healthcare journey.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="btn btn-ghost text-xs md:text-sm flex items-center gap-2 bg-white hover:bg-[#f3efe6]"
            >
              <MapPin className="w-4 h-4 text-[#0f6e6e]" />
              <span>Explore Bengaluru Map</span>
            </Link>
          </div>
        </div>

        {/* AI Assistant Hero Card */}
        <div className="card p-6 md:p-8 bg-gradient-to-br from-[#0f6e6e] to-[#0b4f4f] text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
              <Bot className="w-4 h-4" />
              <span>CareNav AI Health Assistant</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight mb-2">
              How can I help you today?
            </h2>
            <p className="text-emerald-100/90 text-sm mb-6">
              Ask about your symptoms, upload medical documents, organize records, or find verified healthcare services.
            </p>

            <form onSubmit={handleAiSubmit} className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask about your health, reports, or care navigation..."
                className="flex-1 px-4 py-3 rounded-xl bg-white text-[#15232b] placeholder-[#5c6b73] text-sm md:text-base outline-none shadow-sm focus:ring-2 focus:ring-emerald-300"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#0b4f4f] font-bold text-sm shadow-sm transition-colors flex items-center gap-2 shrink-0"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Actions Chips */}
            <div className="flex flex-wrap gap-2 mt-4 pt-2">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => router.push(`/ai?prompt=${encodeURIComponent(action.prompt)}`)}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs text-white transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3-Column Grid: Upcoming Appointment, Latest Report, Today's Medication */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Appointment */}
          <div className="card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]/60">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">
                  <Calendar className="w-4 h-4" />
                  <span>Upcoming Appointment</span>
                </div>
                <span className="status bg-[#e4f2f1] text-[#0b4f4f]">Confirmed</span>
              </div>

              {dashboardData?.upcoming_appointment ? (
                <div className="py-4 space-y-2">
                  <div className="text-base font-bold text-[#15232b]">
                    {dashboardData.upcoming_appointment.doctor?.full_name || "Dr. Ananya Sharma"}
                  </div>
                  <div className="text-xs font-semibold text-[#0f6e6e]">
                    {dashboardData.upcoming_appointment.doctor?.specialty || "Cardiology"}
                  </div>
                  <div className="text-xs text-[#5c6b73] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{dashboardData.upcoming_appointment.hospital?.name || "Bengaluru Heart & Multispecialty Hospital"}</span>
                  </div>
                  <div className="text-xs font-semibold text-[#15232b] pt-1">
                    🗓️ Sep 3, 2026 · 4:30 PM
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[#5c6b73]">
                  No upcoming appointments scheduled.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#d9d1c3]/60 flex items-center justify-between gap-2">
              <Link
                href="/appointments"
                className="btn btn-ghost text-xs w-full justify-center bg-white hover:bg-[#f3efe6]"
              >
                View Appointment
              </Link>
              <Link
                href="/map"
                className="btn btn-primary text-xs w-full justify-center"
              >
                Directions
              </Link>
            </div>
          </div>

          {/* Latest Blood Report Card */}
          <div className="card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]/60">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">
                  <FileText className="w-4 h-4" />
                  <span>Latest Report</span>
                </div>
                <span className="status bg-emerald-50 text-emerald-700">Analyzed</span>
              </div>

              <div className="py-4 space-y-2">
                <div className="text-base font-bold text-[#15232b]">Complete Blood Count</div>
                <div className="text-xs text-[#5c6b73]">Demo Diagnostics Lab · Sep 1, 2026</div>
                <div className="bg-[#f3efe6] p-2.5 rounded-xl text-xs space-y-1 mt-2">
                  <div className="flex justify-between font-medium text-[#15232b]">
                    <span>Hemoglobin:</span>
                    <span className="font-bold text-[#0f6e6e]">13.8 g/dL (Normal)</span>
                  </div>
                  <div className="flex justify-between text-[#5c6b73]">
                    <span>WBC:</span>
                    <span>7.0 x10^9/L</span>
                  </div>
                  <div className="flex justify-between text-[#5c6b73]">
                    <span>Platelets:</span>
                    <span>228 x10^9/L</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#d9d1c3]/60 flex items-center gap-2">
              <Link
                href="/reports/66666666-6666-6666-6666-666666666602"
                className="btn btn-primary text-xs w-full justify-center"
              >
                View Report & AI Breakdown
              </Link>
              <Link
                href="/reports/compare"
                className="btn btn-ghost text-xs w-full justify-center bg-white"
              >
                Compare Reports
              </Link>
            </div>
          </div>

          {/* Today's Medications */}
          <div className="card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]/60">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">
                  <Pill className="w-4 h-4" />
                  <span>Today&apos;s Medications</span>
                </div>
                <span className="text-xs text-[#5c6b73]">2 active</span>
              </div>

              <div className="py-4 space-y-3">
                <div className="p-2.5 rounded-xl bg-white border border-[#d9d1c3]/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#15232b]">Atorvastatin (Demo)</div>
                    <div className="text-[0.7rem] text-[#5c6b73]">10 mg · Night after dinner</div>
                  </div>
                  <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                    Night
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#d9d1c3]/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#15232b]">Vitamin D3 (Demo)</div>
                    <div className="text-[0.7rem] text-[#5c6b73]">60,000 IU · Once weekly</div>
                  </div>
                  <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                    Weekly
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#d9d1c3]/60">
              <Link
                href="/medications"
                className="btn btn-ghost text-xs w-full justify-center bg-white hover:bg-[#f3efe6]"
              >
                Open Medication Schedule
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Health Timeline & Recovery Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Health Activity */}
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#d9d1c3]/60">
              <div className="flex items-center gap-2 text-sm font-bold text-[#15232b]">
                <Clock className="w-4 h-4 text-[#0f6e6e]" />
                <span>Recent Health Activity</span>
              </div>
              <Link href="/timeline" className="text-xs text-[#0f6e6e] font-semibold hover:underline flex items-center gap-1">
                <span>View Full Timeline</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center font-bold text-xs shrink-0">
                  📄
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#15232b]">Complete Blood Count Report Analyzed</div>
                  <div className="text-xs text-[#5c6b73]">Sep 1, 2026 · AI generated patient-friendly summary</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                  💊
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#15232b]">Prescription Added</div>
                  <div className="text-xs text-[#5c6b73]">Aug 28, 2026 · Dr. Ananya Sharma (Cardiology)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  🩺
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#15232b]">Doctor Visit Completed</div>
                  <div className="text-xs text-[#5c6b73]">Aug 28, 2026 · Bengaluru Heart & Multispecialty Hospital</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Recovery & Wellness Plan */}
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#d9d1c3]/60">
              <div className="flex items-center gap-2 text-sm font-bold text-[#15232b]">
                <Activity className="w-4 h-4 text-[#0f6e6e]" />
                <span>Active Recovery & Follow-up Plan</span>
              </div>
              <Link href="/recovery" className="text-xs text-[#0f6e6e] font-semibold hover:underline flex items-center gap-1">
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4 space-y-3">
              <div className="p-3 rounded-xl bg-white border border-[#d9d1c3]/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#15232b]">Cardiology Follow-Up Regimen</span>
                  <span className="status bg-emerald-50 text-emerald-700">In Progress</span>
                </div>
                <div className="text-xs text-[#5c6b73] mb-3">
                  Documented instructions from Dr. Ananya Sharma following consultation.
                </div>
                <div className="space-y-1.5 text-xs text-[#15232b]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0f6e6e]" />
                    <span>Take prescribed lipid regulation medication daily</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0f6e6e]" />
                    <span>Repeat lipid profile & CBC prior to 4-week review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
