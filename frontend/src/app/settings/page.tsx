"use client";

import { useEffect, useState } from "react";
import { User, Shield, Bell, Key, LogOut, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, patient, logout } = useAuth();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [fullName, setFullName] = useState(user?.profile?.full_name || "Arjun Mehta");
  const [phone, setPhone] = useState(user?.profile?.phone || "+91 98765 43210");
  const [emergencyName, setEmergencyName] = useState("Pooja Mehta");
  const [emergencyPhone, setEmergencyPhone] = useState("+91 98765 43211");

  useEffect(() => {
    async function loadAudit() {
      try {
        const data = await api<any[]>("/api/audit-log");
        setAuditLogs(data || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadAudit();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/patients/me", {
        method: "PATCH",
        body: JSON.stringify({
          full_name: fullName,
          phone,
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(`Error updating profile: ${err.message}`);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-[#15232b]">Settings & Privacy Controls</h1>
          <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
            Manage your patient profile, emergency contact details, and inspect security audit logs.
          </p>
        </div>

        {/* Profile Settings */}
        <form onSubmit={handleSaveProfile} className="card p-6 md:p-8 bg-white space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-[#d9d1c3]/60">
            <h2 className="text-base font-bold text-[#15232b]">Patient Profile</h2>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Profile updated successfully</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#5c6b73] block mb-1">Full Legal Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-sm text-[#15232b] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#5c6b73] block mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-sm text-[#15232b] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#5c6b73] block mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-sm text-[#15232b] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#5c6b73] block mb-1">Emergency Contact Phone</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#f3efe6] border border-[#d9d1c3] text-sm text-[#15232b] outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn btn-primary text-xs">
              Save Changes
            </button>
          </div>
        </form>

        {/* Security & Access Activity Audit Logs */}
        <div className="card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]/60">
            <h3 className="font-bold text-sm text-[#15232b]">Security & Access Activity Log</h3>
            <span className="text-xs text-[#5c6b73]">{auditLogs.length} events logged</span>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-[#d9d1c3]/50">
            {auditLogs.slice(0, 8).map((log, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#15232b]">{log.action}</span>
                  <span className="text-[#5c6b73] ml-2">({log.resource_type || "system"})</span>
                </div>
                <span className="text-[0.7rem] text-[#5c6b73]">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Account Session Logout */}
        <div className="card p-5 bg-white flex items-center justify-between">
          <div>
            <h4 className="font-bold text-sm text-[#15232b]">Account Session</h4>
            <p className="text-xs text-[#5c6b73]">Logged in as {user?.email || "demo.patient@carenav.demo"}</p>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost text-xs text-[#9b2c2c] hover:bg-red-50 flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </AppShell>
  );
}
