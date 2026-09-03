"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Building,
  Building2,
  User,
  AlertTriangle,
  Lock,
  Plus,
  MapPin,
  Stethoscope,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Doctor, Hospital, MedicalReport } from "@/types";

function BookingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get("doctorId");
  const initialHospId = searchParams.get("hospitalId");

  const [step, setStep] = useState(1);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  // Selection states
  const [selectedMemberId, setSelectedMemberId] = useState<string>("self");
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRel, setNewMemberRel] = useState("Mother");
  const [newMemberAge, setNewMemberAge] = useState<string>("");
  const [newMemberGender, setNewMemberGender] = useState("Female");
  const [newMemberNotes, setNewMemberNotes] = useState("");
  const [isSavingMember, setIsSavingMember] = useState(false);

  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(initialHospId || "");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDocId || "");
  const [selectedDate, setSelectedDate] = useState("2026-09-04");
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [reason, setReason] = useState("Consultation regarding recent health checkup");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [consentDuration, setConsentDuration] = useState("7 days");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [hRes, dRes, rRes, fRes] = await Promise.all([
          api<any>("/api/hospitals").catch(() => null),
          api<any>("/api/doctors").catch(() => null),
          api<MedicalReport[]>("/api/reports").catch(() => []),
          api<any[]>("/api/family-members").catch(() => []),
        ]);
        
        let hospList: Hospital[] = Array.isArray(hRes) ? hRes : (hRes?.hospitals || []);
        let docList: Doctor[] = Array.isArray(dRes) ? dRes : (dRes?.doctors || []);
        
        // Fallback default demo data if API returns empty list
        if (hospList.length === 0) {
          hospList = [
            {
              id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              name: "Bengaluru Heart & Multispecialty Hospital",
              slug: "bengaluru-heart-multispecialty",
              is_demo: true,
              address: "12 Demo Health Avenue, Bengaluru",
              phone: "+91 80 4000 1000",
              latitude: 12.9716,
              longitude: 77.5946,
              emergency_available: true,
              rating: 4.6,
            },
            {
              id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              name: "South City Orthopedic Center",
              slug: "south-city-orthopedic",
              is_demo: true,
              address: "88 Koramangala Demo Road, Bengaluru",
              phone: "+91 80 4000 2000",
              latitude: 12.9352,
              longitude: 77.6245,
              emergency_available: false,
              rating: 4.3,
            },
            {
              id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
              name: "Bengaluru Neuro & Wellness Hospital",
              slug: "bengaluru-neuro-wellness",
              is_demo: true,
              address: "21 Indiranagar Demo Street, Bengaluru",
              phone: "+91 80 4000 4000",
              latitude: 12.9784,
              longitude: 77.6408,
              emergency_available: true,
              rating: 4.5,
            },
            {
              id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
              name: "VisionCare Bengaluru",
              slug: "visioncare-bengaluru",
              is_demo: true,
              address: "9 Whitefield Demo Lane, Bengaluru",
              phone: "+91 80 4000 5000",
              latitude: 12.9698,
              longitude: 77.7499,
              emergency_available: false,
              rating: 4.7,
            },
            {
              id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
              name: "CityCare General Hospital",
              slug: "citycare-general",
              is_demo: true,
              address: "5 Hebbal Demo Park, Bengaluru",
              phone: "+91 80 4000 3000",
              latitude: 13.0358,
              longitude: 77.597,
              emergency_available: true,
              rating: 4.2,
            },
          ];
        }

        if (docList.length === 0) {
          docList = [
            {
              id: "11111111-1111-4111-8111-111111111111",
              hospital_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              full_name: "Dr. Ananya Sharma",
              specialty: "Cardiology",
              qualifications: "MBBS, MD (Cardiology)",
              experience_years: 12,
            },
            {
              id: "22222222-2222-4222-8222-222222222222",
              hospital_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
              full_name: "Dr. Kavya Rao",
              specialty: "Orthopedics",
              qualifications: "MBBS, MS (Ortho)",
              experience_years: 9,
            },
            {
              id: "33333333-3333-4333-8333-333333333333",
              hospital_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
              full_name: "Dr. Sameer Joshi",
              specialty: "Orthopedics",
              qualifications: "MBBS, MS (Ortho)",
              experience_years: 10,
            },
            {
              id: "44444444-4444-4444-8444-444444444444",
              hospital_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
              full_name: "Dr. Arjun Nair",
              specialty: "Neurology",
              qualifications: "MBBS, DM (Neurology)",
              experience_years: 11,
            },
            {
              id: "55555555-5555-4555-8555-555555555555",
              hospital_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
              full_name: "Dr. Priya Iyer",
              specialty: "Ophthalmology",
              qualifications: "MBBS, MS (Ophthalmology)",
              experience_years: 8,
            },
            {
              id: "66666666-6666-4666-8666-666666666666",
              hospital_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
              full_name: "Dr. Nisha Patel",
              specialty: "Pediatrics",
              qualifications: "MBBS, MD (Pediatrics)",
              experience_years: 7,
            },
          ];
        }
        
        setHospitals(hospList);
        setDoctors(docList);
        setReports(Array.isArray(rRes) ? rRes : []);
        setFamilyMembers(Array.isArray(fRes) ? fRes : []);

        if (rRes?.length) {
          setSelectedDocIds([rRes[0].document_id || rRes[0].id]);
        }
        if (initialDocId) {
          const doc = docList.find((d: Doctor) => d.id === initialDocId);
          if (doc) {
            setSelectedDoctorId(doc.id);
            setSelectedHospitalId(doc.hospital_id);
          }
        } else if (initialHospId) {
          setSelectedHospitalId(initialHospId);
        }
      } catch (err) {
        console.error("Booking load error:", err);
      }
    }
    loadData();
  }, [initialDocId, initialHospId]);

  async function handleAddFamilyMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    setIsSavingMember(true);
    try {
      const added = await api<any>("/api/family-members", {
        method: "POST",
        body: JSON.stringify({
          full_name: newMemberName.trim(),
          relationship: newMemberRel,
          age: newMemberAge ? parseInt(newMemberAge, 10) : undefined,
          gender: newMemberGender,
          notes: newMemberNotes.trim() || undefined,
        }),
      });
      setFamilyMembers((prev) => [...prev, added]);
      setSelectedMemberId(added.id);
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

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);
  const selectedMemberObj = selectedMemberId === "self" ? null : familyMembers.find((f) => f.id === selectedMemberId);

  async function handleConfirmBooking() {
    setIsSubmitting(true);
    try {
      const slotIso = `${selectedDate}T${selectedTime}:00+00:00`;
      const res = await api<any>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          starts_at: slotIso,
          reason,
          document_ids: selectedDocIds,
          share_items: ["medical_reports", "timeline_summary"],
          duration_label: consentDuration,
          confirmed: true,
          family_member_id: selectedMemberId === "self" ? null : selectedMemberId,
          patient_name: selectedMemberObj ? selectedMemberObj.full_name : "Arjun Mehta",
        }),
      });
      setBookingConfirmed(res);
      setStep(4);
    } catch (err: any) {
      alert(`Booking Error: ${err.message || "Failed to book appointment"}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Step Indicator */}
      <div className="card p-4 bg-white flex items-center justify-between">
        {[
          { num: 1, label: "Specialist & Hospital" },
          { num: 2, label: "Slot & Reason" },
          { num: 3, label: "Share & Consent" },
          { num: 4, label: "Confirmed" },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                step === s.num
                  ? "bg-[#0f6e6e] text-white"
                  : step > s.num
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-[#f3efe6] text-[#5c6b73]"
              }`}
            >
              {step > s.num ? "✓" : s.num}
            </div>
            <span className={`text-xs font-semibold hidden sm:inline ${step === s.num ? "text-[#15232b]" : "text-[#5c6b73]"}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP 1: Doctor & Hospital Selection */}
      {step === 1 && (
        <div className="card p-6 md:p-8 bg-white space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#15232b]">Who is this Appointment For?</h2>
            <p className="text-xs text-[#5c6b73] mt-0.5">Book for yourself or manage care for an elderly / dependent family member.</p>
          </div>

          {/* Member Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setSelectedMemberId("self")}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                selectedMemberId === "self"
                  ? "bg-[#e4f2f1] border-[#0f6e6e] ring-2 ring-[#0f6e6e]/20"
                  : "bg-white border-[#d9d1c3] hover:border-[#0f6e6e]/60"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">👤</span>
                <div>
                  <div className="font-bold text-xs text-[#15232b]">Arjun Mehta</div>
                  <div className="text-[0.7rem] font-semibold text-[#0f6e6e]">Myself (Account Holder)</div>
                </div>
              </div>
            </div>

            {familyMembers.map((fm) => (
              <div
                key={fm.id}
                onClick={() => setSelectedMemberId(fm.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedMemberId === fm.id
                    ? "bg-[#e4f2f1] border-[#0f6e6e] ring-2 ring-[#0f6e6e]/20"
                    : "bg-white border-[#d9d1c3] hover:border-[#0f6e6e]/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{fm.relationship === "Mother" ? "👵" : fm.relationship === "Father" ? "👴" : "👥"}</span>
                  <div>
                    <div className="font-bold text-xs text-[#15232b]">{fm.full_name}</div>
                    <div className="text-[0.7rem] font-semibold text-[#0f6e6e]">{fm.relationship} {fm.age ? `· ${fm.age}y` : ""}</div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setShowAddMemberModal(true)}
              className="p-3.5 rounded-xl border-2 border-dashed border-[#0f6e6e]/50 hover:border-[#0f6e6e] bg-[#e4f2f1]/30 hover:bg-[#e4f2f1] text-[#0f6e6e] font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Family Member</span>
            </button>
          </div>

          {/* 1. Hospital Selection First */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#15232b] flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#0f6e6e]" />
                  <span>1. Choose Hospital / Clinic</span>
                </h3>
                <p className="text-xs text-[#5c6b73]">Select the medical center first</p>
              </div>
              {selectedHospitalId && (
                <span className="text-[0.7rem] px-2 py-0.5 rounded-md bg-[#e4f2f1] text-[#0f6e6e] font-bold">
                  Hospital Selected ✓
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hospitals.map((h) => {
                const isSelected = selectedHospitalId === h.id;
                const docCount = doctors.filter((d) => d.hospital_id === h.id).length;
                return (
                  <div
                    key={h.id}
                    onClick={() => {
                      setSelectedHospitalId(h.id);
                      // If current doctor doesn't belong to this hospital, reset doctor
                      if (selectedDoctor && selectedDoctor.hospital_id !== h.id) {
                        setSelectedDoctorId("");
                      }
                    }}
                    className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1 ${
                      isSelected
                        ? "bg-[#e4f2f1] border-[#0f6e6e] ring-2 ring-[#0f6e6e]/20 shadow-xs"
                        : "bg-white border-[#d9d1c3] hover:border-[#0f6e6e]/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm text-[#15232b]">{h.name}</div>
                      <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-white text-[#5c6b73] border border-[#d9d1c3] shrink-0">
                        {docCount} Doctor{docCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="text-xs text-[#5c6b73] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#0f6e6e] shrink-0" />
                      <span className="truncate">{h.address}</span>
                    </div>
                    {h.emergency_available && (
                      <div className="text-[0.68rem] text-emerald-800 font-semibold pt-1">
                        🚑 24/7 Emergency & ICU
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Doctor Selection Based on Chosen Hospital */}
          <div className="space-y-2 pt-2 border-t border-[#d9d1c3]/60">
            <div>
              <h3 className="text-sm font-bold text-[#15232b] flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-[#0f6e6e]" />
                <span>2. Select Doctor {selectedHospital ? `at ${selectedHospital.name}` : ""}</span>
              </h3>
              <p className="text-xs text-[#5c6b73]">
                {selectedHospitalId
                  ? "Choose from specialists practicing at the selected facility."
                  : "Please choose a hospital above first to view available specialists."}
              </p>
            </div>

            {!selectedHospitalId ? (
              <div className="p-6 rounded-2xl bg-[#fbf9f4] border border-dashed border-[#d9d1c3] text-center text-xs text-[#5c6b73]">
                👈 Select a hospital above to see its doctor directory.
              </div>
            ) : doctors.filter((d) => d.hospital_id === selectedHospitalId).length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#fbf9f4] border border-dashed border-[#d9d1c3] text-center text-xs text-[#5c6b73]">
                No doctors currently listed for this hospital.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors
                  .filter((d) => d.hospital_id === selectedHospitalId)
                  .map((d) => (
                    <div
                      key={d.id}
                      onClick={() => setSelectedDoctorId(d.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                        selectedDoctorId === d.id
                          ? "bg-[#e4f2f1] border-[#0f6e6e] ring-2 ring-[#0f6e6e]/20 shadow-xs"
                          : "bg-white border-[#d9d1c3] hover:border-[#0f6e6e]/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-sm text-[#15232b]">{d.full_name}</div>
                        <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                          {d.experience_years}y exp
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#0f6e6e]">{d.specialty}</div>
                      <div className="text-[0.7rem] text-[#5c6b73]">{d.qualifications}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-[#d9d1c3]/60">
            <button
              disabled={!selectedHospitalId || !selectedDoctorId}
              onClick={() => setStep(2)}
              className="btn btn-primary text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>Continue to Date & Time</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Add Family Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#d9d1c3] space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-[#d9d1c3]">
              <h3 className="font-bold text-base text-[#15232b]">Add Family Member Profile</h3>
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

              <div>
                <label className="text-xs font-bold text-[#15232b] block mb-1">Medical Notes / Context (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Needs assistance with smartphone navigation, regular diabetes checkup."
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
                  {isSavingMember ? "Adding..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEP 2: Slot & Reason */}
      {step === 2 && (
        <div className="card p-6 md:p-8 bg-white space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#15232b]">Choose Appointment Slot & Reason</h2>
            <p className="text-xs text-[#5c6b73] mt-0.5">
              Consultation with {selectedDoctor?.full_name} ({selectedDoctor?.specialty})
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] block mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] block mb-2">
                Available Slots ({selectedDate})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                    onClick={() => setSelectedTime(s.time)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedTime === s.time
                        ? "bg-[#0f6e6e] text-white border-[#0f6e6e] shadow-xs"
                        : "bg-[#f3efe6] border-[#d9d1c3] text-[#15232b] hover:bg-[#e4f2f1]"
                    }`}
                  >
                    ⏰ {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] block mb-2">
                Reason for Visit / Concern (Not a diagnosis)
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your health concern or questions for the doctor..."
                className="w-full p-3 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#d9d1c3]/60">
            <button onClick={() => setStep(1)} className="btn btn-ghost text-xs flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button onClick={() => setStep(3)} className="btn btn-primary text-xs flex items-center gap-1.5">
              <span>Continue to Record Sharing & Consent</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Share Relevant Health Information & Consent */}
      {step === 3 && (
        <div className="card p-6 md:p-8 bg-white space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">
              <ShieldCheck className="w-4 h-4" />
              <span>Granular Privacy & Consent Control</span>
            </div>
            <h2 className="text-xl font-bold text-[#15232b] mt-1">Control What You Share</h2>
            <p className="text-xs text-[#5c6b73]">
              Select which health documents and summaries will be accessible to {selectedDoctor?.full_name}.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] block">
              Select Medical Records to Share
            </label>

            {reports.map((r) => {
              const docId = r.document_id || r.id;
              const isChecked = selectedDocIds.includes(docId);
              return (
                <div
                  key={r.id}
                  onClick={() => {
                    if (isChecked) {
                      setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
                    } else {
                      setSelectedDocIds([...selectedDocIds, docId]);
                    }
                  }}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    isChecked ? "bg-[#e4f2f1] border-[#0f6e6e]" : "bg-white border-[#d9d1c3]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      readOnly
                      className="w-4 h-4 accent-[#0f6e6e]"
                    />
                    <div>
                      <div className="text-sm font-bold text-[#15232b]">{r.test_name}</div>
                      <div className="text-xs text-[#5c6b73]">
                        {r.report_date} · {r.hospital_or_lab}
                      </div>
                    </div>
                  </div>
                  <span className="text-[0.7rem] px-2 py-0.5 rounded bg-white text-[#5c6b73] border border-[#d9d1c3]">
                    Lab Report
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] space-y-2">
            <label className="text-xs font-bold text-[#15232b] block">Consent Duration</label>
            <div className="flex gap-2">
              {["24 hours", "7 days", "appointment only"].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setConsentDuration(dur)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    consentDuration === dur
                      ? "bg-[#0f6e6e] text-white"
                      : "bg-white border border-[#d9d1c3] text-[#15232b]"
                  }`}
                >
                  {dur}
                </button>
              ))}
            </div>
            <p className="text-[0.7rem] text-[#5c6b73]">
              Access will automatically expire after the selected duration. You can revoke access at any time under Privacy & Consent.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#d9d1c3]/60">
            <button onClick={() => setStep(2)} className="btn btn-ghost text-xs flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              disabled={isSubmitting}
              onClick={handleConfirmBooking}
              className="btn btn-primary text-xs flex items-center gap-2 px-6"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Confirming..." : "Confirm & Share Records"}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Appointment Confirmed 🎉 */}
      {step === 4 && bookingConfirmed && (
        <div className="card p-6 md:p-10 bg-white text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold">
            🎉
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#15232b]">Appointment Confirmed!</h2>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-1">
              Your consultation has been booked and shared records are secured with time-limited consent.
            </p>
          </div>

          <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#f3efe6] border border-[#d9d1c3] text-left space-y-2.5 text-xs text-[#15232b]">
            <div className="flex justify-between pb-2 border-b border-[#d9d1c3]/60">
              <span className="text-[#5c6b73]">Patient / For:</span>
              <span className="font-bold text-[#0f6e6e]">
                {bookingConfirmed.patient_name || (selectedMemberObj ? `${selectedMemberObj.full_name} (${selectedMemberObj.relationship})` : "Arjun Mehta (Self)")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5c6b73]">Specialist:</span>
              <span className="font-bold">{bookingConfirmed.doctor?.full_name} ({bookingConfirmed.doctor?.specialty})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5c6b73]">Hospital:</span>
              <span className="font-semibold">{bookingConfirmed.hospital?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5c6b73]">Date & Time:</span>
              <span className="font-bold">
                {selectedDate} · {selectedTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5c6b73]">Shared Records:</span>
              <span className="font-bold text-[#0f6e6e]">{selectedDocIds.length} document(s)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5c6b73]">Consent Active:</span>
              <span className="font-bold text-emerald-800">{consentDuration}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-4">
            <button
              onClick={() => router.push("/appointments")}
              className="btn btn-primary text-xs"
            >
              View My Appointments
            </button>
            <button
              onClick={() => router.push("/ai?prompt=" + encodeURIComponent("Prepare me with questions for Dr. Ananya Sharma based on my blood report"))}
              className="btn btn-ghost text-xs bg-[#f3efe6]"
            >
              Prepare Visit Questions with AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingWizardPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="py-20 text-center text-sm text-[#5c6b73]">Loading booking flow...</div>}>
        <BookingWizardContent />
      </Suspense>
    </AppShell>
  );
}
