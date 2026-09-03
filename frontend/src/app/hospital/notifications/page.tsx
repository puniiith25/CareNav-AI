"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle2, Clock, AlertTriangle, Building2 } from "lucide-react";
import { HospitalAppShell } from "@/components/layout/HospitalAppShell";

export default function HospitalNotificationsPage() {
  const notifications = [
    {
      id: "hosp-1",
      title: "Emergency Availability Status Confirmed",
      body: "Emergency 24x7 trauma facility is active and broadcasted to CareNav emergency map.",
      time: "10 mins ago",
      type: "emergency",
    },
    {
      id: "hosp-2",
      title: "New Doctor Schedule Configured",
      body: "Dr. Ananya Sharma updated consultation availability for Cardiology Clinic.",
      time: "1 hour ago",
      type: "doctor",
    },
    {
      id: "hosp-3",
      title: "Department Peak Load Alert",
      body: "Cardiology outpatient capacity reached 80% utilization for tomorrow.",
      time: "3 hours ago",
      type: "capacity",
    },
    {
      id: "hosp-4",
      title: "Patient Check-in Recorded",
      body: "Arjun Mehta checked in at Main Reception for Cardiology Consultation.",
      time: "Today, 06:15 PM",
      type: "patient",
    },
  ];

  return (
    <HospitalAppShell>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-400" />
            <span>Hospital Operational Notifications</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Realtime administrative alerts, emergency readiness updates, and clinic traffic notices.
          </p>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex items-start gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white">{n.title}</h3>
                  <span className="text-[10px] text-slate-400">{n.time}</span>
                </div>
                <p className="text-xs text-slate-300">{n.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </HospitalAppShell>
  );
}
