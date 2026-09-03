"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Clock, FileText, User, ArrowLeft } from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { api } from "@/lib/api";

export default function DoctorAuditActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudit() {
      try {
        const data = await api<any[]>("/api/doctor/audit");
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAudit();
  }, []);

  return (
    <DoctorAppShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-teal-400" />
            <span>Clinical Audit & Access Activity</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            HIPAA/consent compliance logging. Every accessed record, consultation note, and prescription is logged.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-900 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(log.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "medium" })}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-mono text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 capitalize">{log.resource_type || "Clinical"}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{log.actor_role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DoctorAppShell>
  );
}
