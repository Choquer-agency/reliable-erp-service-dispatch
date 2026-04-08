import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { ConnectionBanner } from "@/components/layout/ConnectionBanner";
import { CommandPalette } from "@/components/search/CommandPalette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <ConnectionBanner />
      <Sidebar />
      <main className="md:ml-48 pb-16 md:pb-0">{children}</main>
      <MobileNav />
      <CommandPalette />
    </div>
  );
}
