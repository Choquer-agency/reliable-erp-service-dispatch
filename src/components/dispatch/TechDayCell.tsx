"use client";

import { useState } from "react";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { ServiceCallCard } from "./ServiceCallCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";

interface TechDayCellProps {
  amCalls: Doc<"serviceCalls">[];
  pmCalls: Doc<"serviceCalls">[];
  technicianId: Id<"technicians">;
  date: string;
  onCallClick: (callId: Id<"serviceCalls">) => void;
  compact?: boolean;
}

export function TechDayCell({
  amCalls,
  pmCalls,
  technicianId,
  date,
  onCallClick,
  compact = false,
}: TechDayCellProps) {
  return (
    <div className="border border-border/50 rounded-md bg-background flex flex-col">
      <SlotDropZone
        calls={amCalls}
        technicianId={technicianId}
        date={date}
        slot="am"
        label="AM"
        onCallClick={onCallClick}
        compact={compact}
      />
      <div className="h-px bg-border/40 mx-1" />
      <SlotDropZone
        calls={pmCalls}
        technicianId={technicianId}
        date={date}
        slot="pm"
        label="PM"
        onCallClick={onCallClick}
        compact={compact}
      />
    </div>
  );
}

interface SlotDropZoneProps {
  calls: Doc<"serviceCalls">[];
  technicianId: Id<"technicians">;
  date: string;
  slot: "am" | "pm";
  label: string;
  onCallClick: (callId: Id<"serviceCalls">) => void;
  compact: boolean;
}

function SlotDropZone({
  calls,
  technicianId,
  date,
  slot,
  label,
  onCallClick,
  compact,
}: SlotDropZoneProps) {
  const cellId = `${technicianId}::${date}::${slot}`;
  const callIds = calls.map((c) => c._id);
  const [expanded, setExpanded] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: cellId,
    data: {
      type: "cell",
      technicianId,
      date,
      timeSlot: slot,
    },
  });

  const maxVisible = compact ? 1 : 2;
  const hasOverflow = !expanded && calls.length > maxVisible;
  const visibleCalls = hasOverflow ? calls.slice(0, maxVisible) : calls;
  const hiddenCount = calls.length - maxVisible;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[44px] flex-1 p-1 transition-colors rounded-sm",
        isOver && "bg-accent/40"
      )}
    >
      <SortableContext items={callIds} strategy={verticalListSortingStrategy}>
        {calls.length === 0 ? (
          <div className="flex items-center justify-center min-h-[36px]">
            <span className="text-[10px] text-muted-foreground/30 uppercase">
              {label}
            </span>
          </div>
        ) : (
          <ScrollArea className={expanded && calls.length > 2 ? "max-h-[120px]" : ""}>
            <div className="space-y-0.5">
              {visibleCalls.map((call) => (
                <ServiceCallCard
                  key={call._id}
                  call={call}
                  draggable
                  compact={compact ? "mini" : "mini"}
                  onClick={() => onCallClick(call._id)}
                />
              ))}
              {hasOverflow && (
                <button
                  className="w-full text-[10px] text-muted-foreground hover:text-foreground py-0.5 text-center rounded hover:bg-accent/50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(true);
                  }}
                >
                  +{hiddenCount} more
                </button>
              )}
            </div>
          </ScrollArea>
        )}
      </SortableContext>
    </div>
  );
}
