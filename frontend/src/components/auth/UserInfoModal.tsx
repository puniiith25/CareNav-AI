"use client";

import { useState } from "react";
import {
  User,
  Heart,
  Calendar,
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  MapPin,
  Activity,
  Droplet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

interface UserInfoModalProps {
  onComplete: () => void;
}

export function UserInfoModal({ onComplete }: UserInfoModalProps) {
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState(user?.profile?.full_name || "Arjun Mehta");
  const [email, setEmail] = useState(user?.email || "patient@carenav.demo");
  const [phone, setPhone] = useState(user?.profile?.phone || "+91 98765 43210");
  const [dob, setDob] = useState(user?.profile?.date_of_birth || "1992-04-15");
  const [gender, setGender] = useState("Male");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [city, setCity] = useState("Bengaluru");
  const [language, setLanguage] = useState("English");
  const [emergencyName, setEmergencyName] = useState("Neha Mehta");
  const [emergencyPhone, setEmergencyPhone] = useState("+91 90000 11111");
  const [emergencyRel, setEmergencyRel] = useState("Spouse");
  const [healthGoals, setHealthGoals] = useState<string[]>([
    "Track blood tests & vitals",
    "Find nearby hospital specialists",
  ]);
  const [loading, setLoading] = useState(false);

  const goalOptions = [
    "Track blood tests & vitals",
    "Find nearby hospital specialists",
    "Manage recurring medications",
    "AI explanations for prescriptions",
    "Family dependent care",
  ];

  function toggleGoal(goal: string) {
    setHealthGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // Save profile to patient backend
      await api("/api/patients/me", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: fullName,
          phone,
          preferred_language: language.toLowerCase().slice(0, 2),
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
          accessibility_preferences: {
            gender,
            blood_group: bloodGroup,
            city,
            health_goals: healthGoals,
            emergency_relationship: emergencyRel,
          },
        }),
      }).catch((err) => console.warn("Saved locally in session:", err));

      // Mark user info modal as completed in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("carenav_user_info_collected", "true");
        localStorage.setItem(
          "carenav_user_profile",
          JSON.stringify({
            fullName,
            phone,
            dob,
            gender,
            bloodGroup,
            city,
            language,
            emergencyName,
            emergencyPhone,
            emergencyRel,
            healthGoals,
          })
        );
      }

      await refreshUser();
      onComplete();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[999] bg-[#0c1920]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-[#fffcf7] rounded-3xl border border-[#d9d1c3] shadow-2xl overflow-hidden my-6">
        {/* Modal Top Gradient Header */}
        <div className="bg-gradient-to-r from-[#0f6e6e] to-[#074747] p-6 text-white relative">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Step {step} of 2 · Patient Health Onboarding</span>
            </div>
            <div className="flex gap-1.5">
              <span
                className={`w-2 h-2 rounded-full transition-all ${
                  step === 1 ? "bg-white w-5" : "bg-white/40"
                }`}
              />
              <span
                className={`w-2 h-2 rounded-full transition-all ${
                  step === 2 ? "bg-white w-5" : "bg-white/40"
                }`}
              />
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            Welcome to CareNav AI
          </h2>
          <p className="text-xs md:text-sm text-emerald-100/90 mt-1 leading-relaxed">
            Please verify your patient details so CareNav can personalize clinical advice, nearby hospital routes, and emergency contacts.
          </p>
        </div>

        <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSave} className="p-6 md:p-8 space-y-6">
          {step === 1 ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center gap-2 pb-2 border-b border-[#d9d1c3]/60 text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">
                <User className="w-4 h-4" />
                <span>Personal & Demographics Information</span>
              </div>

              <div>
                <label className="text-xs font-bold text-[#15232b] block mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arjun Mehta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] font-medium outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs font-medium text-[#15232b] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs font-medium text-[#15232b] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">City / Region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs font-medium text-[#15232b] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2">
              <div className="flex items-center gap-2 pb-2 border-b border-[#d9d1c3]/60 text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">
                <ShieldCheck className="w-4 h-4" />
                <span>Emergency Contact & Health Preferences</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">
                    Emergency Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="e.g. Neha Mehta"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">
                    Emergency Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    placeholder="+91 90000 11111"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] outline-none focus:ring-2 focus:ring-[#0f6e6e]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#15232b] block mb-1.5">
                  Your Primary Health Goals
                </label>
                <div className="flex flex-wrap gap-2">
                  {goalOptions.map((goal) => {
                    const isSelected = healthGoals.includes(goal);
                    return (
                      <button
                        type="button"
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all ${
                          isSelected
                            ? "bg-[#0f6e6e] text-white shadow-xs"
                            : "bg-white border border-[#d9d1c3] text-[#5c6b73] hover:bg-[#e4f2f1]"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#e4f2f1]/70 border border-[#bce2df] text-[11px] text-[#0b4f4f] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0f6e6e] shrink-0 mt-0.5" />
                <span>
                  <strong>ABDM & FHIR Compliant Privacy:</strong> Your data is protected by consent policies. You can revoke access at any time under Settings.
                </span>
              </div>
            </div>
          )}

          {/* Action Navigation Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#d9d1c3]/70">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl border border-[#d9d1c3] text-xs font-bold text-[#5c6b73] hover:bg-white transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step === 1 ? (
              <button
                type="submit"
                className="btn btn-primary text-xs px-6 py-2.5 justify-center shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary text-xs px-6 py-2.5 justify-center shadow-sm"
              >
                <span>{loading ? "Saving Profile..." : "Enter CareNav AI Portal"}</span>
                <CheckCircle2 className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
