"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  User,
  ShieldCheck,
  Calendar,
  FileText,
  Pill,
  Clock,
  Activity,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Play,
  AlertCircle,
} from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { api } from "@/lib/api";

export default function DoctorPatientProfilePage({ params }: { params: Promise<{ patientId: string }> }) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.patientId;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "reports" | "medications" | "prescriptions" | "timeline" | "recovery">("overview");

  useEffect(() => {
    async function fetchPatient() {
      try {
        const res = await api<any>(`/api/doctor/patients/${patientId}`);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Unable to load patient records.");
      } finally {
        setLoading(false);
      }
    }
    fetchPatient();
  }, [patientId]);

  if (loading) {
    return (
      <DoctorAppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/4" />
          <div className="h-44 bg-slate-900 rounded-xl" />
          <div className="h-96 bg-slate-900 rounded-xl" />
        </div>
      </DoctorAppShell>
    );
  }

  if (error || !data) {
    return (
      <DoctorAppShell>
        <div className="p-8 bg-slate-900 border border-rose-900/60 rounded-2xl text-center space-y-4 max-w-lg mx-auto mt-12">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Access Restricted</h2>
          <p className="text-xs text-slate-300">{error || "Your access to this patient's records has expired or not been consented."}</p>
          <Link href="/doctor/patients" className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold">
            Back to Patient Directory
          </Link>
        </div>
      </DoctorAppShell>
    );
  }

  const patient = data.patient;
  const consent = data.consent;
  const reports = data.reports || [];
  const medications = data.medications || [];
  const prescriptions = data.prescriptions || [];
  const recoveryPlans = data.recovery_plans || [];
  const recoveryTasks = data.recovery_tasks || [];
  const timeline = data.timeline || [];

  return (
    <DoctorAppShell>
      <div className="space-y-6">
        {/* Back Link */}
        <Link href="/doctor/patients" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Authorized Patients
        </Link>

        {/* Patient Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-950 border border-teal-700 text-teal-300 flex items-center justify-center font-bold text-xl">
              {patient.full_name[0] || "P"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">{patient.full_name}</h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Consent Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {patient.age} years • {patient.city} • Contact: {patient.phone} • Emergency Contact: {patient.emergency_contact || "Neha Mehta"}
              </p>
              <p className="text-xs text-teal-400 font-medium flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Patient-controlled access granted for 7 days (Sep 1 – Sep 10, 2026)</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/doctor/prescriptions/new"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Pill className="w-3.5 h-3.5 text-teal-400" />
              <span>Create Prescription</span>
            </Link>
            <Link
              href={`/doctor/consultations/${data.appointments?.[0]?.id || "demo-appt"}`}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Consultation</span>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {(["overview", "reports", "medications", "prescriptions", "recovery", "timeline"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider capitalize transition-colors ${
                activeTab === tab
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Summary and Consented Items */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Consented Medical Reports</span>
                </h3>
                <div className="space-y-2">
                  {reports.map((r: any) => (
                    <div key={r.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{r.test_name}</p>
                        <p className="text-[11px] text-slate-400">{r.report_date} • {r.hospital_or_lab}</p>
                      </div>
                      <Link
                        href={`/doctor/reports/${r.id}`}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-teal-600 text-slate-200 hover:text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recovery Roadmap */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Active Recovery Plan</span>
                </h3>
                <div className="space-y-2">
                  {recoveryTasks.map((task: any) => (
                    <div key={task.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-1">
                      <span className="font-semibold text-teal-300">{task.section}:</span>
                      <p className="text-slate-300">{task.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Quick AI Clinical Assistant Box */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-teal-950/50 to-slate-900 border border-teal-800/60 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>AI Patient Summary</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Recent Healthcare Activity:
                  <br />• Complete Blood Count (01 Sep 2026) — Hb 13.8 g/dL, WBC 7.0
                  <br />• Basic Metabolic Panel (01 Sep 2026) — Glucose 98 mg/dL
                  <br />• Cardiology visit (28 Aug 2026) — Demo Medicine A & B
                  <br />• Current Appointment: Confirmed for 03 Sep, 06:30 PM
                </p>
                <div className="text-[10px] text-slate-400 italic pt-2 border-t border-slate-800">
                  AI-generated summary. Verify against the original patient records before making clinical decisions.
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Medications</h4>
                <div className="space-y-2">
                  {medications.map((m: any) => (
                    <div key={m.id} className="p-2.5 bg-slate-950 rounded border border-slate-800 text-xs">
                      <p className="font-bold text-white">{m.name} ({m.dose})</p>
                      <p className="text-[11px] text-slate-400">{m.frequency} • {m.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="space-y-4">
            {reports.map((r: any) => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{r.test_name}</h3>
                    <p className="text-xs text-slate-400">Date: {r.report_date} • Facility: {r.hospital_or_lab}</p>
                  </div>
                  <Link
                    href={`/doctor/reports/${r.id}`}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Open Structured Viewer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "medications" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white">Active Documented Medications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {medications.map((m: any) => (
                <div key={m.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{m.name}</span>
                    <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-mono text-[10px]">
                      {m.dose}
                    </span>
                  </div>
                  <p className="text-slate-300">Frequency: {m.frequency}</p>
                  <p className="text-slate-400">Instructions: {m.instructions || "Take as prescribed."}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div className="space-y-3">
            {prescriptions.map((rx: any) => (
              <div key={rx.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Signed Clinical Prescription</span>
                  <span className="text-slate-400 font-mono">{rx.issued_at}</span>
                </div>
                <p className="text-slate-300">{rx.notes}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Consented Patient Timeline</h3>
            <div className="space-y-4 border-l border-slate-800 pl-4">
              {timeline.map((event: any) => (
                <div key={event.id} className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-slate-900" />
                  <p className="text-xs font-bold text-white">{event.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(event.occurred_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DoctorAppShell>
  );
}
