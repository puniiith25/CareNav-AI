"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pill,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
} from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { api } from "@/lib/api";

interface MedRow {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  period: string;
}

export default function DoctorNewPrescriptionPage() {
  const router = useRouter();
  const [patientId] = useState("44444444-4444-4444-4444-444444444410");
  const [patientName] = useState("Arjun Mehta (Age 34)");
  const [notes, setNotes] = useState("DEMO PRESCRIPTION — Take medications with meals. Return for follow-up in 30 days.");
  
  const [medicines, setMedicines] = useState<MedRow[]>([
    {
      name: "Demo Medicine A (Cardio Support)",
      dosage: "500 mg",
      frequency: "Once daily",
      duration: "30 days",
      instructions: "Take in the morning after breakfast. DEMO ONLY.",
      period: "morning",
    },
    {
      name: "Demo Medicine B (Lipid Regulating)",
      dosage: "10 mg",
      frequency: "Once daily at night",
      duration: "30 days",
      instructions: "Take before bedtime. DEMO ONLY.",
      period: "night",
    },
  ]);

  const [confirmModal, setConfirmModal] = useState(false);
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleAddMedicine() {
    setMedicines([
      ...medicines,
      {
        name: "",
        dosage: "",
        frequency: "Once daily",
        duration: "7 days",
        instructions: "",
        period: "morning",
      },
    ]);
  }

  function handleRemoveMedicine(index: number) {
    setMedicines(medicines.filter((_, i) => i !== index));
  }

  function handleUpdateMed(index: number, field: keyof MedRow, val: string) {
    const updated = [...medicines];
    updated[index][field] = val;
    setMedicines(updated);
  }

  async function handleSignPrescription() {
    setSigning(true);
    try {
      await api("/api/doctor/prescriptions", {
        method: "POST",
        body: JSON.stringify({
          patient_id: patientId,
          appointment_id: "44444444-4444-4444-4444-444444444421",
          medicines: medicines,
          notes: notes,
          signed: true,
        }),
      });
      setConfirmModal(false);
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  }

  return (
    <DoctorAppShell>
      <div className="space-y-6 max-w-4xl">
        <Link href="/doctor/dashboard" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Pill className="w-6 h-6 text-teal-400" />
              <span>Create Official Clinical Prescription</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Authoritative clinical order for patient: <strong className="text-white">{patientName}</strong>
            </p>
          </div>
        </div>

        {success ? (
          <div className="bg-slate-900 border border-emerald-800 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Prescription Signed & Synced</h2>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              The prescription has been added to Arjun Mehta&apos;s Health Record, medication reminder schedule, and health timeline. The patient has been notified.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Link href="/doctor/patients" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg">
                View Patients
              </Link>
              <Link href="/doctor/dashboard" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg">
                Doctor Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            {/* Medicines List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Prescribed Medications</h3>
                <button
                  type="button"
                  onClick={handleAddMedicine}
                  className="px-3 py-1 bg-teal-600/20 text-teal-300 border border-teal-500/40 text-xs font-semibold rounded-lg hover:bg-teal-600/30 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medicine</span>
                </button>
              </div>

              {medicines.map((med, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400">Medicine #{idx + 1}</span>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Medicine Name</label>
                      <input
                        type="text"
                        required
                        value={med.name}
                        onChange={(e) => handleUpdateMed(idx, "name", e.target.value)}
                        placeholder="E.g. Atorvastatin..."
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Dosage</label>
                      <input
                        type="text"
                        required
                        value={med.dosage}
                        onChange={(e) => handleUpdateMed(idx, "dosage", e.target.value)}
                        placeholder="E.g. 10 mg / 500 mg"
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Frequency</label>
                      <input
                        type="text"
                        value={med.frequency}
                        onChange={(e) => handleUpdateMed(idx, "frequency", e.target.value)}
                        placeholder="Once daily..."
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Duration</label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => handleUpdateMed(idx, "duration", e.target.value)}
                        placeholder="30 days..."
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">Schedule Period</label>
                      <select
                        value={med.period}
                        onChange={(e) => handleUpdateMed(idx, "period", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="morning">Morning (Breakfast)</option>
                        <option value="afternoon">Afternoon (Lunch)</option>
                        <option value="night">Night (Bedtime)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Instructions</label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) => handleUpdateMed(idx, "instructions", e.target.value)}
                      placeholder="Special instructions for patient..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Clinical Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Doctor Notes & Directions</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>

            {/* Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>AI will never autonomously sign or create prescriptions.</span>
              </span>
              <button
                type="button"
                onClick={() => setConfirmModal(true)}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg shadow-md transition-colors flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Review & Sign Prescription</span>
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-950 text-teal-400 border border-teal-800 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Sign Prescription?</h3>
                  <p className="text-xs text-slate-400">Dr. Ananya Sharma • Cardiology</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This prescription will be officially signed and added to <strong className="text-white">Arjun Mehta&apos;s</strong> health record. The patient will immediately receive notification and schedule updates.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={signing}
                  onClick={handleSignPrescription}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
                >
                  {signing ? "Signing..." : "Confirm & Sign Prescription"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorAppShell>
  );
}
