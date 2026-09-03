"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Save, ShieldCheck, ExternalLink, Navigation } from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";
import { api } from "@/lib/api";

export default function HospitalLocationMapPage() {
  const [coords, setCoords] = useState({
    latitude: 12.9716,
    longitude: 77.5946,
    address: "12 Demo Health Avenue, Bengaluru, Karnataka (Demo Facility)",
    emergency_available: true,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/hospital/profile", {
        method: "PUT",
        body: JSON.stringify(coords),
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-400" />
              <span>Hospital Location & Map Configuration</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Configure coordinates and emergency availability visible to patients on Healthcare Map.
            </p>
          </div>
          <Link
            href="/map"
            target="_blank"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Preview on Patient Map</span>
          </Link>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs">
            Hospital geo-location and emergency status updated on Healthcare Map.
          </div>
        )}

        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={coords.latitude}
                onChange={(e) => setCoords({ ...coords, latitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={coords.longitude}
                onChange={(e) => setCoords({ ...coords, longitude: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Physical Address</label>
            <input
              type="text"
              required
              value={coords.address}
              onChange={(e) => setCoords({ ...coords, address: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white"
            />
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Emergency Services Availability</p>
              <p className="text-[11px] text-slate-400">Mark 24x7 emergency and trauma care capability.</p>
            </div>
            <input
              type="checkbox"
              checked={coords.emergency_available}
              onChange={(e) => setCoords({ ...coords, emergency_available: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
            />
          </div>

          {/* Indoor Navigation Prototype Notice */}
          <div className="p-4 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-blue-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Navigation className="w-3.5 h-3.5" />
              <span>Indoor Floorplan Architecture Active</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Database schema supports multi-floor room routing (Ground Floor Reception → Elevator → 3rd Floor Cardiology Suite 304).
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving..." : "Save Location Settings"}</span>
            </button>
          </div>
        </form>
      </div>
    </HospitalAppShell>
  );
}
