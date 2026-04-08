"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id, Doc } from "../../../../convex/_generated/dataModel";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { toast } from "sonner";

import {
  STATUS_LABELS,
  type ServiceCallStatus,
} from "@/lib/statusConfig";
import { toISODate } from "@/lib/weekUtils";

import { ServiceCallsToolbar } from "@/components/service-calls/ServiceCallsToolbar";
import { ServiceCallsListView } from "@/components/service-calls/ServiceCallsListView";
import { ServiceCallsKanbanView } from "@/components/service-calls/ServiceCallsKanbanView";
import { AssignmentDialog } from "@/components/service-calls/AssignmentDialog";
import { ServiceCallDetail } from "@/components/dispatch/ServiceCallDetail";
import { ServiceCallCardOverlay } from "@/components/dispatch/ServiceCallCard";
import { AddServiceCallDialog } from "@/components/dispatch/AddServiceCallDialog";
import {
  useServiceCallsKanbanDnd,
  type PendingTransition,
} from "@/hooks/useServiceCallsKanbanDnd";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_ORDER: ServiceCallStatus[] = [
  "unassigned",
  "assigned",
  "in_progress",
  "on_hold",
  "needs_return",
  "completed",
];

function getInitialView(): "list" | "kanban" {
  if (typeof window === "undefined") return "list";
  const stored = localStorage.getItem("service-calls-view");
  return stored === "kanban" ? "kanban" : "list";
}

export default function ServiceCallsPage() {
  const calls = useQuery(api.serviceCalls.list, {});
  const technicians = useQuery(api.technicians.list, { activeOnly: true });

  const assignMutation = useMutation(api.serviceCalls.assign);
  const updateStatusMutation = useMutation(api.serviceCalls.updateStatus);

  const [viewMode, setViewMode] = useState<"list" | "kanban">(getInitialView);
  const [selectedCallId, setSelectedCallId] = useState<Id<"serviceCalls"> | null>(null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Persist view mode
  const handleViewChange = useCallback((view: "list" | "kanban") => {
    setViewMode(view);
    localStorage.setItem("service-calls-view", view);
  }, []);

  // Build tech map for display
  const techMap = useMemo(() => {
    if (!technicians) return new Map<string, { name: string; color: string }>();
    return new Map(
      technicians.map((t) => [t._id, { name: t.name, color: t.color }])
    );
  }, [technicians]);

  // Group calls by status
  const grouped = useMemo(() => {
    const map = new Map<ServiceCallStatus, Doc<"serviceCalls">[]>();
    for (const s of STATUS_ORDER) {
      map.set(s, []);
    }
    if (calls) {
      for (const call of calls) {
        const status = call.status as ServiceCallStatus;
        const bucket = map.get(status);
        if (bucket) bucket.push(call);
      }
    }
    return map;
  }, [calls]);

  // DnD callbacks
  const handleSimpleTransition = useCallback(
    async (callId: Id<"serviceCalls">, newStatus: ServiceCallStatus) => {
      try {
        await updateStatusMutation({ id: callId, status: newStatus });
        toast.success(`Moved to ${STATUS_LABELS[newStatus]}`);
      } catch {
        toast.error("Failed to update status");
      }
    },
    [updateStatusMutation]
  );

  const handleTransitionRequiringData = useCallback(
    (pending: PendingTransition) => {
      setPendingTransition(pending);
    },
    []
  );

  const handleInvalidTransition = useCallback(
    (from: string, to: string) => {
      toast.error(
        `Cannot move from ${STATUS_LABELS[from as ServiceCallStatus] ?? from} to ${STATUS_LABELS[to as ServiceCallStatus] ?? to}`
      );
    },
    []
  );

  const {
    sensors,
    activeCall,
    overColumn,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useServiceCallsKanbanDnd(
    calls,
    handleSimpleTransition,
    handleTransitionRequiringData,
    handleInvalidTransition
  );

  // Assignment dialog confirm
  const handleAssignConfirm = useCallback(
    async (
      technicianId: string,
      scheduledDate: Date,
      callOrder?: number,
      timeSlot?: "am" | "pm"
    ) => {
      if (!pendingTransition) return;
      try {
        await assignMutation({
          id: pendingTransition.call._id,
          technicianId: technicianId as Id<"technicians">,
          scheduledDate: toISODate(scheduledDate),
          callOrder,
          timeSlot,
        });
        toast.success("Call assigned");
      } catch {
        toast.error("Failed to assign call");
      }
      setPendingTransition(null);
    },
    [pendingTransition, assignMutation]
  );

  const handleCallClick = useCallback((callId: string) => {
    setSelectedCallId(callId as Id<"serviceCalls">);
  }, []);

  // Loading state
  if (calls === undefined || technicians === undefined) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <ServiceCallsToolbar
        view={viewMode}
        onViewChange={handleViewChange}
        totalCalls={calls.length}
        onAddCall={() => setAddDialogOpen(true)}
      />

      {viewMode === "kanban" ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <ServiceCallsKanbanView
            grouped={grouped}
            techMap={techMap}
            onCallClick={handleCallClick}
            activeDropColumn={overColumn}
          />
          <DragOverlay dropAnimation={null}>
            {activeCall ? (
              <div className="rotate-[2deg] scale-105">
                <ServiceCallCardOverlay call={activeCall} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <ServiceCallsListView
          grouped={grouped}
          techMap={techMap}
          onCallClick={handleCallClick}
        />
      )}

      {/* Detail sheet */}
      <ServiceCallDetail
        callId={selectedCallId}
        onClose={() => setSelectedCallId(null)}
      />

      {/* Assignment guard rail dialog */}
      <AssignmentDialog
        open={!!pendingTransition}
        call={pendingTransition?.call ?? null}
        technicians={technicians}
        onConfirm={handleAssignConfirm}
        onCancel={() => setPendingTransition(null)}
      />

      {/* Add call dialog */}
      <AddServiceCallDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}
