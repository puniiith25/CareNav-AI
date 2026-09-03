"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Calendar, CheckCircle2, Save, ShieldCheck } from "lucide-react";
import { DoctorAppShell } from "@/components/layout/DoctorAppShell";
import { api } from "@/lib/api";

export default function DoctorSchedulePage() {
  const [schedule, setSchedule] = useState<any>({
    consultation_type: "in_person",
    max_daily_appointments: 25,
    availability: [
      { weekday: 1, start_time: "09:00", end_time: "17:00", slot_minutes: 20 },
      { weekday: 2, start_time: "09:00", end_time: "17:00", slot_minutes: 20 },
      { weekday: 3, start_time: "09:00", end_time: "17:00", slot_minutes: 20 },
      { weekday: 4, start_time: "09:00", end_time: "17:00", slot_minutes: 20 },
      { weekday: 5, start_time: "09:00", end_time: "17:00", slot_minutes: 20 },
    ],
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/doctor/schedule", {
        method: "PUT",
        body: JSON.stringify(schedule),
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DoctorAppShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-teal-400" />
            <span>Doctor Schedule & Availability Slots</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configured slots automatically appear on the patient booking interface.
          </p>
        </div>

        {success && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Schedule updated successfully. New booking slots generated.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Weekly Consultation Hours</h3>
            <div className="space-y-3">
              {weekdays.slice(0, 5).map((day, idx) => (
                <div key={day} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <span className="font-semibold text-white w-28">{day}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">09:00 AM – 05:00 PM</span>
                    <span className="text-teal-400 font-mono">20 min slots</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px] font-bold">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Consultation Type</label>
              <select
                value={schedule.consultation_type}
                onChange={(e) => setSchedule({ ...schedule, consultation_type: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
              >
                <option value="in_person">In-Person Clinical Consultation</option>
                <option value="online">Online Video Consultation</option>
                <option value="both">Both (In-person & Online)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Max Daily Appointments</label>
              <input
                type="number"
                value={schedule.max_daily_appointments}
                onChange={(e) => setSchedule({ ...schedule, max_daily_appointments: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Changes take effect immediately on Healthcare Map.</span>
            </span>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Schedule"}</span>
            </button>
          </div>
        </form>
      </div>
    </DoctorAppShell>
  );
}
