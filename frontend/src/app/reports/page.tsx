"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, UploadCloud, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, ChevronRight, BarChart2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { MedicalReport } from "@/types";

export default function ReportsListPage() {
  const router = useRouter();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const data = await api<MedicalReport[]>("/api/reports");
      setReports(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress("Uploading document to secure storage...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload file
      const uploadRes = await api<{ id: string; status: string }>("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress("Analyzing document with Multimodal AI Vision...");

      // Trigger analysis pipeline
      const analyzeRes = await api<{ report_id: string; status: string }>(`/api/reports/${uploadRes.id}/analyze`, {
        method: "POST",
      });

      setUploadProgress("Structured report ready!");
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(null);
        router.push(`/reports/${analyzeRes.report_id}`);
      }, 1000);
    } catch (err: any) {
      alert(`Upload error: ${err.message || "Failed to process document"}`);
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">Medical Reports</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Upload blood reports, pathology summaries, and diagnostic tests for AI explanation.
            </p>
          </div>
          <button
            onClick={() => router.push("/reports/compare")}
            className="btn btn-ghost text-xs flex items-center gap-1.5 self-start sm:self-auto bg-white"
          >
            <BarChart2 className="w-4 h-4 text-[#0f6e6e]" />
            <span>Compare Previous Reports</span>
          </button>
        </div>

        {/* Upload Dropzone Card */}
        <div className="card p-6 md:p-8 bg-white border-dashed border-2 border-[#0f6e6e]/40 hover:border-[#0f6e6e] text-center space-y-4 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center mx-auto shadow-xs">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-bold text-base text-[#15232b]">Upload a Medical Document or Report</h3>
            <p className="text-xs text-[#5c6b73] mt-1">
              Supports PDF, JPG, JPEG, and PNG files up to 10MB.
            </p>
          </div>

          {uploading ? (
            <div className="py-4 space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-[#0f6e6e] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs font-semibold text-[#0f6e6e]">{uploadProgress}</p>
            </div>
          ) : (
            <label className="btn btn-primary text-xs cursor-pointer inline-flex items-center gap-2">
              <span>Select File to Analyze</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}

          <div className="flex items-center justify-center gap-2 text-[0.7rem] text-[#5c6b73]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0f6e6e]" />
            <span>Encrypted with private storage & patient-only access controls</span>
          </div>
        </div>

        {/* Reports Feed */}
        <div className="space-y-3">
          <div className="font-bold text-sm text-[#15232b]">Analyzed Reports ({reports.length})</div>

          {reports.map((r) => (
            <div
              key={r.id}
              onClick={() => router.push(`/reports/${r.id}`)}
              className="card p-4 md:p-5 bg-white hover:border-[#0f6e6e] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center font-bold text-sm shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#15232b]">{r.test_name}</h3>
                  <p className="text-xs text-[#5c6b73] mt-0.5">
                    {r.report_date} · {r.hospital_or_lab}
                  </p>
                  {r.doctor_name && (
                    <p className="text-[0.7rem] text-[#0f6e6e] font-semibold mt-0.5">
                      Doctor: {r.doctor_name}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 justify-between sm:justify-end">
                <span className="status bg-emerald-50 text-emerald-800 text-[0.7rem]">
                  AI Analyzed
                </span>
                <span className="text-xs font-semibold text-[#0f6e6e] flex items-center gap-1">
                  <span>View Details & Explanation</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
