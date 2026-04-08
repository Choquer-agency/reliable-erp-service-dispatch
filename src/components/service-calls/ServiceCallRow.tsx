"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { STATUS_COLORS, type ServiceCallStatus } from "@/lib/statusConfig";
import { cn } from "@/lib/utils";
import { daysSince } from "@/lib/weekUtils";

interface ServiceCallRowProps {
  call: Doc<"serviceCalls">;
  techName?: string;
  techColor?: string;
  onClick: () => void;
}

export function ServiceCallRow({
  call,
  techName,
  techColor,
  onClick,
}: ServiceCallRowProps) {
  const status = call.status as ServiceCallStatus;
  const colors = STATUS_COLORS[status];
  const age = daysSince(call.dateOpened);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50 border-b border-border/50 last:border-b-0",
        "grid-cols-[70px_24px_1fr_1fr_1.5fr_130px_90px_50px]"
      )}
    >
      <span className="font-mono text-xs text-muted-foreground truncate">
        {call.rNumber}
      </span>

      <span className="flex justify-center">
        {call.priority === "urgent" && (
          <span className="h-2 w-2 rounded-full bg-red-500" />
        )}
      </span>

      <span className="font-medium truncate">{call.customerName}</span>

      <span className="text-muted-foreground truncate">{call.machineInfo}</span>

      <span className="text-muted-foreground truncate">{call.complaint}</span>

      <span className="flex items-center gap-1.5 truncate">
        {techName ? (
          <>
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: techColor }}
            />
            <span className="truncate">{techName}</span>
          </>
        ) : (
          <span className="text-muted-foreground">---</span>
        )}
      </span>

      <span className="text-xs text-muted-foreground">
        {call.scheduledDate
          ? new Date(call.scheduledDate + "T00:00:00").toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" }
            )
          : "---"}
      </span>

      <span className="text-xs text-muted-foreground text-right">
        {age > 0 ? `${age}d` : "today"}
      </span>
    </button>
  );
}
