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
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
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
                    onClick={() => router.push("/ai?prompt=" + encodeURIComponent(`Explain what ${r.title} shows and what questions I should prepare for the doctor.`))}
                    className="btn btn-ghost text-xs bg-[#f3efe6] hover:bg-[#e4f2f1] text-[#0f6e6e] font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain in AI</span>
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
    </AppShell>
  );
}
