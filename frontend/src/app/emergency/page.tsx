"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Phone, MapPin, Navigation, ShieldAlert, HeartPulse } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/lib/api";
import { Hospital } from "@/types";

export default function EmergencyPage() {
  const [emergencyData, setEmergencyData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEmergency() {
      try {
        const res = await api<any>("/api/emergency");
        setEmergencyData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadEmergency();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* High-Contrast Urgent Banner */}
        <div className="card p-6 md:p-8 bg-[#9b2c2c] text-white space-y-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-bold">
              <AlertTriangle className="w-7 h-7 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Emergency Assistance</h1>
              <p className="text-red-100 text-xs md:text-sm mt-0.5">
                If you are experiencing severe chest pain, shortness of breath, or trauma, contact emergency services immediately.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href="tel:112"
              className="p-4 rounded-xl bg-white text-[#9b2c2c] hover:bg-red-50 font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>Call National Emergency (112)</span>
            </a>
            <a
              href="tel:108"
              className="p-4 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-colors"
            >
              <HeartPulse className="w-5 h-5" />
              <span>Ambulance Response (108)</span>
            </a>
          </div>
        </div>

        {/* Emergency Contacts Card */}
        {emergencyData?.emergency_contact?.name && (
          <div className="card p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#5c6b73]">
                Your Designated Emergency Contact
              </div>
              <h3 className="font-bold text-base text-[#15232b] mt-0.5">
                {emergencyData.emergency_contact.name} (Family)
              </h3>
              <p className="text-xs text-[#5c6b73]">{emergencyData.emergency_contact.phone}</p>
            </div>
            <a
              href={`tel:${emergencyData.emergency_contact.phone}`}
              className="btn btn-primary text-xs self-start sm:self-auto"
            >
              <Phone className="w-3.5 h-3.5 mr-1" />
              <span>Call Contact</span>
            </a>
          </div>
        )}

        {/* Nearby Emergency Facilities in Bengaluru */}
        <div className="space-y-3">
          <div className="font-bold text-sm text-[#15232b]">
            Nearby Verified 24/7 Emergency Trauma Centers in Bengaluru
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyData?.facilities?.map((f: Hospital) => (
              <div key={f.id} className="card p-5 bg-white space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[0.68rem] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                      24/7 Trauma Unit
                    </span>
                    <span className="text-xs text-[#5c6b73] font-semibold">Demo Facility</span>
                  </div>
                  <h3 className="font-bold text-sm text-[#15232b] mt-2">{f.name}</h3>
                  <p className="text-xs text-[#5c6b73] mt-1 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0f6e6e] shrink-0 mt-0.5" />
                    <span>{f.address}</span>
                  </p>
                </div>

                <div className="pt-3 border-t border-[#d9d1c3]/60 flex items-center gap-2">
                  <a
                    href={`https://maps.google.com/?q=${f.latitude},${f.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary text-xs flex-1 justify-center"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1" />
                    <span>Directions</span>
                  </a>
                  <a href={`tel:${f.phone}`} className="btn btn-ghost text-xs bg-[#f3efe6]">
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
