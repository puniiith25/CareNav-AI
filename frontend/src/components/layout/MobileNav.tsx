"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bot, Heart, MapPin, Calendar, Menu } from "lucide-react";
import { useState } from "react";

export function MobileNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const mainItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "AI Nav", href: "/ai", icon: Bot },
    { label: "Health", href: "/health", icon: Heart },
    { label: "Map", href: "/map", icon: MapPin },
    { label: "Appts", href: "/appointments", icon: Calendar },
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fffcf7]/95 backdrop-blur-md border-t border-[#d9d1c3] py-1 px-2 flex justify-around items-center">
        {mainItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[0.7rem] font-medium transition-colors ${
                isActive ? "text-[#0f6e6e] font-bold" : "text-[#5c6b73] hover:text-[#15232b]"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-[#0f6e6e]" : "text-[#5c6b73]"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
