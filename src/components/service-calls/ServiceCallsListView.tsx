"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { type ServiceCallStatus } from "@/lib/statusConfig";
import { ListGroupSection } from "./ListGroupSection";

const STATUS_ORDER: ServiceCallStatus[] = [
  "unassigned",
  "assigned",
  "swap_required",
  "return_with_parts",
  "transfer_to_shop",
  "billable_to_customer",
  "completed",
];

interface ServiceCallsListViewProps {
  grouped: Map<ServiceCallStatus, Doc<"serviceCalls">[]>;
  techMap: Map<string, { name: string; color: string }>;
  onCallClick: (callId: string) => void;
}

export function ServiceCallsListView({
  grouped,
  techMap,
  onCallClick,
}: ServiceCallsListViewProps) {
  return (
    <div className="space-y-3">
      {STATUS_ORDER.map((status) => {
        const calls = grouped.get(status) ?? [];
        return (
          <ListGroupSection
            key={status}
            status={status}
            calls={calls}
            techMap={techMap}
            onCallClick={onCallClick}
            defaultCollapsed={status === "completed"}
          />
        );
      })}
    </div>
  );
}
