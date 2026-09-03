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
  Folder,
  FolderHeart,
  Users,
  Calendar,
  Trash2,
  Eye,
  X,
  Download,
  Share2,
  Mail,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { generatePdfDocument } from "@/lib/pdf";
import { FamilyMember } from "@/types";

export default function HealthRecordsAndMemoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"records" | "journal" | "official">("records");
  const [activeMemberFolder, setActiveMemberFolder] = useState<string>("all"); // "all", "self", or family_member_id
  const [records, setRecords] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
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
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  // Share state
  const [sharingRecord, setSharingRecord] = useState<any | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [shareNotes, setShareNotes] = useState("");
  const [isSendingShare, setIsSendingShare] = useState(false);
  const [shareSuccessMsg, setShareSuccessMsg] = useState<string | null>(null);

  function handleExportRecordPdf(r: any) {
    const details = r.details || {};
    const tableHeaders = ["Test Parameter", "Result", "Reference Range"];
    const tableRows = details.values
      ? details.values.map((v: any) => [v.test_name, `${v.value} ${v.unit || ""}`, v.reference_range || "Normal"])
      : [];

    const sections: any[] = [];

    if (tableRows.length > 0) {
      sections.push({
        title: "Clinical Laboratory Parameters",
        table: { headers: tableHeaders, rows: tableRows },
      });
    }

    if (details.medications && details.medications.length > 0) {
      sections.push({
        title: "Prescribed Medications",
        rows: details.medications.map((m: any) => ({
          label: m.name,
          value: `${m.dose} · ${m.frequency} (${m.duration}) — ${m.instructions}`,
        })),
      });
    }

    if (details.notes) {
      sections.push({
        title: "Clinical Notes & Observations",
        text: details.notes,
      });
    }

    sections.push({
      title: "Authentication & Validation",
      rows: [
        { label: "Document ID", value: r.id },
        { label: "Verification Level", value: "Level 3 - Officially Verified Record" },
        { label: "Storage Vault", value: "CareNav Encrypted Patient Health Store" },
      ],
    });

    generatePdfDocument({
      title: r.title,
      subtitle: `${r.record_type?.replace("_", " ")?.toUpperCase()} — Officially Documented`,
      patientName: currentMember ? currentMember.full_name : "Arjun Mehta",
      doctorName: details.doctor_name || "Dr. Ananya Sharma",
      facilityName: details.hospital_or_lab || details.hospital_name || "Bengaluru Heart & Multispecialty Hospital",
      date: details.report_date || details.issued_at || new Date().toLocaleDateString(),
      sections,
    });
  }

  async function handleSendShareRecord(e: React.FormEvent) {
    e.preventDefault();
    if (!sharingRecord || !recipientEmail) return;
    setIsSendingShare(true);
    try {
      const res = await api<{ message: string }>("/api/share/document", {
        method: "POST",
        body: JSON.stringify({
          recipient_name: recipientName.trim() || "Recipient",
          recipient_email: recipientEmail.trim(),
          document_type: "medical_report",
          record_id: sharingRecord.id,
          title: sharingRecord.title,
          notes: shareNotes.trim() || undefined,
        }),
      });
      setShareSuccessMsg(res.message);
      setTimeout(() => {
        setSharingRecord(null);
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

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRel, setNewMemberRel] = useState("Mother");
  const [newMemberAge, setNewMemberAge] = useState<string>("");
  const [newMemberGender, setNewMemberGender] = useState("Female");
  const [newMemberBlood, setNewMemberBlood] = useState("B+");
  const [newMemberNotes, setNewMemberNotes] = useState("");
  const [isSavingMember, setIsSavingMember] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [rRes, mRes, fRes] = await Promise.all([
          api<any[]>("/api/health-records"),
          api<any>("/api/health-memory"),
          api<FamilyMember[]>("/api/family-members").catch(() => []),
        ]);
        setRecords(rRes || []);
        setMemoryData(mRes || { level1_chat_history: [], level2_health_journal: [], level3_official_records: [] });
        setFamilyMembers(fRes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleAddFamilyMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setIsSavingMember(true);
    try {
      const added = await api<FamilyMember>("/api/family-members", {
        method: "POST",
        body: JSON.stringify({
          full_name: newMemberName.trim(),
          relationship: newMemberRel,
          age: newMemberAge ? parseInt(newMemberAge, 10) : undefined,
          gender: newMemberGender,
          blood_group: newMemberBlood,
          notes: newMemberNotes.trim() || undefined,
        }),
      });
      setFamilyMembers((prev) => [...prev, added]);
      setActiveMemberFolder(added.id);
      setShowAddMemberModal(false);
      setNewMemberName("");
      setNewMemberAge("");
      setNewMemberNotes("");
    } catch (err: any) {
      alert(`Error adding family member: ${err.message}`);
    } finally {
      setIsSavingMember(false);
    }
  }

  async function handleDeleteFamilyMember(id: string, name: string) {
    if (!confirm(`Remove family profile for ${name}?`)) return;
    try {
      await api(`/api/family-members/${id}`, { method: "DELETE" });
      setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
      if (activeMemberFolder === id) setActiveMemberFolder("all");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  }

  const currentMember = familyMembers.find((m) => m.id === activeMemberFolder);

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">Family Health Records & Folders</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Organized member-wise records for your whole family. Query or manage care in one account.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="btn btn-ghost text-xs bg-white border border-[#d9d1c3] flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#0f6e6e]" />
              <span>Add Member</span>
            </button>
            <button
              onClick={() => {
                const prompt = currentMember
                  ? `Summarize health records and medical profile for ${currentMember.full_name} (${currentMember.relationship})`
                  : "Summarize my recent healthcare activity and records";
                router.push("/ai?prompt=" + encodeURIComponent(prompt));
              }}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{currentMember ? `Ask AI About ${currentMember.full_name}` : "Ask Health AI"}</span>
            </button>
          </div>
        </div>

        {/* Member Folders Bar */}
        <div className="bg-white p-3.5 rounded-2xl border border-[#d9d1c3] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#5c6b73] uppercase tracking-wider">
              <FolderHeart className="w-4 h-4 text-[#0f6e6e]" />
              <span>Family Member Folders</span>
            </div>
            <span className="text-[0.7rem] text-[#5c6b73]">
              {familyMembers.length + 1} Profile(s) Active
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveMemberFolder("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                activeMemberFolder === "all"
                  ? "bg-[#0f6e6e] text-white shadow-xs"
                  : "bg-[#f3efe6] text-[#15232b] hover:bg-[#e4f2f1]"
              }`}
            >
              <span>📁</span>
              <span>All Family Records</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMemberFolder("self")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                activeMemberFolder === "self"
                  ? "bg-[#0f6e6e] text-white shadow-xs"
                  : "bg-[#f3efe6] text-[#15232b] hover:bg-[#e4f2f1]"
              }`}
            >
              <span>👤</span>
              <span>Arjun Mehta (Self)</span>
            </button>

            {familyMembers.map((fm) => (
              <div key={fm.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setActiveMemberFolder(fm.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                    activeMemberFolder === fm.id
                      ? "bg-[#0f6e6e] text-white shadow-xs"
                      : "bg-[#f3efe6] text-[#15232b] hover:bg-[#e4f2f1]"
                  }`}
                >
                  <span>{fm.relationship === "Mother" ? "👵" : fm.relationship === "Father" ? "👴" : "👥"}</span>
                  <span>{fm.full_name} ({fm.relationship})</span>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setShowAddMemberModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 border border-dashed border-[#0f6e6e] text-[#0f6e6e] bg-[#e4f2f1]/40 hover:bg-[#e4f2f1] transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member Profile</span>
            </button>
          </div>
        </div>

        {/* Selected Member Profile Card if viewing specific family member */}
        {currentMember && (
          <div className="card p-5 bg-linear-to-r from-[#e4f2f1] to-white border-[#0f6e6e]/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-2xl flex items-center justify-center shadow-xs border border-[#0f6e6e]/20">
                  {currentMember.relationship === "Mother" ? "👵" : currentMember.relationship === "Father" ? "👴" : "👥"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#15232b]">{currentMember.full_name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[0.7rem] font-bold bg-[#0f6e6e] text-white">
                      {currentMember.relationship}
                    </span>
                  </div>
                  <p className="text-xs text-[#5c6b73]">
                    {currentMember.age ? `${currentMember.age} years old` : "Age not specified"} · {currentMember.gender || "Gender not specified"} · Blood Group: {currentMember.blood_group || "Unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => router.push(`/appointments/book`)}
                  className="btn btn-primary text-xs flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Book Appointment for {currentMember.full_name.split(" ")[0]}</span>
                </button>
                <button
                  onClick={() => handleDeleteFamilyMember(currentMember.id, currentMember.full_name)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  title="Remove Profile"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {currentMember.notes && (
              <div className="text-xs text-[#15232b] bg-white p-3 rounded-xl border border-[#d9d1c3]/70">
                <span className="font-semibold text-[#0f6e6e]">Care Notes: </span>
                {currentMember.notes}
              </div>
            )}
          </div>
        )}

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
            <h3 className="font-bold text-sm text-[#15232b]">
              {currentMember ? `${currentMember.full_name.split(" ")[0]}'s Records` : "Medical Documents & Reports"}
            </h3>
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
              <h3 className="font-bold text-sm text-[#15232b]">
                {currentMember ? `Folder: ${currentMember.full_name} (${currentMember.relationship})` : "All Documented Records"}
              </h3>
              <span className="text-xs text-[#5c6b73]">{records.length} items</span>
            </div>

            {records.map((r) => (
              <div key={r.id} className="card p-4 bg-white flex items-center justify-between hover:border-[#0f6e6e]/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center font-bold text-xs">
                    📄
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#15232b]">{r.title}</h4>
                    <span className="text-xs text-[#5c6b73] capitalize">{r.record_type?.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedRecord(r)}
                    className="btn btn-ghost text-xs bg-white hover:bg-[#f3efe6] border border-[#d9d1c3] text-[#15232b] font-semibold flex items-center gap-1 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#0f6e6e]" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleExportRecordPdf(r)}
                    className="btn btn-ghost text-xs bg-white hover:bg-[#f3efe6] border border-[#d9d1c3] text-[#15232b] font-semibold flex items-center gap-1 shadow-2xs"
                    title="Export as PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0f6e6e]" />
                    <span>PDF</span>
                  </button>
                  <button
                    onClick={() => setSharingRecord(r)}
                    className="btn btn-ghost text-xs bg-white hover:bg-[#f3efe6] border border-[#d9d1c3] text-[#15232b] font-semibold flex items-center gap-1 shadow-2xs"
                    title="Send and Share Record"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#0f6e6e]" />
                    <span>Send</span>
                  </button>
                  <button
                    onClick={() => router.push("/ai?prompt=" + encodeURIComponent(`Explain what ${r.title} shows and what questions I should prepare for the doctor.`))}
                    className="btn btn-ghost text-xs bg-[#f3efe6] hover:bg-[#e4f2f1] text-[#0f6e6e] font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI</span>
                  </button>
                  <span className="status bg-emerald-50 text-emerald-800 text-[0.7rem]">Verified</span>
                </div>
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

      {/* Add Family Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#d9d1c3] space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-[#d9d1c3]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#0f6e6e]" />
                <h3 className="font-bold text-base text-[#15232b]">Add Family Member Folder</h3>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="text-[#5c6b73] hover:text-[#15232b] text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddFamilyMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#15232b] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Mehta"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d1c3] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Relationship</label>
                  <select
                    value={newMemberRel}
                    onChange={(e) => setNewMemberRel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d1c3] bg-white outline-none"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Age (Years)</label>
                  <input
                    type="number"
                    placeholder="e.g. 65"
                    value={newMemberAge}
                    onChange={(e) => setNewMemberAge(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d1c3] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Gender</label>
                  <select
                    value={newMemberGender}
                    onChange={(e) => setNewMemberGender(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d1c3] bg-white outline-none"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Blood Group</label>
                  <select
                    value={newMemberBlood}
                    onChange={(e) => setNewMemberBlood(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d1c3] bg-white outline-none"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#15232b] block mb-1">Medical Notes / Context (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Uneducated / smartphone illiterate parent; needs proxy appointment booking and medication monitoring."
                  value={newMemberNotes}
                  onChange={(e) => setNewMemberNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d1c3] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="btn btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingMember}
                  className="btn btn-primary text-xs"
                >
                  {isSavingMember ? "Creating Folder..." : "Create Folder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed View Health Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fffcf7] rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl border border-[#d9d1c3] space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-[#d9d1c3]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center font-bold text-lg border border-[#0f6e6e]/20">
                  📄
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base sm:text-lg text-[#15232b]">{selectedRecord.title}</h3>
                    <span className="status bg-emerald-50 text-emerald-800 text-[0.65rem] uppercase font-bold">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-[#5c6b73] capitalize">
                    {selectedRecord.record_type?.replace("_", " ")} · Patient: Arjun Mehta
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 text-[#5c6b73] hover:text-[#15232b] hover:bg-[#f3efe6] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Record Specific Details */}
            {selectedRecord.details ? (
              <div className="space-y-4 text-xs text-[#15232b]">
                {/* Lab Report Values */}
                {selectedRecord.details.values && selectedRecord.details.values.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-bold text-xs uppercase tracking-wider text-[#0f6e6e] flex items-center justify-between">
                      <span>Lab Test Results</span>
                      <span className="text-[10px] text-[#5c6b73] font-normal">
                        Date: {selectedRecord.details.report_date || "Recent"}
                      </span>
                    </div>
                    <div className="border border-[#d9d1c3] rounded-2xl overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f3efe6] text-[10px] uppercase font-bold text-[#5c6b73] border-b border-[#d9d1c3]">
                          <tr>
                            <th className="py-2.5 px-3">Test Parameter</th>
                            <th className="py-2.5 px-3">Result</th>
                            <th className="py-2.5 px-3">Reference Range</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#d9d1c3]/60">
                          {selectedRecord.details.values.map((v: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[#fbf9f4]">
                              <td className="py-2.5 px-3 font-semibold text-[#15232b]">{v.test_name}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-[#0f6e6e]">
                                {v.value} <span className="text-[10px] font-normal text-[#5c6b73]">{v.unit}</span>
                              </td>
                              <td className="py-2.5 px-3 text-[#5c6b73]">{v.reference_range || "Normal"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Prescription Info */}
                {selectedRecord.details.medications && selectedRecord.details.medications.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-bold text-xs uppercase tracking-wider text-[#0f6e6e]">
                      Prescribed Medications
                    </div>
                    <div className="space-y-2">
                      {selectedRecord.details.medications.map((m: any) => (
                        <div key={m.id} className="bg-white p-3 rounded-xl border border-[#d9d1c3] flex items-center justify-between">
                          <div>
                            <div className="font-bold text-xs text-[#15232b]">{m.name}</div>
                            <div className="text-[11px] text-[#5c6b73]">{m.dose} · {m.frequency} ({m.duration})</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e4f2f1] text-[#0f6e6e]">
                            {m.instructions}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Notes & Facility Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-[#d9d1c3]">
                    <div className="text-[10px] font-bold uppercase text-[#5c6b73]">Doctor / Clinician</div>
                    <div className="font-semibold text-[#15232b] mt-0.5">
                      {selectedRecord.details.doctor_name || "Dr. Ananya Sharma"}
                    </div>
                    <div className="text-[10px] text-[#0f6e6e]">{selectedRecord.details.specialty || "Cardiology Specialist"}</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#d9d1c3]">
                    <div className="text-[10px] font-bold uppercase text-[#5c6b73]">Facility / Hospital</div>
                    <div className="font-semibold text-[#15232b] mt-0.5">
                      {selectedRecord.details.hospital_or_lab || selectedRecord.details.hospital_name || "Bengaluru Heart & Multispecialty Hospital"}
                    </div>
                    <div className="text-[10px] text-emerald-700">NABH Accredited Demo</div>
                  </div>
                </div>

                {selectedRecord.details.notes && (
                  <div className="bg-white p-3 rounded-xl border border-[#d9d1c3]">
                    <div className="text-[10px] font-bold uppercase text-[#5c6b73] mb-1">Clinical Notes</div>
                    <p className="text-xs text-[#15232b] leading-relaxed">{selectedRecord.details.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-[#d9d1c3] space-y-2">
                <div className="text-xs font-semibold text-[#15232b]">Official Health Record Entry</div>
                <p className="text-xs text-[#5c6b73] leading-relaxed">
                  This official medical record has been verified and stored in your CareNav Health Vault.
                </p>
                <div className="pt-2 text-[11px] text-[#5c6b73] flex items-center justify-between border-t border-[#d9d1c3]/60">
                  <span>Record ID: {selectedRecord.id?.slice(0, 12)}...</span>
                  <span className="text-emerald-700 font-semibold">End-to-end Encrypted</span>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#d9d1c3]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportRecordPdf(selectedRecord)}
                  className="btn btn-ghost text-xs bg-white hover:bg-[#f3efe6] border border-[#d9d1c3] text-[#15232b] flex items-center gap-1.5 font-bold shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#0f6e6e]" />
                  <span>Export PDF</span>
                </button>

                <button
                  onClick={() => {
                    const target = selectedRecord;
                    setSelectedRecord(null);
                    setSharingRecord(target);
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
                    const title = selectedRecord.title;
                    setSelectedRecord(null);
                    router.push("/ai?prompt=" + encodeURIComponent(`Explain what ${title} shows, discuss the test values, and what lifestyle precautions or questions I should ask my doctor.`));
                  }}
                  className="btn btn-ghost text-xs bg-[#e4f2f1] text-[#0f6e6e] font-bold hover:bg-[#d0ecea] flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Explain</span>
                </button>

                <button
                  onClick={() => setSelectedRecord(null)}
                  className="btn btn-primary text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEND & SHARE HEALTH RECORD MODAL */}
      {sharingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-[#d9d1c3] space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-[#d9d1c3]">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#e4f2f1] text-[#0f6e6e] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#15232b]">Send Health Record</h3>
                  <p className="text-[0.7rem] text-[#5c6b73]">Export PDF & Send to Doctor or Caregiver</p>
                </div>
              </div>
              <button
                onClick={() => setSharingRecord(null)}
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
              <form onSubmit={handleSendShareRecord} className="space-y-3.5">
                <div className="p-3 rounded-2xl bg-[#fbf9f4] border border-[#d9d1c3] text-xs space-y-1">
                  <div className="font-bold text-[#15232b]">
                    📄 {sharingRecord.title}
                  </div>
                  <div className="text-[#5c6b73] capitalize">
                    {sharingRecord.record_type?.replace("_", " ")} · Verified Health Vault Record
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Kumar / Family Doctor"
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
                    placeholder="physician@hospital.demo"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d1c3] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Add Note / Context (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Attached is my latest blood laboratory report and clinical summary for review."
                    value={shareNotes}
                    onChange={(e) => setShareNotes(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-[#d9d1c3] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#d9d1c3]">
                  <button
                    type="button"
                    onClick={() => setSharingRecord(null)}
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
