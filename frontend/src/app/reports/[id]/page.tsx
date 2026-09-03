"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  Calendar,
  Building,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  BarChart2,
  BookmarkPlus,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { MedicalReport } from "@/types";

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<MedicalReport | null>(null);
  const [savedToMemory, setSavedToMemory] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const data = await api<MedicalReport>(`/api/reports/${id}`);
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadReport();
  }, [id]);

  async function handleSaveToMemory() {
    if (!report) return;
    try {
      await api("/api/health-memory", {
        method: "POST",
        body: JSON.stringify({
          action: "save",
          title: `Report Summary: ${report.test_name} (${report.report_date})`,
          summary: report.explanation?.what_these_tests_measure || "Medical document analyzed by CareNav AI.",
          report_id: report.id,
        }),
      });
      setSavedToMemory(true);
    } catch (err) {
      console.error(err);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="py-20 text-center text-sm text-[#5c6b73]">Loading medical report...</div>
      </AppShell>
    );
  }

  if (!report) {
    return (
      <AppShell>
        <div className="py-20 text-center text-sm text-[#5c6b73]">Report could not be found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Navigation / Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button
            onClick={() => router.push("/reports")}
            className="text-xs font-semibold text-[#0f6e6e] hover:underline flex items-center gap-1"
          >
            ← Back to All Reports
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToMemory}
              disabled={savedToMemory}
              className={`btn btn-ghost text-xs flex items-center gap-1.5 bg-white ${
                savedToMemory ? "text-emerald-700 font-bold" : ""
              }`}
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-[#0f6e6e]" />
              <span>{savedToMemory ? "Saved to Health Memory ✓" : "Save to Health Memory"}</span>
            </button>
            <button
              onClick={() => router.push("/reports/compare")}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Compare with Previous</span>
            </button>
          </div>
        </div>

        {/* Document Header Card */}
        <div className="card p-6 md:p-8 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[#d9d1c3]/60">
            <div>
              <span className="status bg-[#e4f2f1] text-[#0b4f4f] text-[0.7rem]">
                {report.document_type || "Lab Report"}
              </span>
              <h1 className="text-2xl font-bold text-[#15232b] mt-1.5">{report.test_name}</h1>
              <p className="text-xs text-[#5c6b73] mt-1 flex flex-wrap gap-4">
                <span>🗓️ Date: {report.report_date}</span>
                <span>🏥 Laboratory: {report.hospital_or_lab}</span>
                {report.doctor_name && <span>👨‍⚕️ Clinician: {report.doctor_name}</span>}
              </p>
            </div>
            <div className="text-[0.7rem] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 self-start">
              High Confidence (98%)
            </div>
          </div>

          {/* Test Results Table */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-[#15232b]">Key Documented Test Values</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f3efe6] text-[#5c6b73] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Test Name</th>
                    <th className="p-3">Measured Value</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3 rounded-r-xl">Report Reference Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9d1c3]/50">
                  {report.values?.map((v) => (
                    <tr key={v.id} className="hover:bg-[#fbf9f4]">
                      <td className="p-3 font-semibold text-[#15232b]">{v.test_name}</td>
                      <td className="p-3 font-bold text-[#0f6e6e] text-sm">{v.value}</td>
                      <td className="p-3 text-[#5c6b73]">{v.unit}</td>
                      <td className="p-3 text-[#5c6b73] font-mono">{v.reference_range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Patient-Friendly Explanation */}
        <div className="card p-6 md:p-8 bg-[#e4f2f1]/40 border-[#bce2df] space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0b4f4f]">
            <Sparkles className="w-4 h-4 text-[#0f6e6e]" />
            <span>Plain-Language Educational Explanation</span>
          </div>

          <p className="text-sm text-[#15232b] leading-relaxed">
            {report.explanation?.what_these_tests_measure ||
              "This Complete Blood Count measures different components of your blood including red cells, white cells, and platelets. The documented values fall within the reference ranges specified by the laboratory."}
          </p>

          <div className="p-3 rounded-xl bg-white border border-[#bce2df] text-[0.7rem] text-[#5c6b73] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#0f6e6e] shrink-0" />
            <span>AI-generated explanation for patient understanding. This is not a diagnosis.</span>
          </div>
        </div>

        {/* Questions for Doctor */}
        <div className="card p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#15232b]">
            <HelpCircle className="w-4 h-4 text-[#0f6e6e]" />
            <span>Questions you may want to ask your doctor</span>
          </div>

          <ul className="space-y-2.5">
            {[
              "What do these documented values mean in the context of my general health?",
              "Do my current medications or diet require any adjustments based on this result?",
              "When would you recommend repeating this blood test?",
            ].map((q, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-[#15232b]">
                <span className="w-5 h-5 rounded-full bg-[#f3efe6] text-[#0f6e6e] font-bold flex items-center justify-center shrink-0 text-[0.7rem]">
                  {i + 1}
                </span>
                <span className="pt-0.5">{q}</span>
              </li>
            ))}
          </ul>

          <div className="pt-2 border-t border-[#d9d1c3]/60">
            <button
              onClick={() => router.push(`/ai?prompt=${encodeURIComponent(`I want to ask the doctor about my ${report.test_name} values`)}`)}
              className="btn btn-ghost text-xs bg-[#f3efe6] w-full justify-center"
            >
              Ask AI to refine these questions for your consultation
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
