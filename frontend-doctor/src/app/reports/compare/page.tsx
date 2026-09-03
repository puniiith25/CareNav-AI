"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Columns, ShieldCheck, AlertCircle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { api } from "@/lib/api";

export default function DoctorReportComparePage() {
  const [selectedA, setSelectedA] = useState("44444444-4444-4444-4444-4444444444c1"); // Aug CBC
  const [selectedB, setSelectedB] = useState("44444444-4444-4444-4444-4444444444c2"); // Sep CBC
  const [result, setResult] = useState<any>({
    report_a: { date: "2026-08-10", name: "Complete Blood Count (CBC)" },
    report_b: { date: "2026-09-01", name: "Complete Blood Count (CBC)" },
    comparison: [
      { test: "Hemoglobin", previous: "13.1", current: "13.8", unit: "g/dL", change: "+0.7", trend: "up" },
      { test: "WBC (White Blood Cells)", previous: "7.2", current: "7.0", unit: "x10^9/L", change: "-0.2", trend: "down" },
      { test: "Platelets", previous: "215", current: "228", unit: "x10^9/L", change: "+13.0", trend: "up" },
    ],
  });

  return (
    <DoctorAppShell>
      <div className="space-y-6">
        <Link href="/doctor/patients" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Patient
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Columns className="w-6 h-6 text-teal-400" />
            <span>Laboratory Report Comparison</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Compare documented lab tests side-by-side. Never compare incompatible units or infer diagnoses autonomously.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-bold text-white">
              Patient: <span className="text-teal-400">Arjun Mehta</span> • Test: Complete Blood Count
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-4">
              <span>Previous: <strong className="text-slate-200">10 Aug 2026</strong></span>
              <span>Current: <strong className="text-teal-300">01 Sep 2026</strong></span>
            </div>
          </div>

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Test Name</th>
                <th className="py-3 px-4">Previous (Aug 10)</th>
                <th className="py-3 px-4">Current (Sep 01)</th>
                <th className="py-3 px-4">Delta / Change</th>
                <th className="py-3 px-4">Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {result.comparison.map((row: any) => (
                <tr key={row.test} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">{row.test}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{row.previous}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-teal-300">{row.current}</td>
                  <td className="py-3.5 px-4 font-mono">
                    <span
                      className={`inline-flex items-center gap-1 font-bold ${
                        row.trend === "up" ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {row.trend === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      {row.change}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">{row.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Safety Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
          <span>
            Comparison of documented laboratory values only. CareNav AI does not autonomously diagnose based on delta changes.
          </span>
        </div>
      </div>
    </DoctorAppShell>
  );
}
