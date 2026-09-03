"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Plus, ChevronRight, ShieldCheck, X, Eye, Edit3, User, Building2, Download, Share2, Mail, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { generatePdfDocument } from "@/lib/pdf";
import { Appointment, FamilyMember } from "@/types";

export default function AppointmentsListPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [viewingAppt, setViewingAppt] = useState<Appointment | null>(null);
  const [editingAppt, setEditingAppt] = useState<Appointment | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("10:00");
  const [editReason, setEditReason] = useState("");
  const [editMemberId, setEditMemberId] = useState("self");
  const [isUpdating, setIsUpdating] = useState(false);

  // Share state
  const [sharingAppt, setSharingAppt] = useState<Appointment | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [shareNotes, setShareNotes] = useState("");
  const [isSendingShare, setIsSendingShare] = useState(false);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);

  function handleExportApptPdf(appt: Appointment) {
    const dateFormatted = new Date(appt.starts_at).toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeFormatted = new Date(appt.starts_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    generatePdfDocument({
      title: "Appointment Confirmation & Care Slip",
      subtitle: `Reference Booking ID: ${appt.id.slice(0, 12)}`,
      patientName: appt.patient_name || "Arjun Mehta",
      doctorName: appt.doctor?.full_name || "Dr. Ananya Sharma",
      facilityName: appt.hospital?.name || "Bengaluru Heart & Multispecialty Hospital",
      date: dateFormatted,
      sections: [
        {
          title: "Visit & Schedule Overview",
          rows: [
            { label: "Patient Name", value: appt.patient_name || "Arjun Mehta (Self)" },
            { label: "Doctor / Clinician", value: `${appt.doctor?.full_name} (${appt.doctor?.specialty})` },
            { label: "Hospital / Center", value: appt.hospital?.name || "Bengaluru Heart & Multispecialty Hospital" },
            { label: "Facility Address", value: appt.hospital?.address || "Demo Medical Facility, Bengaluru" },
            { label: "Scheduled Appointment Date", value: dateFormatted },
            { label: "Scheduled Time Slot", value: timeFormatted },
            { label: "Status", value: appt.status },
          ],
        },
        {
          title: "Clinical Reason & Notes",
          text: appt.reason || "General consultation and health review.",
        },
        {
          title: "Patient Instructions & Preparation",
          text: "Please arrive 15 minutes before your scheduled slot. Bring your previous lab reports, medication slips, and photo ID. Time-limited consent is enabled for your shared medical records.",
        },
      ],
    });
  }

  async function handleSendShare(e: React.FormEvent) {
    e.preventDefault();
    if (!sharingAppt || !recipientEmail) return;
    setIsSendingShare(true);
    try {
      const res = await api<{ message: string }>("/api/share/document", {
        method: "POST",
        body: JSON.stringify({
          recipient_name: recipientName.trim() || "Recipient",
          recipient_email: recipientEmail.trim(),
          document_type: "appointment_summary",
          record_id: sharingAppt.id,
          title: `Appointment Confirmation - ${sharingAppt.doctor?.full_name}`,
          notes: shareNotes.trim() || undefined,
        }),
      });
      setShareSuccessMsg(res.message);
      setTimeout(() => {
        setSharingAppt(null);
        setShareSuccessMsg(null);
        setRecipientName("");
        setRecipientEmail("");
        setShareNotes("");
      }, 2000);
    } catch (err: any) {
      alert(`Could not send: ${err.message}`);
    } finally {
      setIsSendingShare(false);
    }
  }

  useEffect(() => {
    loadAppointments();
    api<FamilyMember[]>("/api/family-members").then(setFamilyMembers).catch(() => []);
  }, []);

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

  function openEditModal(appt: Appointment) {
    setEditingAppt(appt);
    const dateObj = new Date(appt.starts_at);
    const dateStr = dateObj.toISOString().split("T")[0];
    const hours = String(dateObj.getUTCHours()).padStart(2, "0");
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0");
    setEditDate(dateStr);
    setEditTime(`${hours}:${minutes}`);
    setEditReason(appt.reason || "");
    setEditMemberId(appt.family_member_id || "self");
  }

  async function handleSaveUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAppt) return;
    setIsUpdating(true);
    try {
      const slotIso = `${editDate}T${editTime}:00+00:00`;
      await api(`/api/appointments/${editingAppt.id}`, {
        method: "PUT",
        body: JSON.stringify({
          starts_at: slotIso,
          reason: editReason,
          family_member_id: editMemberId,
        }),
      });
      setEditingAppt(null);
      await loadAppointments();
    } catch (err: any) {
      alert(`Could not update appointment: ${err.message || "Failed to update"}`);
    } finally {
      setIsUpdating(false);
    }
  }

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
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-[#15232b]">{a.doctor?.full_name}</h3>
                        {a.patient_name && a.patient_name !== "Arjun Mehta" && (
                          <span className="px-2 py-0.5 rounded-full text-[0.68rem] font-bold bg-[#e4f2f1] text-[#0f6e6e] border border-[#bce2df]">
                            For: {a.patient_name} {a.relationship ? `(${a.relationship})` : ""}
                          </span>
                        )}
                      </div>
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
                  <div className="text-xs text-[#15232b] bg-[#f3efe6] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#5c6b73]">Reason for visit: </span>
                      <span>{a.reason}</span>
                    </div>
                    {a.patient_name && (
                      <span className="text-[0.7rem] text-[#5c6b73] font-semibold">
                        Patient: {a.patient_name}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#0f6e6e] font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Shared Records Protected under Consent</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Details Button */}
                    <button
                      onClick={() => setViewingAppt(a)}
                      className="btn btn-ghost text-xs bg-[#f3efe6] hover:bg-[#e4f2f1] text-[#15232b] flex items-center gap-1.5 font-bold"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0f6e6e]" />
                      <span>View</span>
                    </button>

                    {/* Export as PDF Button */}
                    <button
                      onClick={() => handleExportApptPdf(a)}
                      className="btn btn-ghost text-xs bg-white hover:bg-[#f3efe6] border border-[#d9d1c3] text-[#15232b] flex items-center gap-1.5 font-bold shadow-2xs"
                      title="Export as PDF"
                    >
                      <Download className="w-3.5 h-3.5 text-[#0f6e6e]" />
                      <span>PDF</span>
                    </button>

                    {/* Send & Share Button */}
                    <button
                      onClick={() => setSharingAppt(a)}
                      className="btn btn-ghost text-xs bg-white hover:bg-[#f3efe6] border border-[#d9d1c3] text-[#15232b] flex items-center gap-1.5 font-bold shadow-2xs"
                      title="Send and Share Appointment"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#0f6e6e]" />
                      <span>Send</span>
                    </button>

                    {/* Update Appointment Button */}
                    {activeTab === "upcoming" && (
                      <button
                        onClick={() => openEditModal(a)}
                        className="btn btn-ghost text-xs bg-[#e4f2f1] hover:bg-[#d0ecea] text-[#0f6e6e] flex items-center gap-1.5 font-bold"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[#0f6e6e]" />
                        <span>Update</span>
                      </button>
                    )}

                    <button
                      onClick={() => router.push(`/ai?prompt=${encodeURIComponent(`Prepare me for my upcoming consultation with ${a.doctor?.full_name}`)}`)}
                      className="btn btn-ghost text-xs bg-[#f3efe6] hover:bg-[#e4f2f1]"
                    >
                      AI Prep
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

      {/* VIEW APPOINTMENT DETAILS MODAL */}
      {viewingAppt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-[#d9d1c3] space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#d9d1c3]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#15232b]">Appointment Details</h3>
                  <p className="text-[0.7rem] text-[#5c6b73]">Reference ID: {viewingAppt.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingAppt(null)}
                className="p-1.5 rounded-xl text-[#5c6b73] hover:bg-[#f3efe6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-[#15232b]">
              <div className="p-4 rounded-2xl bg-[#fbf9f4] border border-[#d9d1c3] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#5c6b73] font-semibold">Patient / Recipient:</span>
                  <span className="font-bold text-[#0f6e6e] bg-white px-2.5 py-1 rounded-lg border border-[#d9d1c3]">
                    👤 {viewingAppt.patient_name || "Arjun Mehta (Self)"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#5c6b73] font-semibold">Status:</span>
                  <span className="status bg-emerald-100 text-emerald-800">{viewingAppt.status}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#fbf9f4] border border-[#d9d1c3] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#5c6b73] font-semibold">Doctor / Clinician:</span>
                  <span className="font-bold">{viewingAppt.doctor?.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c6b73] font-semibold">Specialty:</span>
                  <span className="text-[#0f6e6e] font-semibold">{viewingAppt.doctor?.specialty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c6b73] font-semibold">Hospital / Clinic:</span>
                  <span className="font-semibold">{viewingAppt.hospital?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c6b73] font-semibold">Address:</span>
                  <span className="text-[#5c6b73] text-right">{viewingAppt.hospital?.address}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#fbf9f4] border border-[#d9d1c3] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#5c6b73] font-semibold">Scheduled Date:</span>
                  <span className="font-bold">
                    🗓️ {new Date(viewingAppt.starts_at).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5c6b73] font-semibold">Scheduled Time:</span>
                  <span className="font-bold">
                    ⏰ {new Date(viewingAppt.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {viewingAppt.reason && (
                  <div className="pt-2 border-t border-[#d9d1c3]/60">
                    <span className="text-[#5c6b73] font-semibold block mb-1">Reason for Visit:</span>
                    <p className="p-2.5 rounded-xl bg-white border border-[#d9d1c3]">{viewingAppt.reason}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#d9d1c3]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportApptPdf(viewingAppt)}
                  className="btn btn-ghost text-xs bg-white hover:bg-[#f3efe6] border border-[#d9d1c3] text-[#15232b] flex items-center gap-1.5 font-bold shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#0f6e6e]" />
                  <span>Export PDF</span>
                </button>

                <button
                  onClick={() => {
                    const target = viewingAppt;
                    setViewingAppt(null);
                    setSharingAppt(target);
                  }}
                  className="btn btn-ghost text-xs bg-white hover:bg-[#f3efe6] border border-[#d9d1c3] text-[#15232b] flex items-center gap-1.5 font-bold shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#0f6e6e]" />
                  <span>Send to Email</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = viewingAppt;
                    setViewingAppt(null);
                    openEditModal(target);
                  }}
                  className="btn btn-ghost text-xs bg-[#e4f2f1] text-[#0f6e6e] flex items-center gap-1.5 font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
                <button
                  onClick={() => setViewingAppt(null)}
                  className="btn btn-primary text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE APPOINTMENT MODAL */}
      {editingAppt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-[#d9d1c3] space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#d9d1c3]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#15232b]">Update Appointment</h3>
                  <p className="text-[0.7rem] text-[#5c6b73]">
                    {editingAppt.doctor?.full_name} ({editingAppt.hospital?.name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingAppt(null)}
                className="p-1.5 rounded-xl text-[#5c6b73] hover:bg-[#f3efe6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="space-y-4">
              {/* Patient Selection */}
              <div>
                <label className="text-xs font-bold text-[#15232b] block mb-1">Who is this visit for?</label>
                <select
                  value={editMemberId}
                  onChange={(e) => setEditMemberId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d1c3] bg-white outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                >
                  <option value="self">👤 Myself (Arjun Mehta)</option>
                  {familyMembers.map((fm) => (
                    <option key={fm.id} value={fm.id}>
                      {fm.relationship === "Mother" ? "👵" : fm.relationship === "Father" ? "👴" : "👥"} {fm.full_name} ({fm.relationship})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Selection */}
              <div>
                <label className="text-xs font-bold text-[#15232b] block mb-1">Select New Date</label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#d9d1c3] bg-white outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                />
              </div>

              {/* Time Slots */}
              <div>
                <label className="text-xs font-bold text-[#15232b] block mb-1">Select Time Slot</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { time: "09:30", label: "09:30 AM" },
                    { time: "10:00", label: "10:00 AM" },
                    { time: "11:30", label: "11:30 AM" },
                    { time: "14:00", label: "02:00 PM" },
                    { time: "15:30", label: "03:30 PM" },
                    { time: "16:30", label: "04:30 PM" },
                    { time: "17:15", label: "05:15 PM" },
                    { time: "18:00", label: "06:00 PM" },
                  ].map((s) => (
                    <button
                      key={s.time}
                      type="button"
                      onClick={() => setEditTime(s.time)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        editTime === s.time
                          ? "bg-[#0f6e6e] text-white border-[#0f6e6e]"
                          : "bg-[#f3efe6] border-[#d9d1c3] text-[#15232b] hover:bg-[#e4f2f1]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason for Visit */}
              <div>
                <label className="text-xs font-bold text-[#15232b] block mb-1">Reason for Visit / Questions</label>
                <textarea
                  rows={2}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Describe your concern or reason for consultation..."
                  className="w-full p-2.5 text-xs rounded-xl border border-[#d9d1c3] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#d9d1c3]">
                <button
                  type="button"
                  onClick={() => setEditingAppt(null)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  {isUpdating ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEND & SHARE APPOINTMENT SUMMARY MODAL */}
      {sharingAppt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-[#d9d1c3] space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#d9d1c3]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#15232b]">Send Appointment Slip</h3>
                  <p className="text-[0.7rem] text-[#5c6b73]">Export PDF & Send to Family or Caregiver</p>
                </div>
              </div>
              <button
                onClick={() => setSharingAppt(null)}
                className="p-1.5 rounded-xl text-[#5c6b73] hover:bg-[#f3efe6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {shareSuccessMsg ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2 animate-in fade-in">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-emerald-900">Sent Successfully!</h4>
                <p className="text-xs text-emerald-800">{shareSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleSendShare} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-[#fbf9f4] border border-[#d9d1c3] text-xs space-y-1">
                  <div className="font-bold text-[#15232b]">
                    {sharingAppt.doctor?.full_name} ({sharingAppt.hospital?.name})
                  </div>
                  <div className="text-[#5c6b73]">
                    🗓️ {new Date(sharingAppt.starts_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} at {new Date(sharingAppt.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Mehta / Dr. Family Physician"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d1c3] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Recipient Email</label>
                  <input
                    type="email"
                    required
                    placeholder="caregiver@carenav.demo"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d1c3] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Add Note / Context (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Here is the confirmed appointment schedule and facility address."
                    value={shareNotes}
                    onChange={(e) => setShareNotes(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-[#d9d1c3] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#d9d1c3]">
                  <button
                    type="button"
                    onClick={() => setSharingAppt(null)}
                    className="btn btn-ghost text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingShare}
                    className="btn btn-primary text-xs flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isSendingShare ? "Sending PDF..." : "Export & Send"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
