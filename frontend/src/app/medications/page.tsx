"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Plus,
  Sparkles,
  Bell,
  BellRing,
  Volume2,
  Smartphone,
  Mail,
  Trash2,
  Check,
  X,
  Timer,
  Play,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Medication, MedicationReminder } from "@/types";

export default function MedicationsPage() {
  const router = useRouter();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [schedule, setSchedule] = useState<{
    morning: Medication[];
    afternoon: Medication[];
    night: Medication[];
  }>({
    morning: [],
    afternoon: [],
    night: [],
  });
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [takenLogs, setTakenLogs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Live clock state
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [triggeredReminder, setTriggeredReminder] = useState<MedicationReminder | null>(null);
  const [alertBanner, setAlertBanner] = useState<string | null>(null);

  // New Reminder Modal state
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [selectedMedName, setSelectedMedName] = useState("");
  const [customMedName, setCustomMedName] = useState("");
  const [reminderDosage, setReminderDosage] = useState("1 tablet");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [reminderPeriod, setReminderPeriod] = useState<
    "morning" | "afternoon" | "evening" | "night" | "custom"
  >("morning");
  const [reminderFrequency, setReminderFrequency] = useState<
    "daily" | "weekly" | "alternate_days" | "as_needed"
  >("daily");
  const [reminderFood, setReminderFood] = useState<
    "before_food" | "after_food" | "with_food" | "empty_stomach"
  >("after_food");
  const [reminderChannels, setReminderChannels] = useState<string[]>([
    "in_app",
    "email",
  ]);
  const [reminderDays, setReminderDays] = useState<string[]>([
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ]);
  const [reminderNotes, setReminderNotes] = useState("");
  const [savingReminder, setSavingReminder] = useState(false);

  // Sound Audio Synth for Alarms
  const audioContextRef = useRef<AudioContext | null>(null);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function playAlertChime() {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.3); // D6
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {
      // ignore
    }
  }

  // Load meds and reminders
  useEffect(() => {
    async function loadMeds() {
      try {
        const data = await api<{
          medications: Medication[];
          today: any;
          reminders?: MedicationReminder[];
        }>("/api/medications");
        setMedications(data.medications || []);
        setSchedule(data.today || { morning: [], afternoon: [], night: [] });
        setReminders(data.reminders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMeds();
  }, []);

  // Time ticker: checks every 10 seconds if a reminder time matches current local time
  useEffect(() => {
    function checkClock() {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;
      setCurrentTimeStr(timeStr);

      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const currentDay = dayNames[now.getDay()];

      reminders.forEach((rem) => {
        if (!rem.enabled) return;
        if (takenLogs[`${rem.id}-${timeStr}`]) return;
        const matchesDay = rem.reminder_days.includes(currentDay);

        // Check if reminder is scheduled for this exact minute
        if (rem.time === timeStr && matchesDay) {
          triggerTimeAlarm(rem);
        }
      });
    }

    checkClock();
    const interval = setInterval(checkClock, 10000);
    return () => clearInterval(interval);
  }, [reminders, takenLogs]);

  function isReminderDue(rem: MedicationReminder): boolean {
    if (!currentTimeStr) return false;
    // Reminder is enabled and current time has reached or passed reminder time
    return rem.enabled && currentTimeStr >= rem.time;
  }

  async function triggerTimeAlarm(rem: MedicationReminder) {
    playAlertChime();
    setTriggeredReminder(rem);
    setAlertBanner(
      `🔔 MEDICATION DUE: Time to take ${rem.dosage} of ${rem.medication_name} (${rem.food_timing.replace("_", " ")})!`
    );

    // Call backend to log in timeline and send in-app notification
    try {
      await api(`/api/medications/reminders/${rem.id}/trigger`, {
        method: "POST",
      });
    } catch {
      // ignore
    }
  }

  async function handleTakeReminder(rem: MedicationReminder) {
    try {
      await api(`/api/medications/reminders/${rem.id}/take`, {
        method: "POST",
      });
      setTakenLogs((prev) => ({
        ...prev,
        [rem.id]: true,
        [`${rem.medication_id || rem.id}-${rem.period}`]: true,
      }));
      setTriggeredReminder(null);
      setAlertBanner(
        `✓ Dose recorded: ${rem.medication_name} (${rem.dosage}) marked as taken successfully!`
      );
      setTimeout(() => setAlertBanner(null), 4000);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAdherence(
    medId: string,
    action: "taken" | "skip",
    period: string
  ) {
    try {
      await api(`/api/medications/${medId}/log`, {
        method: "POST",
        body: JSON.stringify({ action, period }),
      });
      setTakenLogs((prev) => ({
        ...prev,
        [`${medId}-${period}`]: action === "taken",
      }));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleReminder(reminderId: string) {
    try {
      const updated = await api<MedicationReminder>(
        `/api/medications/reminders/${reminderId}/toggle`,
        {
          method: "PATCH",
        }
      );
      setReminders((prev) =>
        prev.map((r) => (r.id === reminderId ? updated : r))
      );
    } catch (err) {
      console.error("Toggle reminder error:", err);
    }
  }

  async function handleDeleteReminder(reminderId: string) {
    try {
      await api(`/api/medications/reminders/${reminderId}`, {
        method: "DELETE",
      });
      setReminders((prev) => prev.filter((r) => r.id !== reminderId));
    } catch (err) {
      console.error("Delete reminder error:", err);
    }
  }

  function toggleChannel(ch: string) {
    setReminderChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  }

  function toggleDay(d: string) {
    setReminderDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  async function handleSaveReminder(e: React.FormEvent) {
    e.preventDefault();
    const finalMedName =
      selectedMedName === "custom" ? customMedName.trim() : selectedMedName;
    if (!finalMedName) {
      alert("Please specify a medication name.");
      return;
    }

    setSavingReminder(true);
    try {
      const newRem = await api<MedicationReminder>(
        "/api/medications/reminders",
        {
          method: "POST",
          body: JSON.stringify({
            medication_name: finalMedName,
            dosage: reminderDosage,
            time: reminderTime,
            period: reminderPeriod,
            frequency: reminderFrequency,
            food_timing: reminderFood,
            channels: reminderChannels,
            reminder_days: reminderDays,
            notes: reminderNotes,
            enabled: true,
          }),
        }
      );
      setReminders((prev) => [newRem, ...prev]);
      setShowAddReminderModal(false);
      setCustomMedName("");
      setReminderNotes("");
    } catch (err: any) {
      alert(`Could not save reminder: ${err.message}`);
    } finally {
      setSavingReminder(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Live Alarm / Alert Banner */}
        {alertBanner && (
          <div className="p-4 rounded-2xl bg-[#0f6e6e] text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-3">
            <div className="flex items-center gap-2.5 text-xs md:text-sm font-semibold">
              <BellRing className="w-5 h-5 text-emerald-300 animate-bounce shrink-0" />
              <span>{alertBanner}</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {triggeredReminder && !takenLogs[triggeredReminder.id] && (
                <button
                  onClick={() => handleTakeReminder(triggeredReminder)}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-[#0f6e6e] text-xs font-bold shadow-sm hover:bg-emerald-50 transition-colors flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mark Taken Now</span>
                </button>
              )}
              <button
                onClick={() => setAlertBanner(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#15232b]">
                My Medications & Time Reminders
              </h1>
              {currentTimeStr && (
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#e4f2f1] text-[#0f6e6e] border border-[#bce2df]">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Clock: {currentTimeStr}</span>
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Automated time notifications and dynamic "Mark Taken" actions based on reminder schedules.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setSelectedMedName(medications[0]?.name || "custom");
                setShowAddReminderModal(true);
              }}
              className="btn btn-primary text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Time Reminder</span>
            </button>
            <button
              onClick={() =>
                router.push(
                  "/ai?prompt=" +
                    encodeURIComponent("What did my doctor prescribe?")
                )
              }
              className="btn btn-ghost text-xs flex items-center gap-1.5 bg-white border border-[#d9d1c3]"
            >
              <Sparkles className="w-4 h-4 text-[#0f6e6e]" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>

        {/* Medication Reminders Configured Section */}
        <div className="card p-6 bg-white space-y-4 border border-[#d9d1c3] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0f6e6e]" />
              <h3 className="font-bold text-sm text-[#15232b]">
                Smart Time-Based Reminders
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#0f6e6e] bg-[#e4f2f1] px-2.5 py-0.5 rounded-full">
              {reminders.filter((r) => r.enabled).length} Active Reminders
            </span>
          </div>

          {reminders.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#5c6b73] space-y-2">
              <p>No active reminders configured yet.</p>
              <button
                onClick={() => setShowAddReminderModal(true)}
                className="btn btn-primary text-xs inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create your first time reminder</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reminders.map((rem) => {
                const isDue = isReminderDue(rem);
                const isTaken = takenLogs[rem.id];

                return (
                  <div
                    key={rem.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      isTaken
                        ? "bg-emerald-50/50 border-emerald-200"
                        : isDue
                        ? "bg-[#fff9f0] border-amber-300 ring-2 ring-amber-200/60 shadow-sm"
                        : rem.enabled
                        ? "bg-[#fffcf7] border-[#d9d1c3] shadow-xs"
                        : "bg-[#f8f6f0] border-dashed border-[#d9d1c3] opacity-60"
                    }`}
                  >
                    <div>
                      {/* Reminder Card Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#15232b]">
                              {rem.medication_name}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#e4f2f1] text-[#0f6e6e]">
                              {rem.dosage}
                            </span>
                            {isDue && !isTaken && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                Due Now ⏰
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#15232b] font-semibold">
                            <Clock className="w-3.5 h-3.5 text-[#0f6e6e]" />
                            <span>
                              {rem.time} ({rem.period}) · {rem.frequency}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#5c6b73] mt-1 flex items-center gap-1">
                            <span>Instruction:</span>
                            <span className="font-medium text-[#15232b] capitalize">
                              {rem.food_timing.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        {/* Top Right Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleReminder(rem.id)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
                              rem.enabled
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-gray-200 text-gray-600 border border-gray-300"
                            }`}
                            title={
                              rem.enabled ? "Disable reminder" : "Enable reminder"
                            }
                          >
                            {rem.enabled ? "Active" : "Paused"}
                          </button>
                          <button
                            onClick={() => handleDeleteReminder(rem.id)}
                            className="p-1.5 rounded-lg text-[#5c6b73] hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete reminder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Area: Mark Taken / Alarm / Channel Tags */}
                    <div className="mt-4 pt-3 border-t border-[#d9d1c3]/50 space-y-2.5">
                      {/* MARK TAKEN BUTTON TRIGGERED BASED ON TIME */}
                      <div className="flex items-center justify-between gap-2">
                        {isTaken ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1.5 rounded-xl border border-emerald-300">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Completed Today ✓</span>
                          </div>
                        ) : isDue ? (
                          <button
                            onClick={() => handleTakeReminder(rem)}
                            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 animate-in zoom-in-95"
                          >
                            <Check className="w-4 h-4" />
                            <span>Mark Taken ({rem.time} Dose)</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-[#5c6b73] italic">
                            <Clock className="w-3 h-3 text-[#5c6b73]" />
                            <span>Mark button unlocks at {rem.time}</span>
                          </div>
                        )}

                        <button
                          onClick={() => triggerTimeAlarm(rem)}
                          className="px-2.5 py-1.5 rounded-xl border border-[#d9d1c3] hover:bg-[#e4f2f1] text-[11px] font-bold text-[#0f6e6e] flex items-center gap-1 transition-colors"
                          title="Trigger notification alarm now"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Send Alert</span>
                        </button>
                      </div>

                      {/* Notification Channels & Days */}
                      <div className="flex items-center justify-between gap-2 text-[10px] text-[#5c6b73]">
                        <div className="flex items-center gap-1">
                          {rem.channels.map((ch) => (
                            <span
                              key={ch}
                              className="px-1.5 py-0.5 rounded bg-[#f3efe6] font-semibold uppercase tracking-wider"
                            >
                              {ch === "in_app" ? "App" : ch}
                            </span>
                          ))}
                        </div>
                        <span className="truncate">
                          Days: {rem.reminder_days.join(", ")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily Schedule Blocks */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#5c6b73]">
            Today&apos;s Medication Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Morning */}
            <div className="card p-5 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#d9d1c3]/60">
                <span className="font-bold text-xs text-[#15232b] flex items-center gap-1.5">
                  <span>🌅 Morning</span>
                </span>
                <span className="text-[0.7rem] font-semibold text-[#5c6b73]">
                  Breakfast
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[#f3efe6] space-y-1.5">
                  <div className="font-bold text-xs text-[#15232b]">
                    Vitamin D3 (Demo)
                  </div>
                  <div className="text-[0.7rem] text-[#5c6b73]">
                    60,000 IU · Once weekly with milk
                  </div>
                  <div className="pt-2 flex gap-1.5">
                    <button
                      onClick={() =>
                        handleAdherence(
                          "99999999-9999-9999-9999-999999999902",
                          "taken",
                          "morning"
                        )
                      }
                      className={`btn text-[0.7rem] px-2.5 py-1 min-h-0 flex-1 ${
                        takenLogs[
                          "99999999-9999-9999-9999-999999999902-morning"
                        ]
                          ? "bg-emerald-600 text-white"
                          : "btn-primary"
                      }`}
                    >
                      {takenLogs[
                        "99999999-9999-9999-9999-999999999902-morning"
                      ]
                        ? "Taken ✓"
                        : "Mark Taken"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Afternoon */}
            <div className="card p-5 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#d9d1c3]/60">
                <span className="font-bold text-xs text-[#15232b] flex items-center gap-1.5">
                  <span>☀️ Afternoon</span>
                </span>
                <span className="text-[0.7rem] font-semibold text-[#5c6b73]">
                  Lunch
                </span>
              </div>
              <div className="py-6 text-center text-xs text-[#5c6b73]">
                No afternoon medicines scheduled.
              </div>
            </div>

            {/* Night */}
            <div className="card p-5 bg-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#d9d1c3]/60">
                <span className="font-bold text-xs text-[#15232b] flex items-center gap-1.5">
                  <span>🌙 Night</span>
                </span>
                <span className="text-[0.7rem] font-semibold text-[#5c6b73]">
                  After dinner
                </span>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-[#f3efe6] space-y-1.5">
                  <div className="font-bold text-xs text-[#15232b]">
                    Atorvastatin (Demo)
                  </div>
                  <div className="text-[0.7rem] text-[#5c6b73]">
                    10 mg · 1 tablet after food
                  </div>
                  <div className="pt-2 flex gap-1.5">
                    <button
                      onClick={() =>
                        handleAdherence(
                          "99999999-9999-9999-9999-999999999901",
                          "taken",
                          "night"
                        )
                      }
                      className={`btn text-[0.7rem] px-2.5 py-1 min-h-0 flex-1 ${
                        takenLogs["99999999-9999-9999-9999-999999999901-night"]
                          ? "bg-emerald-600 text-white"
                          : "btn-primary"
                      }`}
                    >
                      {takenLogs[
                        "99999999-9999-9999-9999-999999999901-night"
                      ]
                        ? "Taken ✓"
                        : "Mark Taken"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]/60">
            <h3 className="font-bold text-sm text-[#15232b]">
              Active Prescriptions from Doctors
            </h3>
            <span className="text-xs text-[#5c6b73]">
              {medications.length} Prescribed
            </span>
          </div>

          <div className="space-y-3">
            {medications.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-xl border border-[#d9d1c3] flex items-start justify-between"
              >
                <div>
                  <h4 className="font-bold text-sm text-[#15232b]">{m.name}</h4>
                  <div className="text-xs text-[#0f6e6e] font-semibold mt-0.5">
                    {m.dose} · {m.frequency}
                  </div>
                  {m.instructions && (
                    <p className="text-xs text-[#5c6b73] mt-1">
                      {m.instructions}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedMedName(m.name);
                    setReminderDosage(m.dose);
                    setShowAddReminderModal(true);
                  }}
                  className="btn btn-ghost text-xs border border-[#d9d1c3] hover:bg-[#e4f2f1] flex items-center gap-1"
                >
                  <Bell className="w-3.5 h-3.5 text-[#0f6e6e]" />
                  <span>Set Time Reminder</span>
                </button>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-[#fff1f1] border border-[#f5c2c2] text-xs text-[#9b2c2c] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              CareNav AI will never modify clinical dosages. If you wish to change your medication regimen, please consult your prescribing doctor.
            </span>
          </div>
        </div>

        {/* Add/Configure Reminder Modal */}
        {showAddReminderModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-[#fffcf7] rounded-3xl border border-[#d9d1c3] shadow-2xl overflow-hidden my-6 animate-in zoom-in-95">
              <div className="p-5 bg-gradient-to-r from-[#0f6e6e] to-[#074747] text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-white">
                    Configure Time-Based Medication Reminder
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Set specific alarms, notification channels, days and food instructions.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddReminderModal(false)}
                  className="p-1 rounded-lg text-white/80 hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveReminder} className="p-6 space-y-4">
                {/* Select or type medication name */}
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">
                    Medication Name
                  </label>
                  <select
                    value={selectedMedName}
                    onChange={(e) => setSelectedMedName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs font-semibold text-[#15232b] outline-none mb-2"
                  >
                    {medications.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.dose})
                      </option>
                    ))}
                    <option value="custom">
                      + Add Custom / OTC Medicine...
                    </option>
                  </select>

                  {selectedMedName === "custom" && (
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paracetamol 650mg or Multivitamin"
                      value={customMedName}
                      onChange={(e) => setCustomMedName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs text-[#15232b] outline-none"
                    />
                  )}
                </div>

                {/* Dosage & Timing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#15232b] block mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      required
                      value={reminderDosage}
                      onChange={(e) => setReminderDosage(e.target.value)}
                      placeholder="e.g. 1 tablet (500mg)"
                      className="w-full p-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs text-[#15232b] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#15232b] block mb-1">
                      Scheduled Time (24h)
                    </label>
                    <input
                      type="time"
                      required
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs font-bold text-[#15232b] outline-none"
                    />
                  </div>
                </div>

                {/* Period & Food Instruction */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#15232b] block mb-1">
                      Time Period
                    </label>
                    <select
                      value={reminderPeriod}
                      onChange={(e) => setReminderPeriod(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs font-medium text-[#15232b] outline-none"
                    >
                      <option value="morning">🌅 Morning (Breakfast)</option>
                      <option value="afternoon">☀️ Afternoon (Lunch)</option>
                      <option value="evening">🌆 Evening (Tea time)</option>
                      <option value="night">🌙 Night (Dinner)</option>
                      <option value="custom">⏱ Custom Alarm</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#15232b] block mb-1">
                      Food Relation
                    </label>
                    <select
                      value={reminderFood}
                      onChange={(e) => setReminderFood(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs font-medium text-[#15232b] outline-none"
                    >
                      <option value="after_food">After Food (Post-meal)</option>
                      <option value="before_food">
                        Before Food (30m pre-meal)
                      </option>
                      <option value="with_food">With Food</option>
                      <option value="empty_stomach">
                        Empty Stomach (Morning)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Frequency */}
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">
                    Frequency
                  </label>
                  <select
                    value={reminderFrequency}
                    onChange={(e) =>
                      setReminderFrequency(e.target.value as any)
                    }
                    className="w-full p-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs font-medium text-[#15232b] outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="alternate_days">Alternate Days</option>
                    <option value="weekly">Weekly</option>
                    <option value="as_needed">As Needed (SOS)</option>
                  </select>
                </div>

                {/* Active Days */}
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1.5">
                    Repeat On Days
                  </label>
                  <div className="flex gap-1.5">
                    {daysOfWeek.map((day) => {
                      const isSel = reminderDays.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleDay(day)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            isSel
                              ? "bg-[#0f6e6e] text-white"
                              : "bg-white border border-[#d9d1c3] text-[#5c6b73] hover:bg-[#e4f2f1]"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notification Channels */}
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1.5">
                    Notification Alert Channels
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "in_app", label: "In-App Bell", icon: Bell },
                      { key: "email", label: "Email Alert", icon: Mail },
                      { key: "sms", label: "SMS Phone", icon: Smartphone },
                    ].map((ch) => {
                      const isChecked = reminderChannels.includes(ch.key);
                      const Icon = ch.icon;
                      return (
                        <button
                          type="button"
                          key={ch.key}
                          onClick={() => toggleChannel(ch.key)}
                          className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
                            isChecked
                              ? "bg-[#e4f2f1] border-[#0f6e6e] text-[#0f6e6e]"
                              : "bg-white border-[#d9d1c3] text-[#5c6b73]"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{ch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-bold text-[#15232b] block mb-1">
                    Special Doctor Notes / Instructions
                  </label>
                  <input
                    type="text"
                    value={reminderNotes}
                    onChange={(e) => setReminderNotes(e.target.value)}
                    placeholder="e.g. Drink a full glass of warm water"
                    className="w-full p-2.5 rounded-xl bg-white border border-[#d9d1c3] text-xs text-[#15232b] outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#d9d1c3]">
                  <button
                    type="button"
                    onClick={() => setShowAddReminderModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#5c6b73] hover:bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingReminder}
                    className="btn btn-primary text-xs px-5 py-2"
                  >
                    {savingReminder ? "Saving..." : "Save Time Reminder"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
