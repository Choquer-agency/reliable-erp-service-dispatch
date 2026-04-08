"use client";

import { useMemo } from "react";
import { Doc } from "../../convex/_generated/dataModel";

type ServiceCall = Doc<"serviceCalls">;

/**
 * Groups service calls by technician + date + time slot.
 * Key format: `${technicianId}::${scheduledDate}::${timeSlot}`
 * Each bucket is sorted by callOrder ascending.
 */
export function useGroupedCalls(
  calls: ServiceCall[] | undefined
): Map<string, ServiceCall[]> {
  return useMemo(() => {
    const map = new Map<string, ServiceCall[]>();
    if (!calls) return map;

    for (const call of calls) {
      if (!call.assignedTechnician || !call.scheduledDate) continue;
      const slot = call.timeSlot ?? "am";
      const key = `${call.assignedTechnician}::${call.scheduledDate}::${slot}`;
      const arr = map.get(key) ?? [];
      arr.push(call);
      map.set(key, arr);
    }

    for (const [, arr] of map) {
      arr.sort((a, b) => (a.callOrder ?? 999) - (b.callOrder ?? 999));
    }

    return map;
  }, [calls]);
}
