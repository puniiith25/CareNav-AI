"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Columns,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { api } from "@/lib/api";

export default function DoctorReportViewerPage({ params }: { params: Promise<{ reportId: string }> }) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.reportId;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await api<any>(`/api/doctor/reports/${reportId}`);
        setData(res);
      } catch (err: any) {
        setError(err.message || "Failed to load report.");
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <DoctorAppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="h-64 bg-slate-900 rounded-xl" />
        </div>
      </DoctorAppShell>
    );
  }

  if (error || !data) {
    return (
      <DoctorAppShell>
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-4">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <p className="text-sm font-semibold text-white">{error || "Report not found or consent has expired."}</p>
          <Link href="/doctor/patients" className="inline-block px-4 py-2 bg-slate-800 rounded text-xs text-white">
            Back to Patients
          </Link>
        </div>
      </DoctorAppShell>
    );
  }

  const report = data.report;
  const values = data.values || [];

  return (
    <DoctorAppShell>
      <div className="space-y-6">
        <Link href="/doctor/patients" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient Profile
        </Link>

        {/* Report Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">{report.test_name}</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                Extracted & Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Patient: <span className="text-white font-semibold">Arjun Mehta</span> • Date: <span className="font-mono text-slate-300">{report.report_date}</span> • Lab: {report.hospital_or_lab}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/doctor/reports/compare"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
            >
              <Columns className="w-3.5 h-3.5 text-teal-400" />
              <span>Compare with Previous</span>
            </Link>
          </div>
        </div>

        {/* Structured Results Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Structured Test Results</h3>
            <span className="text-[11px] text-teal-400 font-medium">Original laboratory extraction</span>
          </div>

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4">Result</th>
                <th className="py-3 px-4">Unit</th>
                <th className="py-3 px-4">Reference Range</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {values.map((v: any) => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{v.test_name}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-300">{v.value}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{v.unit || "-"}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{v.reference_range || "-"}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {Math.round((v.confidence || 0.95) * 100)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
          <span>
            {data.disclaimer || "DEMO / SYNTHETIC DATA — Values are extracted strictly from authorized records. Never modify extracted clinical values without a documented verification audit."}
          </span>
        </div>
      </div>
    </DoctorAppShell>
  );
}
