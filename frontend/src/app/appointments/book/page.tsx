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
  User,
  AlertTriangle,
  Lock,
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

  // Selection states
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(initialHospId || "");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(initialDocId || "");
  const [selectedDate, setSelectedDate] = useState("2026-09-03");
  const [selectedSlot, setSelectedSlot] = useState("2026-09-03T16:30:00+00:00");
  const [reason, setReason] = useState("Consultation regarding recent Complete Blood Count report");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [consentDuration, setConsentDuration] = useState("7 days");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [hRes, dRes, rRes] = await Promise.all([
          api<{ hospitals: Hospital[] }>("/api/hospitals"),
          api<Doctor[]>("/api/doctors"),
          api<MedicalReport[]>("/api/reports"),
        ]);
        setHospitals(hRes.hospitals || []);
        setDoctors(dRes || []);
        setReports(rRes || []);
        if (rRes?.length) {
          setSelectedDocIds([rRes[0].document_id || rRes[0].id]);
        }
        if (initialDocId) {
          const doc = dRes.find((d) => d.id === initialDocId);
          if (doc) {
            setSelectedDoctorId(doc.id);
            setSelectedHospitalId(doc.hospital_id);
          }
        }
      } catch (err) {
        console.error("Booking load error:", err);
      }
    }
    loadData();
  }, [initialDocId, initialHospId]);

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);
  const selectedHospital = hospitals.find((h) => h.id === selectedHospitalId);

  async function handleConfirmBooking() {
    setIsSubmitting(true);
    try {
      const res = await api<any>("/api/appointments", {
        method: "POST",
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          starts_at: selectedSlot,
          reason,
          document_ids: selectedDocIds,
          share_items: ["medical_reports", "timeline_summary"],
          duration_label: consentDuration,
          confirmed: true,
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
            <h2 className="text-xl font-bold text-[#15232b]">Select Doctor & Hospital</h2>
            <p className="text-xs text-[#5c6b73] mt-0.5">Choose your healthcare provider in Bengaluru.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#5c6b73] block mb-2">
                Doctor / Specialist
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {doctors.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setSelectedDoctorId(d.id);
                      setSelectedHospitalId(d.hospital_id);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedDoctorId === d.id
                        ? "bg-[#e4f2f1] border-[#0f6e6e] shadow-xs"
                        : "bg-white border-[#d9d1c3] hover:border-[#0f6e6e]/60"
                    }`}
                  >
                    <div className="font-bold text-sm text-[#15232b]">{d.full_name}</div>
                    <div className="text-xs font-semibold text-[#0f6e6e]">{d.specialty}</div>
                    <div className="text-[0.7rem] text-[#5c6b73] mt-1">{d.hospital?.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#d9d1c3]/60">
            <button
              disabled={!selectedDoctorId}
              onClick={() => setStep(2)}
              className="btn btn-primary text-xs flex items-center gap-1.5"
            >
              <span>Continue to Date & Time</span>
              <ChevronRight className="w-4 h-4" />
            </button>
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
                Available Slots
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  "2026-09-03T10:00:00+00:00",
                  "2026-09-03T11:30:00+00:00",
                  "2026-09-03T16:30:00+00:00",
                  "2026-09-03T17:15:00+00:00",
                ].map((slot) => {
                  const timeLabel = new Date(slot).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                        selectedSlot === slot
                          ? "bg-[#0f6e6e] text-white border-[#0f6e6e]"
                          : "bg-[#f3efe6] border-[#d9d1c3] text-[#15232b] hover:bg-[#e4f2f1]"
                      }`}
                    >
                      {timeLabel}
                    </button>
                  );
                })}
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
              <span className="font-bold">Sep 3, 2026 · 4:30 PM</span>
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
