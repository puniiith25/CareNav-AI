"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Plus, ChevronRight, ShieldCheck, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Appointment } from "@/types";

export default function AppointmentsListPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const data = await api<Appointment[]>("/api/appointments");
        setAppointments(data || []);
      } catch (err) {
        console.error("Error loading appointments:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, []);

  const upcomingAppts = appointments.filter((a) => ["REQUESTED", "CONFIRMED", "UPCOMING"].includes(a.status));
  const pastAppts = appointments.filter((a) => a.status === "COMPLETED");
  const cancelledAppts = appointments.filter((a) => a.status === "CANCELLED");

  const currentList =
    activeTab === "upcoming" ? upcomingAppts : activeTab === "past" ? pastAppts : cancelledAppts;

  async function handleCancel(apptId: string) {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;
    try {
      await api(`/api/appointments/${apptId}`, {
        method: "PATCH",
        body: JSON.stringify({ confirmed: true }),
      });
      // Refresh list
      const data = await api<Appointment[]>("/api/appointments");
      setAppointments(data || []);
    } catch (err: any) {
      alert(`Could not cancel: ${err.message}`);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">My Appointments</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Manage doctor consultations, shared health documents, and clinic visits.
            </p>
          </div>
          <button
            onClick={() => router.push("/appointments/book")}
            className="btn btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Appointment</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#d9d1c3]">
          {[
            { key: "upcoming", label: `Upcoming (${upcomingAppts.length})` },
            { key: "past", label: `Past Visits (${pastAppts.length})` },
            { key: "cancelled", label: `Cancelled (${cancelledAppts.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`pb-3 px-3 text-xs md:text-sm font-bold border-b-2 transition-all ${
                activeTab === t.key
                  ? "border-[#0f6e6e] text-[#0f6e6e]"
                  : "border-transparent text-[#5c6b73] hover:text-[#15232b]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Appointment Cards List */}
        <div className="space-y-4">
          {currentList.length === 0 ? (
            <div className="card p-12 text-center space-y-3 bg-white">
              <Calendar className="w-10 h-10 text-[#5c6b73] mx-auto opacity-50" />
              <div className="font-bold text-sm text-[#15232b]">No {activeTab} appointments found.</div>
              <p className="text-xs text-[#5c6b73]">
                Use the Healthcare Map or Doctor Directory to schedule a visit.
              </p>
              <button
                onClick={() => router.push("/appointments/book")}
                className="btn btn-primary text-xs mx-auto"
              >
                Find a Doctor
              </button>
            </div>
          ) : (
            currentList.map((a) => (
              <div key={a.id} className="card p-5 md:p-6 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#d9d1c3]/60">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#0f6e6e]/10 text-[#0f6e6e] flex items-center justify-center font-bold text-base border border-[#0f6e6e]/20 shrink-0">
                      {a.doctor?.full_name?.replace("Dr. ", "").split(" ").map((n) => n[0]).join("") || "DR"}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#15232b]">{a.doctor?.full_name}</h3>
                      <div className="text-xs font-semibold text-[#0f6e6e]">{a.doctor?.specialty}</div>
                      <div className="text-xs text-[#5c6b73] flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#5c6b73] shrink-0" />
                        <span>{a.hospital?.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1">
                    <span className="status bg-[#e4f2f1] text-[#0b4f4f] text-[0.7rem] self-start sm:self-auto">
                      {a.status}
                    </span>
                    <span className="text-xs font-bold text-[#15232b]">
                      🗓️ {new Date(a.starts_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className="text-xs text-[#5c6b73]">
                      ⏰ {new Date(a.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {a.reason && (
                  <div className="text-xs text-[#15232b] bg-[#f3efe6] p-3 rounded-xl">
                    <span className="font-bold text-[#5c6b73]">Reason for visit: </span>
                    <span>{a.reason}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#0f6e6e] font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Shared Records Protected under Consent</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/ai?prompt=${encodeURIComponent(`Prepare me for my upcoming consultation with ${a.doctor?.full_name}`)}`)}
                      className="btn btn-ghost text-xs bg-[#f3efe6] hover:bg-[#e4f2f1]"
                    >
                      AI Visit Preparation
                    </button>
                    {activeTab === "upcoming" && (
                      <button
                        onClick={() => handleCancel(a.id)}
                        className="btn btn-ghost text-xs text-[#9b2c2c] hover:bg-red-50 hover:border-red-200"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
