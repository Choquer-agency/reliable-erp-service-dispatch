"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type ServiceCallStatus,
} from "@/lib/statusConfig";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KanbanCard } from "./KanbanCard";
import { ArrowDown } from "lucide-react";

interface KanbanColumnProps {
  status: ServiceCallStatus;
  calls: Doc<"serviceCalls">[];
  techMap: Map<string, { name: string; color: string }>;
  onCallClick: (callId: string) => void;
  isDropTarget?: boolean;
}

export function KanbanColumn({
  status,
  calls,
  techMap,
  onCallClick,
  isDropTarget = false,
}: KanbanColumnProps) {
  const colors = STATUS_COLORS[status];

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${status}`,
    data: { type: "column", status },
  });

  const highlighted = isOver || isDropTarget;
  const callIds = calls.map((c) => c._id);

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border bg-muted/30 min-w-[280px] max-w-[320px] w-[280px] shrink-0 transition-all duration-200",
        highlighted && "ring-2 ring-primary/50 border-primary/30 bg-primary/[0.03] scale-[1.01]"
      )}
    >
      {/* Column header */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 rounded-t-lg border-b transition-colors duration-200",
          colors.bg,
          highlighted && "brightness-95"
        )}
      >
        <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", colors.dot)} />
        <span className={cn("text-sm font-semibold", colors.text)}>
          {STATUS_LABELS[status]}
        </span>
        <span className="text-xs text-muted-foreground font-medium ml-auto">
          {calls.length}
        </span>
      </div>

      {/* Column body */}
      <div ref={setNodeRef} className="flex-1 min-h-0">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <SortableContext
            items={callIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="p-2 space-y-2">
              {/* Drop placeholder — shown when dragging over this column */}
              {highlighted && (
                <div className="rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-3 flex items-center justify-center gap-2 text-primary/60 text-sm font-medium animate-in fade-in duration-150">
                  <ArrowDown className="h-3.5 w-3.5" />
                  Drop here
                </div>
              )}

              {calls.length === 0 && !highlighted && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No calls
                </p>
              )}
              {calls.map((call) => {
                const tech = call.assignedTechnician
                  ? techMap.get(call.assignedTechnician)
                  : undefined;
                return (
                  <KanbanCard
                    key={call._id}
                    call={call}
                    techName={tech?.name}
                    techColor={tech?.color}
                    onClick={() => onCallClick(call._id)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>
    </div>
  );
}
