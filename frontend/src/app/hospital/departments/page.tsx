"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Users, Clock } from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";
import { api } from "@/lib/api";

export default function HospitalDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDepts() {
      try {
        const data = await api<any[]>("/api/hospital/departments");
        setDepartments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDepts();
  }, []);

  return (
    <HospitalAppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              <span>Hospital Clinical Departments</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage clinical departments, assigned doctors, and operating hours.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((d) => (
            <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">{d.name}</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  {d.floor_label || "Floor 1"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Operating Hours: <span className="text-slate-200">{d.operating_hours || "08:00–20:00"}</span>
              </p>
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                <span>Assigned Medical Staff:</span>
                <span className="font-bold text-blue-400">{d.doctor_count || 4} Specialists</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </HospitalAppShell>
  );
}
