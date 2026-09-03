"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Clock,
  FileText,
  Stethoscope,
  Pill,
  RotateCcw,
  Activity,
  Bot,
  Bell,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function DoctorSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { label: "Patients", href: "/doctor/patients", icon: Users },
    { label: "Appointments", href: "/doctor/appointments", icon: Calendar },
    { label: "Schedule", href: "/doctor/schedule", icon: Clock },
    { label: "Reports", href: "/doctor/reports", icon: FileText },
    { label: "Consultations", href: "/doctor/consultations", icon: Stethoscope },
    { label: "Prescriptions", href: "/doctor/prescriptions/new", icon: Pill },
    { label: "Follow-ups", href: "/doctor/followups", icon: RotateCcw },
    { label: "Recovery Plans", href: "/doctor/recovery", icon: Activity },
    { label: "AI Assistant", href: "/doctor/ai", icon: Bot, highlight: true },
    { label: "Notifications", href: "/doctor/notifications", icon: Bell },
    { label: "Audit Activity", href: "/doctor/audit", icon: ShieldCheck },
    { label: "Settings", href: "/doctor/settings", icon: Settings },
  ];

  function handleLogout() {
    logout();
    router.push("/doctor/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0f172a] text-slate-200 border-r border-slate-800 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/doctor/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-teal-900/30 group-hover:scale-105 transition-transform">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-[1.05rem] tracking-tight text-white flex items-center gap-1.5">
              CareNav <span className="text-teal-400 text-xs font-bold px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-800/60">MD</span>
            </div>
            <div className="text-[0.7rem] text-slate-400 font-medium leading-none">Doctor Clinical Portal</div>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/doctor/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-teal-600 text-white shadow-sm font-semibold"
                  : item.highlight
                  ? "bg-teal-950/40 text-teal-300 border border-teal-800/50 hover:bg-teal-900/50"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : item.highlight ? "text-teal-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.highlight && !isActive && (
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded">
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
              AS
            </div>
            <div className="min-w-0 truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">Dr. Ananya Sharma</p>
              <p className="text-[10px] text-teal-400 truncate">Cardiology Specialist</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
