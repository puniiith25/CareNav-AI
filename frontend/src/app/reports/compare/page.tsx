"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart2, ArrowUpRight, ArrowDownRight, Minus, AlertCircle, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { MedicalReport } from "@/types";

export default function ReportComparisonPage() {
  const router = useRouter();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [reportA, setReportA] = useState<string>("66666666-6666-6666-6666-666666666601"); // Aug 10
  const [reportB, setReportB] = useState<string>("66666666-6666-6666-6666-666666666602"); // Sep 1
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const rList = await api<MedicalReport[]>("/api/reports");
        setReports(rList || []);
        if (rList?.length >= 2) {
          setReportA(rList[1].id);
          setReportB(rList[0].id);
          const cmp = await api<any>("/api/reports/compare", {
            method: "POST",
            body: JSON.stringify({ report_a: rList[1].id, report_b: rList[0].id }),
          });
          setComparison(cmp);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleCompare() {
    if (!reportA || !reportB) return;
    try {
      const cmp = await api<any>("/api/reports/compare", {
        method: "POST",
        body: JSON.stringify({ report_a: reportA, report_b: reportB }),
      });
      setComparison(cmp);
    } catch (err: any) {
      alert(`Comparison error: ${err.message}`);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">Compare Medical Reports</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Side-by-side progression analysis across compatible lab tests.
            </p>
          </div>
          <button
            onClick={() => router.push("/reports")}
            className="text-xs font-semibold text-[#0f6e6e] hover:underline"
          >
            ← View All Reports
          </button>
        </div>

        {/* Report Selector Controls */}
        <div className="card p-5 bg-white grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] block mb-1.5">
              Previous Report
            </label>
            <select
              value={reportA}
              onChange={(e) => setReportA(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-xs font-semibold text-[#15232b] outline-none"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.test_name} ({r.report_date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] block mb-1.5">
              Current / Later Report
            </label>
            <select
              value={reportB}
              onChange={(e) => setReportB(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-xs font-semibold text-[#15232b] outline-none"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.test_name} ({r.report_date})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Results Card */}
        {comparison && (
          <div className="card p-6 md:p-8 bg-white space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#d9d1c3]/60">
              <div className="flex items-center gap-2 text-sm font-bold text-[#15232b]">
                <BarChart2 className="w-5 h-5 text-[#0f6e6e]" />
                <span>Test Progression & Trends</span>
              </div>
              <span className="text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full bg-[#e4f2f1] text-[#0b4f4f]">
                Documented Values Only
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#f3efe6] text-[#5c6b73] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">Test Name</th>
                    <th className="p-3">Previous ({comparison.report_a?.report_date || "Aug 10"})</th>
                    <th className="p-3">Current ({comparison.report_b?.report_date || "Sep 1"})</th>
                    <th className="p-3">Difference</th>
                    <th className="p-3 rounded-r-xl">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d9d1c3]/50 font-medium">
                  {comparison.rows?.map((row: any, i: number) => {
                    const isUp = row.change !== null && row.change > 0;
                    const isDown = row.change !== null && row.change < 0;
                    const isSame = row.change !== null && row.change === 0;

                    return (
                      <tr key={i} className="hover:bg-[#fbf9f4]">
                        <td className="p-3 font-bold text-[#15232b]">{row.test}</td>
                        <td className="p-3 text-[#5c6b73]">
                          {row.previous} {row.unit}
                        </td>
                        <td className="p-3 font-bold text-[#15232b]">
                          {row.current} {row.unit}
                        </td>
                        <td className="p-3 font-mono text-xs">
                          {row.change !== null ? (row.change > 0 ? `+${row.change.toFixed(2)}` : row.change.toFixed(2)) : "—"}
                        </td>
                        <td className="p-3">
                          {isUp && (
                            <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                              <ArrowUpRight className="w-3.5 h-3.5" /> ↑
                            </span>
                          )}
                          {isDown && (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                              <ArrowDownRight className="w-3.5 h-3.5" /> ↓
                            </span>
                          )}
                          {isSame && (
                            <span className="inline-flex items-center gap-1 font-bold text-[#5c6b73] bg-[#f3efe6] px-2 py-0.5 rounded-full">
                              <Minus className="w-3.5 h-3.5" /> →
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-xs text-[#5c6b73] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#0f6e6e] shrink-0" />
              <span>
                {comparison.disclaimer ||
                  "Comparison of documented values only. Never treat documented changes as a medical diagnosis."}
              </span>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
