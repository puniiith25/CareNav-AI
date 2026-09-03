"use client";

import { useEffect, useState } from "react";
import { Layers, CheckCircle2, ShieldCheck, Save } from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";
import { api } from "@/lib/api";

export default function HospitalFacilitiesPage() {
  const [data, setData] = useState<any>({
    available_options: [
      "Emergency",
      "ICU",
      "Pharmacy",
      "Laboratory",
      "MRI",
      "CT",
      "X-Ray",
      "Ambulance",
      "Wheelchair Accessibility",
      "Parking",
      "Waiting Area",
    ],
    active_facilities: ["Emergency", "ICU", "Pharmacy", "Laboratory", "Wheelchair Accessibility", "Parking"],
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleFacility(f: string) {
    const list = [...data.active_facilities];
    if (list.includes(f)) {
      setData({ ...data, active_facilities: list.filter((x) => x !== f) });
    } else {
      setData({ ...data, active_facilities: [...list, f] });
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api("/api/hospital/facilities", {
        method: "PUT",
        body: JSON.stringify({ facilities: data.active_facilities }),
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
              <Layers className="w-6 h-6 text-blue-400" />
              <span>Hospital Facilities & Amenities</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Configure available diagnostic, emergency, and accessibility facilities.
            </p>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-md transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Facilities"}</span>
          </button>
        </div>

        {saved && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Hospital facilities updated and verified on Healthcare Map.</span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.available_options.map((facility: string) => {
              const isChecked = data.active_facilities.includes(facility);
              return (
                <button
                  key={facility}
                  type="button"
                  onClick={() => toggleFacility(facility)}
                  className={`p-4 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                    isChecked
                      ? "bg-blue-950/60 border-blue-600 text-white shadow-sm"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <span>{facility}</span>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isChecked
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "border-slate-700 bg-slate-900"
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </HospitalAppShell>
  );
}
