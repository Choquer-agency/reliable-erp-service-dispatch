"use client";

import { useConnectionState } from "@/hooks/useConnectionState";
import { Loader2 } from "lucide-react";

export function ConnectionBanner() {
  const status = useConnectionState();

  if (status === "connected") return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-amber-950 text-sm font-medium text-center py-2 px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top duration-300">
      <Loader2 className="h-4 w-4 animate-spin" />
      {status === "reconnecting" ? "Reconnecting..." : "Connecting..."}
    </div>
  );
}
