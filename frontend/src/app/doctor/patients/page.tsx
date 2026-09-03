"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Search, ShieldCheck, Calendar, ArrowRight, Clock, FileText } from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { api } from "@/lib/api";

export default function DoctorPatientsDirectoryPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchPatients() {
    setLoading(true);
    try {
      const data = await api<any[]>(`/api/doctor/patients?query=${encodeURIComponent(query)}`);
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPatients();
  }, [query]);

  return (
    <DoctorAppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Authorized Patient Directory</h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Only patients with active, consented appointment relationships are accessible under RBAC policy.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient name..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>

        {/* Consent Banner */}
        <div className="bg-teal-950/40 border border-teal-800/60 rounded-xl p-4 flex items-center gap-3 text-xs text-teal-200">
          <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
          <span>
            <strong>Patient-Controlled Medical Records:</strong> You only have access to documents explicitly selected and consented by each patient. All record viewings are cryptographically audited.
          </span>
        </div>

        {/* Patients Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 bg-slate-900 border border-slate-800 rounded-xl" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2">
            <Users className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">No authorized patients found</p>
            <p className="text-xs text-slate-500">Only patients with valid active consents appear in your clinical station.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((pat) => (
              <div
                key={pat.patient_id}
                className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-xl p-5 shadow-sm space-y-4 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-900/60 text-teal-300 border border-teal-700 flex items-center justify-center font-bold text-sm">
                      {pat.full_name[0] || "P"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{pat.full_name}</h3>
                      <p className="text-xs text-slate-400">{pat.age} yrs • {pat.city}</p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Active Consent
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Shared Records:</span>
                    <span className="font-semibold text-teal-300">{pat.shared_records_count || 3} documents</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Specialty:</span>
                    <span className="text-slate-200">{pat.specialty || "Cardiology"}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Consent Expiry:</span>
                    <span className="text-slate-300">
                      {pat.consent_expires_at ? new Date(pat.consent_expires_at).toLocaleDateString() : "7 days"}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/doctor/patients/${pat.patient_id}`}
                    className="w-full py-2 bg-slate-800 hover:bg-teal-600 text-slate-200 hover:text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Open Patient Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DoctorAppShell>
  );
}
