"use client";

import { DoctorSidebar } from "./DoctorSidebar";
import { TopBar } from "./TopBar";
import { AlertCircle, Stethoscope } from "lucide-react";

export function DoctorAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-white">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 bg-slate-900/50">
        {/* Synthetic Data Banner */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-950 border-b border-teal-900/40 px-4 py-1.5 text-center text-xs font-medium text-teal-300 flex items-center justify-center gap-2">
          <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
          <span>Demo Mode — All patient, doctor, hospital, and medical data is synthetic.</span>
        </div>

        {/* Doctor Header */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clinical Station</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-teal-400 font-medium">Bengaluru Heart & Multispecialty Hospital</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Realtime Queue Active</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
