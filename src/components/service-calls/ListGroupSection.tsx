"use client";

import { useState } from "react";
import { Doc } from "../../../convex/_generated/dataModel";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type ServiceCallStatus,
} from "@/lib/statusConfig";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceCallRow } from "./ServiceCallRow";

interface ListGroupSectionProps {
  status: ServiceCallStatus;
  calls: Doc<"serviceCalls">[];
  techMap: Map<string, { name: string; color: string }>;
  onCallClick: (callId: string) => void;
  defaultCollapsed?: boolean;
}

export function ListGroupSection({
  status,
  calls,
  techMap,
  onCallClick,
  defaultCollapsed = false,
}: ListGroupSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const colors = STATUS_COLORS[status];

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors hover:opacity-80",
          colors.bg
        )}
      >
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform text-muted-foreground",
            collapsed && "-rotate-90"
          )}
        />
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", colors.dot)} />
        <span className={cn("text-sm font-semibold", colors.text)}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-muted-foreground font-medium ml-1">
          {calls.length}
        </span>
      </button>

      {!collapsed && calls.length > 0 && (
        <div>
          {/* Column headers */}
          <div className="grid grid-cols-[70px_24px_1fr_1fr_1.5fr_130px_90px_50px] gap-3 px-3 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider border-b bg-muted/30">
            <span>R#</span>
            <span />
            <span>Customer</span>
            <span>Equipment</span>
            <span>Complaint</span>
            <span>Technician</span>
            <span>Date</span>
            <span className="text-right">Age</span>
          </div>

          {calls.map((call) => {
            const tech = call.assignedTechnician
              ? techMap.get(call.assignedTechnician)
              : undefined;
            return (
              <ServiceCallRow
                key={call._id}
                call={call}
                techName={tech?.name}
                techColor={tech?.color}
                onClick={() => onCallClick(call._id)}
              />
            );
          })}
        </div>
      )}

      {!collapsed && calls.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No calls
        </div>
      )}
    </div>
  );
}
