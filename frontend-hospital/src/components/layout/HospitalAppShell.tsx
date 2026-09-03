"use client";

import { HospitalSidebar } from "./HospitalSidebar";
import { Building2 } from "lucide-react";

export function HospitalAppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#030712] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      <HospitalSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 bg-slate-950/60">
        {/* Synthetic Banner */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 border-b border-blue-900/40 px-4 py-1.5 text-center text-xs font-medium text-blue-300 flex items-center justify-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Demo Mode — All hospital operational analytics, staff, and facilities are synthetic.</span>
        </div>

        {/* Hospital Topbar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Admin Console</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs text-blue-400 font-medium">Bengaluru Heart & Multispecialty Hospital</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-medium">
              Emergency 24x7 Active
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
