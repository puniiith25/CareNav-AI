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
  Phone,
  PhoneCall,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");

  useEffect(() => {
    async function fetchDashboard() {
      // Wait for auth context to fully resolve
      if (authLoading) return;
      // Only call the API if we have a logged-in user and a token
      const token = typeof window !== "undefined" ? localStorage.getItem("carenav_token") : null;
      if (!user || !token) {
        setLoading(false);
        return;
      }
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
  }, [authLoading, user]);

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
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0c1920]">
              {dashboardData?.greeting || "Good evening"}, {user?.profile?.full_name?.split(" ")[0] || "Arjun"} 👋
            </h1>
            <p className="text-sm md:text-base text-[#3d505a] font-medium mt-1">
              Let&apos;s take care of your healthcare journey.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/map"
              className="btn btn-ghost text-xs md:text-sm font-semibold flex items-center gap-2 bg-white text-[#0f6e6e] border-[#bce2df] hover:bg-[#e4f2f1] shadow-xs"
            >
              <MapPin className="w-4 h-4 text-[#0f6e6e]" />
              <span>Explore Healthcare Map</span>
            </Link>
          </div>
        </div>

        {/* AI Assistant Hero Card */}
        <div className="card p-6 md:p-8 bg-[#0a4d4d] text-white shadow-xl relative overflow-hidden border-2 border-[#0f6e6e]">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-400 text-xs font-extrabold uppercase tracking-wider mb-3">
              <Bot className="w-4 h-4 text-emerald-500" />
              <span>CareNav AI Health Assistant</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2.5 text-black drop-shadow-xs">
              How can I help you today?
            </h2>
            <p className="text-emerald-500 text-sm md:text-base font-medium mb-6 leading-relaxed opacity-95">
              Ask about your health, upload medical photos, verify lab parameters with Gemini, or navigate verified clinics.
            </p>

            <form onSubmit={handleAiSubmit} className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask about your symptoms, scan a report, or request guidance..."
                className="flex-1 px-4 py-3.5 rounded-xl bg-white text-[#0c1920] placeholder-[#5c6b73] text-sm md:text-base outline-none shadow-md font-medium focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#073333] font-extrabold text-sm shadow-md transition-all flex items-center gap-2 shrink-0 hover:scale-102"
              >
                <span>Ask AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Actions Chips */}
            <div className="flex flex-wrap gap-2 mt-4 pt-1">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => router.push(`/ai?prompt=${encodeURIComponent(action.prompt)}`)}
                  className="px-3.5 py-1.5 rounded-full bg-white text-[#0a4d4d] hover:bg-emerald-50 text-xs font-bold transition-all shadow-xs"
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
          <div className="card p-5 flex flex-col justify-between bg-white border border-[#d9d1c3] shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]/70">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">
                  <Calendar className="w-4 h-4" />
                  <span>Upcoming Appointment</span>
                </div>
                <span className="status bg-[#e4f2f1] text-[#0b4f4f] font-bold">Confirmed</span>
              </div>

              {dashboardData?.upcoming_appointment ? (
                <div className="py-4 space-y-2">
                  <div className="text-base font-bold text-[#0c1920]">
                    {dashboardData.upcoming_appointment.doctor?.full_name || "Dr. Ananya Sharma"}
                  </div>
                  <div className="text-xs font-bold text-[#0f6e6e]">
                    {dashboardData.upcoming_appointment.doctor?.specialty || "Cardiology"}
                  </div>
                  <div className="text-xs text-[#3d505a] font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#0f6e6e]" />
                    <span className="truncate">{dashboardData.upcoming_appointment.hospital?.name || "Bengaluru Heart & Multispecialty Hospital"}</span>
                  </div>
                  <div className="text-xs font-bold text-[#0c1920] pt-1">
                    🗓️ Sep 3, 2026 · 4:30 PM
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-[#5c6b73]">
                  No upcoming appointments scheduled.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#d9d1c3]/70 flex items-center justify-between gap-2">
              <Link
                href="/appointments"
                className="btn btn-ghost text-xs w-full justify-center bg-[#fbf9f4] hover:bg-[#f3efe6] text-[#0c1920] font-semibold"
              >
                View Details
              </Link>
              <Link
                href="/map"
                className="btn btn-primary text-xs w-full justify-center font-bold"
              >
                Directions
              </Link>
            </div>
          </div>

          {/* Latest Blood Report Card */}
          <div className="card p-5 flex flex-col justify-between bg-white border border-[#d9d1c3] shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]/70">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">
                  <FileText className="w-4 h-4" />
                  <span>Latest Lab Report</span>
                </div>
                <span className="status bg-emerald-100 text-emerald-900 font-bold">Analyzed</span>
              </div>

              <div className="py-4 space-y-2">
                <div className="text-base font-bold text-[#0c1920]">Complete Blood Count</div>
                <div className="text-xs text-[#3d505a] font-medium">Demo Diagnostics Lab · Sep 1, 2026</div>
                <div className="bg-[#fbf9f4] border border-[#d9d1c3]/70 p-3 rounded-xl text-xs space-y-1.5 mt-2">
                  <div className="flex justify-between font-semibold text-[#0c1920]">
                    <span>Hemoglobin:</span>
                    <span className="font-bold text-[#0f6e6e]">13.8 g/dL (Normal)</span>
                  </div>
                  <div className="flex justify-between text-[#3d505a] font-medium">
                    <span>WBC:</span>
                    <span className="font-semibold text-[#0c1920]">7.0 x10^9/L</span>
                  </div>
                  <div className="flex justify-between text-[#3d505a] font-medium">
                    <span>Platelets:</span>
                    <span className="font-semibold text-[#0c1920]">228 x10^9/L</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#d9d1c3]/70 flex items-center gap-2">
              <Link
                href="/ai"
                className="btn btn-primary text-xs w-full justify-center font-bold"
              >
                Open in AI Assistant &amp; Breakdown
              </Link>
            </div>
          </div>

          {/* Today's Medications */}
          <div className="card p-5 flex flex-col justify-between bg-white border border-[#d9d1c3] shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]/70">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">
                  <Pill className="w-4 h-4" />
                  <span>Today&apos;s Medications</span>
                </div>
                <span className="text-xs font-bold text-[#0f6e6e] bg-[#e4f2f1] px-2 py-0.5 rounded-full">2 active</span>
              </div>

              <div className="py-4 space-y-2.5">
                <div className="p-3 rounded-xl bg-[#fbf9f4] border border-[#d9d1c3]/70 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#0c1920]">Atorvastatin</div>
                    <div className="text-[0.7rem] text-[#3d505a] font-medium">10 mg · Night after dinner</div>
                  </div>
                  <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                    Night
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#fbf9f4] border border-[#d9d1c3]/70 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#0c1920]">Vitamin D3</div>
                    <div className="text-[0.7rem] text-[#3d505a] font-medium">60,000 IU · Once weekly</div>
                  </div>
                  <span className="text-[0.7rem] px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold border border-blue-300">
                    Weekly
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#d9d1c3]/70">
              <Link
                href="/medications"
                className="btn btn-ghost text-xs w-full justify-center bg-[#fbf9f4] hover:bg-[#f3efe6] text-[#0c1920] font-semibold"
              >
                Open Medication Schedule
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Section: Health Timeline & Recovery Plan */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Health Activity */}
          <div className="card p-6 bg-white border border-[#d9d1c3] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#d9d1c3]/70">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0c1920]">
                <Clock className="w-4.5 h-4.5 text-[#0f6e6e]" />
                <span>Recent Health Activity</span>
              </div>
              <Link href="/timeline" className="text-xs text-[#0f6e6e] font-bold hover:underline flex items-center gap-1">
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
                  <div className="text-sm font-bold text-[#0c1920]">Complete Blood Count Report Analyzed</div>
                  <div className="text-xs text-[#3d505a] font-medium">Sep 1, 2026 · AI generated patient-friendly summary</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
                  💊
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#0c1920]">Prescription Added</div>
                  <div className="text-xs text-[#3d505a] font-medium">Aug 28, 2026 · Dr. Ananya Sharma (Cardiology)</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  🩺
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[#0c1920]">Doctor Visit Completed</div>
                  <div className="text-xs text-[#3d505a] font-medium">Aug 28, 2026 · Bengaluru Heart & Multispecialty Hospital</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Recovery & Wellness Plan */}
          <div className="card p-6 bg-white border border-[#d9d1c3] shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#d9d1c3]/70">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0c1920]">
                <Activity className="w-4.5 h-4.5 text-[#0f6e6e]" />
                <span>Active Recovery &amp; Follow-up Plan</span>
              </div>
              <Link href="/recovery" className="text-xs text-[#0f6e6e] font-bold hover:underline flex items-center gap-1">
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="pt-4 space-y-3">
              <div className="p-3.5 rounded-xl bg-[#fbf9f4] border border-[#d9d1c3]/70">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#0c1920]">Cardiology Follow-Up Regimen</span>
                  <span className="status bg-emerald-100 text-emerald-900 font-bold">In Progress</span>
                </div>
                <div className="text-xs text-[#3d505a] font-medium mb-3">
                  Documented instructions from Dr. Ananya Sharma following consultation.
                </div>
                <div className="space-y-1.5 text-xs text-[#0c1920] font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0f6e6e] shrink-0" />
                    <span>Take prescribed lipid regulation medication daily</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#0f6e6e] shrink-0" />
                    <span>Repeat lipid profile &amp; CBC prior to 4-week review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 24/7 Emergency & 108 Ambulance Fast Access Banner */}
        <div className="card p-5 bg-[#fff5f5] border-2 border-red-300 text-[#15232b] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm md:text-base text-[#15232b]">Emergency Assistance &amp; 108 Ambulance</h3>
              <p className="text-[#15232b] font-medium text-xs mt-0.5">
                Immediate access to National Emergency (112) and 24/7 Karnataka Ambulance Service (108).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="tel:108"
              className="px-4 py-2.5 rounded-xl bg-white text-[#15232b] hover:bg-red-50 text-xs font-extrabold shadow-md transition-colors flex items-center gap-1.5 border border-red-200"
            >
              <Phone className="w-3.5 h-3.5 text-red-600" />
              <span>Call 108 Ambulance</span>
            </a>
            <Link
              href="/emergency"
              className="px-4 py-2.5 rounded-xl bg-white text-[#15232b] hover:bg-slate-100 text-xs font-bold border border-[#d9d1c3] shadow-md transition-colors"
            >
              View 24/7 Trauma Centers
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
