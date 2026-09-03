"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Bot,
  Building2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function HospitalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const navItems = [
    { label: "Appointments", href: "/appointments", icon: Calendar },
    { label: "Patient Reviews", href: "/patients", icon: Users },
    { label: "AI Assistant", href: "/ai", icon: Bot, highlight: true },
  ];

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex flex-col w-60 bg-[#0a192f] text-slate-200 border-r border-slate-800 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand */}
      <div className="p-5 border-b border-slate-800/80">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-900/30 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              CareNav <span className="text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/60">ADMIN</span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Hospital Portal</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-3 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
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
      <div className="p-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">KM</div>
            <div className="min-w-0 truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">Kiran Mehta</p>
              <p className="text-[10px] text-blue-400 truncate">Hospital Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} title="Sign out" className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
