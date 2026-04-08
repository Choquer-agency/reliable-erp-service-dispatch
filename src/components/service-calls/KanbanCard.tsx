"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { STATUS_COLORS, type ServiceCallStatus } from "@/lib/statusConfig";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface KanbanCardProps {
  call: Doc<"serviceCalls">;
  techName?: string;
  techColor?: string;
  onClick: () => void;
}

export function KanbanCard({
  call,
  techName,
  techColor,
  onClick,
}: KanbanCardProps) {
  const status = call.status as ServiceCallStatus;
  const colors = STATUS_COLORS[status];
  const isCompleted = status === "completed";

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: call._id,
    disabled: isCompleted,
    data: { type: "call", call },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "rounded-md border border-l-[3px] bg-card p-2.5 cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-sm",
        colors.border,
        isCompleted && "opacity-60",
        isDragging && "opacity-20 scale-95 shadow-none border-dashed"
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1">
          {!isCompleted && (
            <button
              className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground -ml-1"
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="text-[11px] font-mono text-muted-foreground">
            {call.rNumber}
          </span>
        </div>
        {call.priority === "urgent" && (
          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0 mt-1" />
        )}
      </div>
      <p className="text-sm font-semibold truncate leading-tight mt-0.5">
        {call.customerName}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {call.machineInfo}
      </p>
      <p className="text-xs text-muted-foreground truncate">{call.complaint}</p>

      {/* Metadata footer */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-border/50">
        {techName ? (
          <span className="flex items-center gap-1 text-xs truncate">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: techColor }}
            />
            <span className="truncate">{techName}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Unassigned</span>
        )}
        {call.scheduledDate && (
          <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
            {new Date(call.scheduledDate + "T00:00:00").toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" }
            )}
          </span>
        )}
      </div>
    </div>
  );
}
