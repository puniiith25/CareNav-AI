"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Calendar, FileText, Pill, Stethoscope, ChevronRight, Activity } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { TimelineEvent } from "@/types";

export default function HealthTimelinePage() {
  const router = useRouter();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      try {
        const data = await api<TimelineEvent[]>("/api/timeline");
        setEvents(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTimeline();
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "report":
        return <FileText className="w-4 h-4 text-[#0f6e6e]" />;
      case "prescription":
        return <Pill className="w-4 h-4 text-purple-700" />;
      case "consultation":
        return <Stethoscope className="w-4 h-4 text-blue-700" />;
      case "appointment_booked":
        return <Calendar className="w-4 h-4 text-emerald-700" />;
      default:
        return <Activity className="w-4 h-4 text-[#0f6e6e]" />;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">Health Timeline</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Chronological healthcare journey from initial blood reports to doctor visits and recovery.
            </p>
          </div>
          <button
            onClick={() => router.push("/ai?prompt=" + encodeURIComponent("Summarize my entire healthcare timeline in 3 bullet points"))}
            className="btn btn-ghost text-xs bg-white flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>AI Timeline Summary</span>
          </button>
        </div>

        {/* Timeline Feed */}
        <div className="card p-6 md:p-8 bg-white">
          <div className="relative border-l-2 border-[#d9d1c3] ml-4 md:ml-6 pl-6 md:pl-8 space-y-8">
            {events.map((e) => {
              const dateLabel = new Date(e.occurred_at).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div key={e.id} className="relative group">
                  {/* Timeline node icon */}
                  <div className="absolute -left-[35px] md:-left-[43px] top-0 w-8 h-8 rounded-full bg-[#fffcf7] border-2 border-[#0f6e6e] flex items-center justify-center shadow-xs">
                    {getIcon(e.event_type)}
                  </div>

                  <div className="p-4 rounded-xl bg-[#f3efe6]/70 hover:bg-[#f3efe6] transition-colors border border-[#d9d1c3]/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0f6e6e]">{dateLabel}</span>
                      <span className="text-[0.68rem] uppercase font-bold text-[#5c6b73] px-2 py-0.5 rounded bg-white">
                        {e.event_type.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#15232b] mt-1">{e.title}</h3>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
