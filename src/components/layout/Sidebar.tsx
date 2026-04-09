"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Upload,
  Calendar,
  Archive,
  LogOut,
  BarChart3,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const dispatcherLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/service-calls", label: "Service Calls", icon: ClipboardList },
  { href: "/technicians", label: "Technicians", icon: Users },
  { href: "/tech-performance", label: "Tech Performance", icon: BarChart3 },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/history", label: "History", icon: Archive },
];

const adminOnlyLinks = [
  { href: "/dispatch-review", label: "Dispatch Review", icon: Target },
];

const technicianLinks = [
  { href: "/my-schedule", label: "My Schedule", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, role } = useCurrentUser();
  const { signOut } = useAuthActions();

  const stats = useQuery(api.serviceCalls.getStats, role === "technician" ? "skip" : {});
  const links = role === "technician"
    ? technicianLinks
    : role === "admin"
      ? [...dispatcherLinks, ...adminOnlyLinks]
      : dispatcherLinks;

  return (
    <aside className="hidden md:flex md:flex-col md:w-48 md:fixed md:inset-y-0 border-r bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center justify-center px-3">
        <Image
          src="/logo.avif"
          alt="Reliable Equipment Rentals"
          width={150}
          height={48}
          className="h-9 w-auto"
          priority
        />
      </div>
      <Separator className="bg-sidebar-border" />
      <nav className="flex-1 space-y-1 px-2 py-4">
        {links.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
              {link.href === "/dashboard" &&
                stats &&
                stats.unassigned > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                    {stats.unassigned}
                  </span>
                )}
            </Link>
          );
        })}
      </nav>
      <Separator className="bg-sidebar-border" />
      <div className="p-4">
        <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.name ?? "Loading..."}</p>
        <p className="text-xs text-sidebar-foreground/50 capitalize">{role}</p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
