"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  ClipboardList,
  UserCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { useWeekNavigation } from "@/hooks/useWeekNavigation";
import { useDispatchDnd } from "@/hooks/useDispatchDnd";
import { WeeklyGridToolbar } from "@/components/dispatch/WeeklyGridToolbar";
import { WeeklyGrid } from "@/components/dispatch/WeeklyGrid";
import { UnassignedPanel } from "@/components/dispatch/UnassignedPanel";
import { ServiceCallDetail } from "@/components/dispatch/ServiceCallDetail";
import { ServiceCallCardOverlay } from "@/components/dispatch/ServiceCallCard";
import { AddServiceCallDialog } from "@/components/dispatch/AddServiceCallDialog";
import { useCallNotifications } from "@/hooks/useCallNotifications";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export default function DashboardPage() {
  const {
    weekDates,
    weekStartISO,
    weekEndISO,
    dateRangeLabel,
    prevWeek,
    nextWeek,
    goToToday,
  } = useWeekNavigation();

  const [selectedCallId, setSelectedCallId] = useState<Id<"serviceCalls"> | null>(null);
  const [hideUnassigned, setHideUnassigned] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTechIds, setSelectedTechIds] = useState<Set<string> | null>(null);

  const weekCalls = useQuery(api.serviceCalls.list, {
    scheduledDateStart: weekStartISO,
    scheduledDateEnd: weekEndISO,
  });
  const unassignedCalls = useQuery(api.serviceCalls.list, {
    status: "unassigned",
  });
  const callStats = useQuery(api.serviceCalls.getStats, {});
  const technicians = useQuery(api.technicians.list, { activeOnly: true });

  // Drag-and-drop logic (shared across grid + unassigned panel)
  const { grouped, sensors, activeCall, handleDragStart, handleDragEnd } =
    useDispatchDnd(weekCalls, unassignedCalls);

  // Real-time toast notifications for status changes
  useCallNotifications(weekCalls);

  // Keyboard shortcuts
  const shortcuts = useMemo(
    () => ({ N: () => setShowAddDialog(true) }),
    []
  );
  useKeyboardShortcuts(shortcuts);

  const filteredTechnicians = useMemo(() => {
    if (!technicians) return undefined;
    if (selectedTechIds === null) return technicians;
    return technicians.filter((t) => selectedTechIds.has(t._id));
  }, [technicians, selectedTechIds]);

  const isLoading = callStats === undefined || technicians === undefined;

  const stats = [
    { label: "Total Calls", value: callStats?.total ?? 0, icon: ClipboardList, color: "text-foreground" },
    { label: "Unassigned", value: callStats?.unassigned ?? 0, icon: AlertCircle, color: (callStats?.unassigned ?? 0) > 0 ? "text-orange-500" : "text-foreground" },
    { label: "Scheduled", value: callStats?.assigned ?? 0, icon: UserCheck, color: "text-blue-500" },
    { label: "Completed", value: callStats?.completed ?? 0, icon: CheckCircle, color: "text-green-500" },
  ];

  const hasUnassigned = (unassignedCalls?.length ?? 0) > 0;
  const showPanel = hasUnassigned && !hideUnassigned;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-env(safe-area-inset-bottom))] overflow-hidden">
        {/* Main content column */}
        <div className="flex-1 min-w-0 flex flex-col p-4 md:p-5 gap-3 overflow-hidden">
          {/* Stats Bar */}
          <div className="flex items-center gap-4 shrink-0 px-1">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5">
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className={`text-sm font-semibold ${stat.color}`}>
                  {isLoading ? "–" : stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="shrink-0">
            <WeeklyGridToolbar
              dateRangeLabel={dateRangeLabel}
              unassignedCount={unassignedCalls?.length ?? 0}
              onPrevWeek={prevWeek}
              onNextWeek={nextWeek}
              onToday={goToToday}
              onToggleUnassigned={() => setHideUnassigned((v) => !v)}
              onAddCall={() => setShowAddDialog(true)}
              technicians={technicians}
              selectedTechIds={selectedTechIds}
              onFilterChange={setSelectedTechIds}
            />
          </div>

          {/* Grid */}
          <div className="flex-1 min-h-0">
            <WeeklyGrid
              weekDates={weekDates}
              technicians={filteredTechnicians}
              grouped={grouped}
              onCallClick={(id) => setSelectedCallId(id)}
            />
          </div>
        </div>

        {/* Unassigned panel — persistent right column */}
        {showPanel && (
          <UnassignedPanel
            calls={unassignedCalls ?? []}
            onCallClick={(id) => setSelectedCallId(id)}
            onClose={() => setHideUnassigned(true)}
          />
        )}
      </div>

      {/* Drag overlay (must be inside DndContext, outside scroll containers) */}
      <DragOverlay dropAnimation={null}>
        {activeCall ? <ServiceCallCardOverlay call={activeCall} /> : null}
      </DragOverlay>

      {/* Detail Sheet */}
      <ServiceCallDetail
        callId={selectedCallId}
        onClose={() => setSelectedCallId(null)}
      />

      {/* Add Call Dialog */}
      <AddServiceCallDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </DndContext>
  );
}
