"use client";

import { useState, useCallback } from "react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import {
  ALLOWED_TRANSITIONS,
  type ServiceCallStatus,
} from "@/lib/statusConfig";
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";

/** Transitions that need extra data before they can execute */
const TRANSITIONS_REQUIRING_DATA: Partial<
  Record<ServiceCallStatus, ServiceCallStatus[]>
> = {
  unassigned: ["assigned"],
};

export interface PendingTransition {
  call: Doc<"serviceCalls">;
  fromStatus: ServiceCallStatus;
  toStatus: ServiceCallStatus;
}

/** Resolve the target status from a drag-over/end event target */
function resolveTargetStatus(
  overData: Record<string, unknown> | undefined
): ServiceCallStatus | null {
  if (!overData) return null;
  if (overData.type === "column") return overData.status as ServiceCallStatus;
  if (overData.type === "call") {
    const overCall = overData.call as Doc<"serviceCalls">;
    return overCall.status as ServiceCallStatus;
  }
  return null;
}

export function useServiceCallsKanbanDnd(
  calls: Doc<"serviceCalls">[] | undefined,
  onSimpleTransition: (callId: Id<"serviceCalls">, newStatus: ServiceCallStatus) => void,
  onTransitionRequiringData: (pending: PendingTransition) => void,
  onInvalidTransition: (from: string, to: string) => void
) {
  const [activeCall, setActiveCall] = useState<Doc<"serviceCalls"> | null>(null);
  const [overColumn, setOverColumn] = useState<ServiceCallStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const callById = new Map((calls ?? []).map((c) => [c._id, c]));

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const call = callById.get(event.active.id as Id<"serviceCalls">);
      setActiveCall(call ?? null);
      setOverColumn(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [calls]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { over } = event;
      if (!over) {
        setOverColumn(null);
        return;
      }
      const targetStatus = resolveTargetStatus(
        over.data.current as Record<string, unknown> | undefined
      );
      setOverColumn(targetStatus);
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCall(null);
      setOverColumn(null);
      const { active, over } = event;
      if (!over) return;

      const callId = active.id as Id<"serviceCalls">;
      const call = callById.get(callId);
      if (!call) return;

      const sourceStatus = call.status as ServiceCallStatus;
      const targetStatus = resolveTargetStatus(
        over.data.current as Record<string, unknown> | undefined
      );

      if (!targetStatus || targetStatus === sourceStatus) return;

      // Validate transition
      const allowed = ALLOWED_TRANSITIONS[sourceStatus];
      if (!allowed.includes(targetStatus)) {
        onInvalidTransition(sourceStatus, targetStatus);
        return;
      }

      // Check if transition needs extra data
      const needsData =
        TRANSITIONS_REQUIRING_DATA[sourceStatus]?.includes(targetStatus);

      if (needsData) {
        onTransitionRequiringData({
          call,
          fromStatus: sourceStatus,
          toStatus: targetStatus,
        });
      } else {
        onSimpleTransition(callId, targetStatus);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [calls, onSimpleTransition, onTransitionRequiringData, onInvalidTransition]
  );

  const handleDragCancel = useCallback(() => {
    setActiveCall(null);
    setOverColumn(null);
  }, []);

  return {
    sensors,
    activeCall,
    overColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
