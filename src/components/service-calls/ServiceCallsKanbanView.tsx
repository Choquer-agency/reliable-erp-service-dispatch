"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { type ServiceCallStatus } from "@/lib/statusConfig";
import { KanbanColumn } from "./KanbanColumn";

const KANBAN_STATUSES: ServiceCallStatus[] = [
  "unassigned",
  "assigned",
  "in_progress",
  "on_hold",
  "needs_return",
];

interface ServiceCallsKanbanViewProps {
  grouped: Map<ServiceCallStatus, Doc<"serviceCalls">[]>;
  techMap: Map<string, { name: string; color: string }>;
  onCallClick: (callId: string) => void;
  activeDropColumn?: ServiceCallStatus | null;
}

export function ServiceCallsKanbanView({
  grouped,
  techMap,
  onCallClick,
  activeDropColumn,
}: ServiceCallsKanbanViewProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {KANBAN_STATUSES.map((status) => {
        const calls = grouped.get(status) ?? [];
        return (
          <KanbanColumn
            key={status}
            status={status}
            calls={calls}
            techMap={techMap}
            onCallClick={onCallClick}
            isDropTarget={activeDropColumn === status}
          />
        );
      })}
    </div>
  );
}
