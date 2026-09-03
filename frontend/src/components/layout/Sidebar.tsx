"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Bot,
  Heart,
  FileText,
  Pill,
  Calendar,
  MapPin,
  Activity,
  Clock,
  Bell,
  Users,
  AlertTriangle,
  Settings,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "AI Assistant", href: "/ai", icon: Bot, highlight: true },
    { label: "Health Records", href: "/health", icon: Heart },
    { label: "Medications", href: "/medications", icon: Pill },
    { label: "Appointments", href: "/appointments", icon: Calendar },
    { label: "Healthcare Map", href: "/map", icon: MapPin, badge: "Map" },
    { label: "Recovery", href: "/recovery", icon: Activity },
    { label: "Health Timeline", href: "/timeline", icon: Clock },
    { label: "Privacy & Consent", href: "/consent", icon: ShieldCheck },
    { label: "Caregivers", href: "/caregivers", icon: Users },
    { label: "Emergency", href: "/emergency", icon: AlertTriangle, emergency: true },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#fffcf7] border-r border-[#d9d1c3] h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#d9d1c3]/60 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#0f6e6e] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            CN
          </div>
          <div>
            <div className="font-semibold text-[1.05rem] tracking-tight text-[#15232b] flex items-center gap-1.5">
              CareNav <span className="text-[#0f6e6e] text-xs font-bold px-1.5 py-0.5 rounded bg-[#e4f2f1]">AI</span>
            </div>
            <div className="text-[0.7rem] text-[#5c6b73] font-medium leading-none">Patient Health Companion</div>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          if (item.emergency) {
            return (
              <div key={item.href} className="pt-2 pb-1">
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? "bg-[#9b2c2c] text-white shadow-sm"
                      : "bg-[#fff1f1] text-[#9b2c2c] hover:bg-[#ffe4e4] border border-[#f5c2c2]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 animate-pulse" />
                  <span className="font-semibold">{item.label}</span>
                  <span className="ml-auto text-[0.65rem] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                    Urgent
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#0f6e6e] text-white shadow-sm font-semibold"
                  : item.highlight
                  ? "text-[#0b4f4f] bg-[#e4f2f1]/60 hover:bg-[#e4f2f1]"
                  : "text-[#15232b] hover:bg-[#f3efe6]/70"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : item.highlight ? "text-[#0f6e6e]" : "text-[#5c6b73]"}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span className={`ml-auto text-[0.7rem] px-1.5 py-0.5 rounded font-medium ${isActive ? "bg-white/20 text-white" : "bg-[#e4f2f1] text-[#0f6e6e]"}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Patient Profile Footer */}
      <div className="p-3 border-t border-[#d9d1c3]/60 bg-[#fbf9f4]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-[#d9d1c3]/60 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-[#0f6e6e]/10 text-[#0f6e6e] font-bold text-xs flex items-center justify-center border border-[#0f6e6e]/20">
            AM
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-[#15232b] truncate">{user?.profile?.full_name || "Arjun Mehta"}</div>
            <div className="text-[0.68rem] text-[#5c6b73] truncate">Demo Patient · 34y · BLR</div>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-500" title="Synthetic profile active" />
        </div>
      </div>
    </aside>
  );
}
