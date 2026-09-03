"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Building2,
  Stethoscope,
  Briefcase,
  Layers,
  MapPin,
  Clock,
  BarChart3,
  Bell,
  ShieldCheck,
  Settings,
  LogOut,
  Bot,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function HospitalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const navItems = [
    { label: "Dashboard", href: "/hospital/dashboard", icon: LayoutDashboard },
    { label: "Appointments", href: "/hospital/appointments", icon: Calendar },
    { label: "Patient Flow", href: "/hospital/patients", icon: Users },
    { label: "Doctors", href: "/hospital/doctors", icon: Stethoscope },
    { label: "Departments", href: "/hospital/departments", icon: Building2 },
    { label: "Services", href: "/hospital/services", icon: Briefcase },
    { label: "Facilities", href: "/hospital/facilities", icon: Layers },
    { label: "Hospital Map", href: "/hospital/map", icon: MapPin },
    { label: "Analytics", href: "/hospital/analytics", icon: BarChart3 },
    { label: "Hospital AI", href: "/hospital/ai", icon: Bot, highlight: true },
    { label: "Notifications", href: "/hospital/notifications", icon: Bell },
    { label: "Audit Logs", href: "/hospital/audit", icon: ShieldCheck },
    { label: "Hospital Profile", href: "/hospital/settings/profile", icon: Settings },
  ];

  function handleLogout() {
    logout();
    router.push("/hospital/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0a192f] text-slate-200 border-r border-slate-800 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href="/hospital/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-900/30 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-[1.05rem] tracking-tight text-white flex items-center gap-1.5">
              CareNav <span className="text-blue-400 text-xs font-bold px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/60">ADMIN</span>
            </div>
            <div className="text-[0.7rem] text-slate-400 font-medium leading-none">Hospital Operations</div>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/hospital/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm font-semibold"
                  : item.highlight
                  ? "bg-blue-950/40 text-blue-300 border border-blue-800/50 hover:bg-blue-900/50"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : item.highlight ? "text-blue-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </div>
              {item.highlight && !isActive && (
                <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
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
            <div className="w-7 h-7 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
              KM
            </div>
            <div className="min-w-0 truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">Kiran Mehta</p>
              <p className="text-[10px] text-blue-400 truncate">Hospital Administrator</p>
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
