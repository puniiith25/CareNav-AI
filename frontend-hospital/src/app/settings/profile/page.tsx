"use client";

import { useEffect, useState } from "react";
import { Building2, Save, CheckCircle2, ShieldCheck } from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";
import { api } from "@/lib/api";

export default function HospitalProfileSettingsPage() {
  const [profile, setProfile] = useState<any>({
    name: "Bengaluru Heart & Multispecialty Hospital",
    description: "Demo Facility — fictional multi-specialty hospital for CareNav demos.",
    address: "12 Demo Health Avenue, Bengaluru, Karnataka",
    phone: "+91 80 4000 1000",
    email: "contact@bengaluruheart.demo",
    website: "https://bengaluruheart.demo",
    emergency_available: true,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await api<any>("/api/hospital/profile");
        if (data) setProfile(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/hospital/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <HospitalAppShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            <span>Hospital Profile & Public Information</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure contact information and operational details displayed on the Healthcare Map.
          </p>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Hospital profile information saved and broadcasted.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hospital Name</label>
              <input
                type="text"
                required
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Helpline Phone</label>
              <input
                type="text"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description & Blurb</label>
            <textarea
              rows={3}
              value={profile.description || ""}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Email</label>
              <input
                type="email"
                value={profile.email || ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Website</label>
              <input
                type="text"
                value={profile.website || ""}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Hospital Profile"}</span>
            </button>
          </div>
        </form>
      </div>
    </HospitalAppShell>
  );
}
