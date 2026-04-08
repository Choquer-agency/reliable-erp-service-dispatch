"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { useGroupedCalls } from "./useGroupedCalls";
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "sonner";

export function useDispatchDnd(
  weekCalls: Doc<"serviceCalls">[] | undefined,
  unassignedCalls: Doc<"serviceCalls">[] | undefined
) {
  const grouped = useGroupedCalls(weekCalls);
  const assignMutation = useMutation(api.serviceCalls.assign);
  const reorderMutation = useMutation(api.serviceCalls.reorder);
  const [activeCall, setActiveCall] = useState<Doc<"serviceCalls"> | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Build a lookup of all calls (week + unassigned) by ID
  const allCalls = [...(weekCalls ?? []), ...(unassignedCalls ?? [])];
  const callById = new Map(allCalls.map((c) => [c._id, c]));

  function handleDragStart(event: DragStartEvent) {
    const call = callById.get(event.active.id as Id<"serviceCalls">);
    setActiveCall(call ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCall(null);
    const { active, over } = event;
    if (!over) return;

    const callId = active.id as Id<"serviceCalls">;
    const call = callById.get(callId);
    if (!call) return;

    const overData = over.data.current;

    // Determine target cell
    let targetTechId: Id<"technicians"> | null = null;
    let targetDate: string | null = null;
    let targetSlot: "am" | "pm" = "am";

    if (overData?.type === "cell") {
      targetTechId = overData.technicianId;
      targetDate = overData.date;
      targetSlot = overData.timeSlot ?? "am";
    } else if (overData?.type === "call") {
      const overCall = overData.call as Doc<"serviceCalls">;
      if (overCall.assignedTechnician && overCall.scheduledDate) {
        targetTechId = overCall.assignedTechnician;
        targetDate = overCall.scheduledDate;
        targetSlot = overCall.timeSlot ?? "am";
      }
    }

    if (!targetTechId || !targetDate) return;

    const sourceSlot = call.timeSlot ?? "am";
    const sourceKey =
      call.assignedTechnician && call.scheduledDate
        ? `${call.assignedTechnician}::${call.scheduledDate}::${sourceSlot}`
        : null;
    const targetKey = `${targetTechId}::${targetDate}::${targetSlot}`;

    // Case: reorder within same cell
    if (sourceKey === targetKey) {
      const cellCalls = grouped.get(targetKey) ?? [];
      const oldIndex = cellCalls.findIndex((c) => c._id === callId);
      const overCallId = over.id as Id<"serviceCalls">;
      const newIndex = cellCalls.findIndex((c) => c._id === overCallId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const reordered = arrayMove(cellCalls, oldIndex, newIndex);
        try {
          await reorderMutation({ callIds: reordered.map((c) => c._id) });
        } catch {
          toast.error("Failed to reorder");
        }
      }
      return;
    }

    // Case: move to different cell (assign or reassign)
    const targetCells = grouped.get(targetKey) ?? [];
    const newOrder = targetCells.length + 1;

    try {
      await assignMutation({
        id: callId,
        technicianId: targetTechId,
        scheduledDate: targetDate,
        callOrder: newOrder,
        timeSlot: targetSlot,
      });
      toast.success("Call assigned");
    } catch {
      toast.error("Failed to assign call");
    }
  }

  return {
    grouped,
    sensors,
    activeCall,
    handleDragStart,
    handleDragEnd,
  };
}
