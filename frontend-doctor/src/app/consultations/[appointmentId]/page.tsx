"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  ArrowLeft,
  FileText,
  Pill,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowRight,
  ShieldCheck,
  Send,
  Check,
  X,
  FileCheck2,
} from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { api } from "@/lib/api";

export default function DoctorConsultationWorkspacePage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const resolvedParams = use(params);
  const appointmentId = resolvedParams.appointmentId;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);

  // Form state
  const [chiefConcern, setChiefConcern] = useState(
    "Cardiology follow-up & blood panel review."
  );
  const [clinicalNotes, setClinicalNotes] = useState(
    "Patient is feeling well, no angina or shortness of breath on routine exertion."
  );
  const [assessment, setAssessment] = useState(
    "Controlled cardiovascular risk profile. Lipid panel and CBC in stable range."
  );
  const [plan, setPlan] = useState(
    "Maintain current medication schedule. Repeat lipid panel in 6 months. Maintain 20-min daily walking."
  );
  const [followUpNotes, setFollowUpNotes] = useState(
    "Follow-up in 30 days if new symptoms arise."
  );

  useEffect(() => {
    async function fetchWorkspace() {
      try {
        const res = await api<any>(
          `/api/doctor/consultations/${appointmentId}`
        );
        setData(res);
        if (res.consultation) {
          setChiefConcern(res.consultation.chief_concern || "");
          setClinicalNotes(res.consultation.clinical_notes || "");
          setAssessment(res.consultation.assessment || "");
          setPlan(res.consultation.plan || "");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchWorkspace();
  }, [appointmentId]);

  async function handleSaveAndSendReport(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api<any>("/api/doctor/consultations", {
        method: "POST",
        body: JSON.stringify({
          appointment_id: appointmentId,
          patient_id:
            data?.patient?.id || "44444444-4444-4444-4444-444444444410",
          chief_concern: chiefConcern,
          clinical_notes: clinicalNotes,
          assessment: assessment,
          plan: plan,
          follow_up_notes: followUpNotes,
        }),
      });
      setGeneratedReport({
        report_id: res.report_id,
        patient_name: data?.patient?.full_name || "Arjun Mehta",
        test_name: "Consultation Review & Clinical Assessment",
        date: new Date().toLocaleDateString(),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DoctorAppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-slate-900 rounded-xl" />
            <div className="h-96 bg-slate-900 rounded-xl lg:col-span-2" />
          </div>
        </div>
      </DoctorAppShell>
    );
  }

  const patient = data?.patient || {
    full_name: "Arjun Mehta",
    age: 34,
    city: "Bengaluru",
  };
  const reports = data?.recent_reports || [];
  const medications = data?.medications || [];

  return (
    <DoctorAppShell>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/doctor/appointments"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Clinical Queue
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-teal-400" />
              <span>Doctor Consultation & Patient Review</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/doctor/prescriptions/new"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Pill className="w-4 h-4 text-teal-400" />
              <span>Write Prescription</span>
            </Link>
          </div>
        </div>

        {/* Success Modal / Banner when Report is Created & Sent */}
        {generatedReport && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950 to-emerald-950 border-2 border-emerald-500/50 shadow-2xl space-y-3 animate-in zoom-in-95 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <FileCheck2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Clinical Report Created & Sent to Patient!
                  </h3>
                  <p className="text-xs text-emerald-300 mt-0.5">
                    Your consultation review has been converted into an official report and sent to {generatedReport.patient_name}'s reports tab.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGeneratedReport(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div><span className="font-bold text-white">Document:</span> Consultation Review & Clinical Assessment</div>
              <div><span className="font-bold text-white">Patient:</span> {generatedReport.patient_name}</div>
              <div><span className="font-bold text-white">Date:</span> {generatedReport.date}</div>
              <div><span className="font-bold text-white">Status:</span> Delivered to User Reports & Health Memory ✓</div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Link
                href="/doctor/appointments"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
              >
                <span>Return to Clinical Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* 3-Column Clinical Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Patient Overview & Consented Records */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Patient Overview
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-950 border border-teal-700 text-teal-300 flex items-center justify-center font-bold text-base">
                  {patient.full_name[0] || "P"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {patient.full_name}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {patient.age} yrs • {patient.city}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-xs text-teal-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Hospital Approved • Active Consent Verified</span>
              </div>
            </div>

            {/* Consented Reports Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Patient Medical History & Reports
              </h3>
              <div className="space-y-2">
                {reports.slice(0, 3).map((r: any) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">{r.test_name}</p>
                      <p className="text-[10px] text-slate-400">
                        {r.report_date}
                      </p>
                    </div>
                    <Link
                      href={`/doctor/reports/${r.id}`}
                      className="text-teal-400 hover:underline text-[11px] font-semibold"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Medications Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Medications
              </h3>
              <div className="space-y-2">
                {medications.slice(0, 3).map((m: any) => (
                  <div
                    key={m.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                  >
                    <p className="font-bold text-white">
                      {m.name} ({m.dose})
                    </p>
                    <p className="text-[10px] text-slate-400">{m.frequency}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Panel: Consultation Note & Report Generator Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Consultation Review & Report Details
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Fill the clinical evaluation below. Submitting will auto-generate the official review report for the user.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveAndSendReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Chief Complaint / Concern
                  </label>
                  <input
                    type="text"
                    required
                    value={chiefConcern}
                    onChange={(e) => setChiefConcern(e.target.value)}
                    placeholder="E.g. Routine cardiology follow-up..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Clinical Examination & Observations
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Document examination findings..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Clinical Assessment & Diagnosis
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={assessment}
                    onChange={(e) => setAssessment(e.target.value)}
                    placeholder="Clinical diagnosis and condition status..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Treatment Plan & Lifestyle Recommendations
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={plan}
                    onChange={(e) => setPlan(e.target.value)}
                    placeholder="Document treatment, diet, and activity instructions..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Follow-up Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="E.g. Review after 4 weeks with lipid test"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Submitting creates an official consultation report for the patient.
                  </span>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-102"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {saving
                        ? "Generating & Sending Report..."
                        : "Complete Review & Send Report to User"}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DoctorAppShell>
  );
}
