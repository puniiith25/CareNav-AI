"use client";

import { useEffect, useState } from "react";
import { Briefcase, Check, Plus } from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";
import { api } from "@/lib/api";

export default function HospitalServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServices() {
      try {
        const data = await api<any[]>("/api/hospital/services");
        setServices(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, []);

  return (
    <HospitalAppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-400" />
            <span>Discoverable Healthcare Services</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configured services are immediately indexed on the public CareNav Healthcare Map.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">{s.name}</h3>
                <span className="p-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <Check className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-xs text-slate-400">{s.description || s.name}</p>
              <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 mt-2">
                Category: {s.category || "HOSPITAL"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </HospitalAppShell>
  );
}
