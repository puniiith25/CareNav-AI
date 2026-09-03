"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, AlertTriangle, ShieldCheck, Sparkles, X, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import { NotificationItem } from "@/types";

export function TopBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const notifs = await api<NotificationItem[]>("/api/notifications");
        setNotifications(notifs);
      } catch (err) {
        // demo fallback
      }
    }
    loadNotifications();
  }, []);

  async function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const data = await api<{ results: any[] }>(`/api/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data.results || []);
    } catch (err) {
      console.error(err);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <header className="sticky top-0 z-20 bg-[#fffcf7]/90 backdrop-blur-md border-b border-[#d9d1c3] px-4 md:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Synthetic Data Banner Chip */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f3efe6] border border-[#d9d1c3] text-[#5c6b73] text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Demo Mode — Synthetic Healthcare Journey</span>
          </div>
        </div>

        {/* Global Search Button */}
        <div className="flex-1 max-w-md">
          <button
            onClick={() => setShowSearchModal(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-[#f3efe6]/80 hover:bg-[#f3efe6] border border-[#d9d1c3] text-xs md:text-sm text-[#5c6b73] transition-colors"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#5c6b73]" />
              <span className="hidden sm:inline">Search reports, doctors, appointments, medications...</span>
              <span className="sm:hidden">Search records & care...</span>
            </span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[0.65rem] bg-white border border-[#d9d1c3] rounded text-[#5c6b73]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Portal Quick Switchers */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#f3efe6] p-1 rounded-xl border border-[#d9d1c3]">
            <Link
              href="/doctor/dashboard"
              className="px-2.5 py-1 text-xs font-semibold text-[#0f6e6e] hover:bg-white rounded-lg transition-colors"
            >
              Doctor Portal
            </Link>
            <Link
              href="/hospital/dashboard"
              className="px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-white rounded-lg transition-colors"
            >
              Hospital Admin
            </Link>
          </div>

          {/* Emergency Fast Trigger */}
          <Link
            href="/emergency"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#fff1f1] hover:bg-[#ffe4e4] border border-[#f5c2c2] text-[#9b2c2c] text-xs font-semibold transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Emergency</span>
          </Link>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDrawer(!showNotifDrawer)}
              className="relative p-2 rounded-xl text-[#5c6b73] hover:text-[#15232b] hover:bg-[#f3efe6] transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0f6e6e] rounded-full" />
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {showNotifDrawer && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#fffcf7] border border-[#d9d1c3] rounded-2xl shadow-xl z-50 p-4 animate-in fade-in-50 slide-in-from-top-2">
                <div className="flex items-center justify-between pb-3 border-b border-[#d9d1c3]">
                  <div className="font-semibold text-sm text-[#15232b]">Notifications</div>
                  <span className="text-xs text-[#5c6b73]">{notifications.length} recent</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-[#d9d1c3]/50 py-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#5c6b73]">No notifications right now.</div>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="py-2.5 flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#0f6e6e] mt-1.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-[#15232b]">{n.title}</div>
                          <div className="text-xs text-[#5c6b73] mt-0.5">{n.body}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="pt-2 border-t border-[#d9d1c3]">
                  <Link
                    href="/settings"
                    onClick={() => setShowNotifDrawer(false)}
                    className="block text-center text-xs text-[#0f6e6e] font-semibold hover:underline"
                  >
                    Manage Notification Settings
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-xl bg-[#fffcf7] rounded-2xl border border-[#d9d1c3] shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95">
            <div className="p-4 border-b border-[#d9d1c3] flex items-center gap-3">
              <Search className="w-5 h-5 text-[#0f6e6e]" />
              <input
                type="text"
                autoFocus
                placeholder="Search cardiology, blood report, Dr. Sharma, medications..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm md:text-base outline-none text-[#15232b] placeholder-[#5c6b73]"
              />
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery("");
                }}
                className="p-1 rounded-lg text-[#5c6b73] hover:bg-[#f3efe6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-3">
              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((res, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowSearchModal(false);
                        router.push(res.href);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-[#f3efe6] flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#0f6e6e]">{res.type}</div>
                        <div className="text-sm font-semibold text-[#15232b]">{res.title}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#5c6b73]" />
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="py-8 text-center text-sm text-[#5c6b73]">No matching health records or providers found.</div>
              ) : (
                <div className="py-4 text-xs text-[#5c6b73] space-y-2">
                  <div className="font-semibold text-[#15232b]">Suggested searches:</div>
                  <div className="flex flex-wrap gap-2">
                    {["Cardiology", "Complete Blood Count", "Dr. Ananya Sharma", "Atorvastatin", "Recovery plan"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleSearch(tag)}
                        className="px-2.5 py-1 rounded-lg bg-[#f3efe6] border border-[#d9d1c3] hover:bg-[#e4f2f1] text-[#15232b] transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
