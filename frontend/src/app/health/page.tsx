"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  FileText,
  Pill,
  Clock,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Bookmark,
  ChevronRight,
  Plus,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";

export default function HealthRecordsAndMemoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"records" | "journal" | "official">("records");
  const [records, setRecords] = useState<any[]>([]);
  const [memoryData, setMemoryData] = useState<{
    level1_chat_history: any[];
    level2_health_journal: any[];
    level3_official_records: any[];
  }>({
    level1_chat_history: [],
    level2_health_journal: [],
    level3_official_records: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [rRes, mRes] = await Promise.all([
          api<any[]>("/api/health-records"),
          api<any>("/api/health-memory"),
        ]);
        setRecords(rRes || []);
        setMemoryData(mRes || { level1_chat_history: [], level2_health_journal: [], level3_official_records: [] });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">Health Records & Memory</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Personal health journal, official verified records, and AI-saved health summaries.
            </p>
          </div>
          <button
            onClick={() => router.push("/ai?prompt=" + encodeURIComponent("Summarize my recent healthcare activity and records"))}
            className="btn btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask My Health Records</span>
          </button>
        </div>

        {/* 3-Level Health Memory Architectural Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => setActiveTab("records")}
            className={`card p-5 cursor-pointer transition-all ${
              activeTab === "records" ? "border-[#0f6e6e] bg-[#e4f2f1]/30 shadow-xs" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">Level 1</span>
              <FileText className="w-4 h-4 text-[#0f6e6e]" />
            </div>
            <h3 className="font-bold text-sm text-[#15232b]">My Health Records</h3>
            <p className="text-xs text-[#5c6b73] mt-1">Uploaded reports, prescriptions & doctor visits.</p>
          </div>

          <div
            onClick={() => setActiveTab("journal")}
            className={`card p-5 cursor-pointer transition-all ${
              activeTab === "journal" ? "border-[#0f6e6e] bg-[#e4f2f1]/30 shadow-xs" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Level 2</span>
              <BookOpen className="w-4 h-4 text-purple-700" />
            </div>
            <h3 className="font-bold text-sm text-[#15232b]">AI Health Journal</h3>
            <p className="text-xs text-[#5c6b73] mt-1">Patient-approved AI explanations & health memory notes.</p>
          </div>

          <div
            onClick={() => setActiveTab("official")}
            className={`card p-5 cursor-pointer transition-all ${
              activeTab === "official" ? "border-[#0f6e6e] bg-[#e4f2f1]/30 shadow-xs" : "bg-white"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Level 3</span>
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
            </div>
            <h3 className="font-bold text-sm text-[#15232b]">Verified Official Records</h3>
            <p className="text-xs text-[#5c6b73] mt-1">Hospital-validated documents and official prescriptions.</p>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === "records" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#15232b]">All Health Records</h3>
              <span className="text-xs text-[#5c6b73]">{records.length} items</span>
            </div>

            {records.map((r) => (
              <div key={r.id} className="card p-4 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center font-bold text-xs">
                    📄
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#15232b]">{r.title}</h4>
                    <span className="text-xs text-[#5c6b73] capitalize">{r.record_type?.replace("_", " ")}</span>
                  </div>
                </div>
                <span className="status bg-emerald-50 text-emerald-800 text-[0.7rem]">Verified</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "journal" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#15232b]">Saved to AI Health Journal</h3>
              <span className="text-xs text-[#5c6b73]">{memoryData.level2_health_journal.length} entries</span>
            </div>

            {memoryData.level2_health_journal.length === 0 ? (
              <div className="card p-10 text-center bg-white text-xs text-[#5c6b73]">
                No notes saved to your Health Journal yet. You can save any AI conversation or report summary from the AI Assistant.
              </div>
            ) : (
              memoryData.level2_health_journal.map((j) => (
                <div key={j.id} className="card p-5 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#15232b]">{j.title}</h4>
                    <span className="text-[0.7rem] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                      Health Journal
                    </span>
                  </div>
                  <p className="text-xs text-[#15232b] leading-relaxed">{j.summary}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "official" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#15232b]">Official Health Records</h3>
              <span className="text-xs text-[#5c6b73]">Verified Hospital Documentation</span>
            </div>

            <div className="card p-5 bg-white space-y-3">
              <div className="flex items-start justify-between pb-3 border-b border-[#d9d1c3]/60">
                <div>
                  <h4 className="font-bold text-sm text-[#15232b]">Cardiology Consultation & Prescription</h4>
                  <p className="text-xs text-[#5c6b73]">Dr. Ananya Sharma · Bengaluru Heart & Multispecialty Hospital</p>
                </div>
                <span className="status bg-emerald-50 text-emerald-800 text-[0.7rem]">Official</span>
              </div>
              <div className="text-xs text-[#15232b]">
                Includes verified prescription of Atorvastatin 10mg and Complete Blood Count lab order.
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
