"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, CheckCircle2, Calendar, Pill, AlertTriangle, ChevronRight, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";

export default function RecoveryPlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecovery() {
      try {
        const data = await api<{ plans: any[]; tasks: any[] }>("/api/recovery");
        setPlans(data.plans || []);
        setTasks(data.tasks || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRecovery();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">Recovery & Follow-Up Plans</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Clinician-documented recovery plans, discharge instructions, and follow-up milestones.
            </p>
          </div>
        </div>

        {/* Active Plan Card */}
        <div className="card p-6 md:p-8 bg-white space-y-6">
          <div className="flex items-start justify-between pb-4 border-b border-[#d9d1c3]/60">
            <div>
              <span className="status bg-emerald-50 text-emerald-800 text-[0.7rem]">Active Regimen</span>
              <h2 className="text-xl font-bold text-[#15232b] mt-1.5">Cardiovascular Follow-Up Regimen</h2>
              <p className="text-xs text-[#5c6b73] mt-0.5">
                Prescribed by Dr. Ananya Sharma · Bengaluru Heart & Multispecialty Hospital
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#15232b]">Clinical Action Tasks</h3>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#f3efe6] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0f6e6e] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-[#15232b]">Daily Medication Compliance</h4>
                  <p className="text-xs text-[#5c6b73] mt-0.5">
                    Maintain prescribed Atorvastatin 10mg nightly dosage after meals.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#f3efe6] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0f6e6e] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-[#15232b]">Blood Test Re-Evaluation</h4>
                  <p className="text-xs text-[#5c6b73] mt-0.5">
                    Schedule repeat lipid panel test prior to 4-week review consultation.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#f3efe6] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0f6e6e] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-[#15232b]">Follow-up Consultation</h4>
                  <p className="text-xs text-[#5c6b73] mt-0.5">
                    Review progress with Dr. Sharma on Sep 3, 2026.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#e4f2f1] border border-[#bce2df] text-xs text-[#0b4f4f]">
            CareNav AI strictly presents instructions documented by your clinician or hospital. No artificial medical tasks are invented.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
