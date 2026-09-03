"use client";

import { useEffect, useState } from "react";
import { Users, Plus, ShieldCheck, Trash2, Mail } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";

export default function CaregiversPage() {
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["appointments", "medications", "recovery"]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCaregivers();
  }, []);

  async function loadCaregivers() {
    try {
      const data = await api<any[]>("/api/caregivers");
      setCaregivers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) return;
    try {
      await api("/api/caregivers", {
        method: "POST",
        body: JSON.stringify({ name, email, permissions, confirmed: true }),
      });
      setName("");
      setEmail("");
      setShowInviteModal(false);
      loadCaregivers();
    } catch (err: any) {
      alert(`Could not invite caregiver: ${err.message}`);
    }
  }

  async function handleRevoke(cid: string) {
    if (!confirm("Are you sure you want to revoke caregiver access?")) return;
    try {
      await api(`/api/caregivers/${cid}?confirmed=true`, {
        method: "DELETE",
      });
      loadCaregivers();
    } catch (err: any) {
      alert(`Could not revoke: ${err.message}`);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#15232b]">Caregiver Access</h1>
            <p className="text-xs md:text-sm text-[#5c6b73] mt-0.5">
              Invite trusted family members or caregivers to view appointments, medication schedules, and recovery plans.
            </p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn btn-primary text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Invite Caregiver</span>
          </button>
        </div>

        <div className="space-y-4">
          {caregivers.length === 0 ? (
            <div className="card p-10 text-center bg-white text-xs text-[#5c6b73]">
              No active caregivers. You can invite a trusted family member anytime.
            </div>
          ) : (
            caregivers.map((c) => (
              <div key={c.id} className="card p-5 bg-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#15232b]">{c.name}</h3>
                  <p className="text-xs text-[#5c6b73] mt-0.5">{c.email}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.permissions?.map((p: string) => (
                      <span key={p} className="text-[0.65rem] px-2 py-0.5 rounded bg-[#e4f2f1] text-[#0f6e6e] font-semibold">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(c.id)}
                  className="btn btn-ghost text-xs text-[#9b2c2c] hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Revoke</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Invite Caregiver Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleInvite} className="card p-6 bg-[#fffcf7] max-w-md w-full space-y-4 shadow-2xl">
              <h3 className="font-bold text-base text-[#15232b]">Invite a Trusted Caregiver</h3>

              <div>
                <label className="text-xs font-bold text-[#5c6b73] block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pooja Mehta"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#5c6b73] block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pooja.mehta@example.com"
                  className="w-full p-2.5 rounded-xl bg-white border border-[#d9d1c3] text-sm text-[#15232b] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="btn btn-ghost text-xs bg-white"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary text-xs">
                  Send Caregiver Invitation
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppShell>
  );
}
