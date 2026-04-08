"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { STATUS_COLORS, type ServiceCallStatus } from "@/lib/statusConfig";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface ServiceCallCardProps {
  call: Doc<"serviceCalls">;
  onClick?: () => void;
  compact?: boolean | "mini";
  draggable?: boolean;
}

export function ServiceCallCard({
  call,
  onClick,
  compact,
  draggable = false,
}: ServiceCallCardProps) {
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
    disabled: !draggable || isCompleted,
    data: {
      type: "call",
      call,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (compact === "mini") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={onClick}
        className={cn(
          "rounded border border-l-[3px] bg-card px-1.5 py-1 cursor-pointer transition-colors hover:bg-accent/50 flex items-start gap-1.5",
          colors.border,
          isCompleted && "opacity-60",
          isDragging && "opacity-40 shadow-lg z-50"
        )}
      >
        {draggable && !isCompleted && (
          <button
            className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground -ml-0.5 shrink-0 mt-0.5"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-muted-foreground">
              {call.rNumber}
            </span>
            {call.priority === "urgent" && (
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
            )}
          </div>
          <p className="text-xs font-medium truncate leading-tight">
            {call.customerName}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "rounded-md border border-l-[3px] bg-card p-2 cursor-pointer transition-colors hover:bg-accent/50",
        colors.border,
        isCompleted && "opacity-60",
        isDragging && "opacity-40 shadow-lg z-50"
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1">
          {draggable && !isCompleted && (
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
      {!compact && (
        <>
          <p className="text-xs text-muted-foreground truncate">
            {call.machineInfo}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {call.complaint}
          </p>
        </>
      )}
    </div>
  );
}

/** Non-draggable version used in DragOverlay and UnassignedPanel */
export function ServiceCallCardOverlay({
  call,
}: {
  call: Doc<"serviceCalls">;
}) {
  const status = call.status as ServiceCallStatus;
  const colors = STATUS_COLORS[status];

  return (
    <div
      className={cn(
        "rounded-md border border-l-[3px] bg-card p-2 shadow-xl w-[180px]",
        colors.border
      )}
    >
      <span className="text-[11px] font-mono text-muted-foreground">
        {call.rNumber}
      </span>
      <p className="text-sm font-semibold truncate leading-tight mt-0.5">
        {call.customerName}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {call.machineInfo}
      </p>
    </div>
  );
}
