"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { UserInfoModal } from "@/components/auth/UserInfoModal";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isCollected = localStorage.getItem("carenav_user_info_collected");
      if (!isCollected) {
        setShowInfoModal(true);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex bg-[#f3efe6] text-[#15232b]">
      {showInfoModal && (
        <UserInfoModal onComplete={() => setShowInfoModal(false)} />
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
