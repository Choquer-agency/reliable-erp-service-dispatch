"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Archive,
  Calendar,
  BarChart3,
  Target,
} from "lucide-react";

const dispatcherTabs = [
  { href: "/dashboard", label: "Board", icon: LayoutDashboard },
  { href: "/service-calls", label: "Calls", icon: ClipboardList },
  { href: "/tech-performance", label: "Perf", icon: BarChart3 },
  { href: "/history", label: "History", icon: Archive },
];

const adminTabs = [
  { href: "/dashboard", label: "Board", icon: LayoutDashboard },
  { href: "/service-calls", label: "Calls", icon: ClipboardList },
  { href: "/tech-performance", label: "Perf", icon: BarChart3 },
  { href: "/dispatch-review", label: "Review", icon: Target },
];

const technicianTabs = [
  { href: "/my-schedule", label: "Schedule", icon: Calendar },
];

export function MobileNav() {
  const pathname = usePathname();
  const { role } = useCurrentUser();

  const tabs = role === "technician"
    ? technicianTabs
    : role === "admin"
      ? adminTabs
      : dispatcherTabs;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex md:hidden border-t bg-card pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
              isActive
                ? "text-primary font-medium"
                : "text-muted-foreground"
            }`}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
