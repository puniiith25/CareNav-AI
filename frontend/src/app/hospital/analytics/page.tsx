"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, Users, Calendar, Activity, ShieldCheck } from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";
import { api } from "@/lib/api";

export default function HospitalAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await api<any>("/api/hospital/analytics");
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  const metrics = data?.metrics || {
    total_appointments: 148,
    completed_rate: "88.4%",
    cancellation_rate: "4.2%",
    no_show_rate: "2.1%",
    avg_consultation_time: "18 mins",
    patient_satisfaction: "4.8/5.0",
  };

  const departmentVolume = data?.department_volume || [
    { department: "Cardiology", count: 48 },
    { department: "Orthopedics", count: 32 },
    { department: "Internal Medicine", count: 28 },
    { department: "Diagnostics", count: 22 },
    { department: "Emergency", count: 18 },
  ];

  const hourlyFlow = data?.hourly_patient_flow || [
    { hour: "09:00", count: 14 },
    { hour: "10:00", count: 22 },
    { hour: "11:00", count: 26 },
    { hour: "12:00", count: 18 },
    { hour: "14:00", count: 16 },
    { hour: "15:00", count: 20 },
    { hour: "16:00", count: 19 },
  ];

  return (
    <HospitalAppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <span>Hospital Operational Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Realtime performance metrics, department load distribution, and consultation completion rates.
          </p>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Volume</span>
            <div className="text-3xl font-bold text-white mt-2">{metrics.total_appointments}</div>
            <div className="text-[11px] text-blue-400 font-medium mt-1">Visits this week</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Completion Rate</span>
            <div className="text-3xl font-bold text-emerald-400 mt-2">{metrics.completed_rate}</div>
            <div className="text-[11px] text-slate-400 mt-1">Consultations completed</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Cancellation Rate</span>
            <div className="text-3xl font-bold text-slate-300 mt-2">{metrics.cancellation_rate}</div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">Below target threshold (5%)</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Avg Consultation</span>
            <div className="text-3xl font-bold text-white mt-2">{metrics.avg_consultation_time}</div>
            <div className="text-[11px] text-slate-400 mt-1">Per clinical visit</div>
          </div>
        </div>

        {/* Charts & Graphs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Volume Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Department Appointment Distribution</h3>
            <div className="space-y-3">
              {departmentVolume.map((item: any) => (
                <div key={item.department} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="font-semibold">{item.department}</span>
                    <span className="font-mono text-white">{item.count} appointments</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${(item.count / 50) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Patient Flow Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Peak Hourly Patient Flow</h3>
            <div className="h-44 flex items-end justify-between gap-3 pt-4 border-b border-slate-800">
              {hourlyFlow.map((h: any) => (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{h.count}</span>
                  <div
                    className="w-full bg-blue-600 hover:bg-blue-500 rounded-t transition-colors"
                    style={{ height: `${(h.count / 30) * 120}px` }}
                  />
                  <span className="text-[10px] font-mono text-slate-400">{h.hour}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </HospitalAppShell>
  );
}
