"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Lock, Clock, Trash2, AlertTriangle, Eye, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { ConsentRecord } from "@/types";

export default function ConsentManagementPage() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConsents();
  }, []);

  async function loadConsents() {
    try {
      const data = await api<ConsentRecord[]>("/api/consents");
      setConsents(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(consentId: string) {
    if (!confirm("Are you sure you want to revoke this doctor's access to your shared records?")) return;
    try {
      await api(`/api/consents/${consentId}?confirmed=true`, {
        method: "DELETE",
      });
      loadConsents();
    } catch (err: any) {
      alert(`Could not revoke: ${err.message}`);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">Privacy & Consent Management</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Control which doctors can access your medical records and manage time-limited consent.
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 rounded-2xl bg-[#e4f2f1] border border-[#bce2df] text-xs text-[#0b4f4f] flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#0f6e6e] shrink-0" />
          <span>
            You have full ownership of your healthcare data. You can inspect or immediately revoke access granted to any clinician or facility at any time.
          </span>
        </div>

        {/* Active Consents List */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#5c6b73]">
            Active Provider Permissions ({consents.filter((c) => c.status === "ACTIVE").length})
          </h2>

          {consents.length === 0 ? (
            <div className="card p-10 text-center bg-white text-xs text-[#5c6b73]">
              No active consents found. When booking an appointment, you choose exactly which documents to share.
            </div>
          ) : (
            consents.map((c) => (
              <div key={c.id} className="card p-5 md:p-6 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-[#d9d1c3]/60">
                  <div>
                    <span className={`status text-[0.7rem] ${c.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
                      {c.status}
                    </span>
                    <h3 className="font-bold text-base text-[#15232b] mt-1">
                      {c.doctor?.full_name || "Dr. Ananya Sharma"}
                    </h3>
                    <p className="text-xs text-[#0f6e6e] font-semibold">{c.doctor?.specialty || "Cardiology"}</p>
                  </div>

                  <div className="text-xs text-[#5c6b73] sm:text-right">
                    <div className="font-semibold text-[#15232b]">Duration: {c.duration_label}</div>
                    <div className="text-[0.7rem]">Granted on {new Date(c.starts_at).toLocaleDateString()}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] mb-1.5">
                    Shared Item Categories
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {c.items && c.items.length > 0 ? (
                      c.items.map((it) => (
                        <span key={it.id} className="text-xs px-2.5 py-1 rounded-lg bg-[#f3efe6] text-[#15232b] font-medium">
                          📄 {it.item_type.replace("_", " ")}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-[#f3efe6] text-[#15232b] font-medium">
                        📄 Complete Blood Count Lab Report
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#d9d1c3]/60 flex justify-end">
                  {c.status === "ACTIVE" && (
                    <button
                      onClick={() => handleRevoke(c.id)}
                      className="btn btn-ghost text-xs text-[#9b2c2c] hover:bg-red-50 hover:border-red-200 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Revoke Access Immediately</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
