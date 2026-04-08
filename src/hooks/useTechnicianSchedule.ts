"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useTechnicianSchedule(
  technicianId: Id<"technicians"> | undefined,
  date: string
) {
  const calls = useQuery(
    api.serviceCalls.list,
    technicianId
      ? { assignedTechnician: technicianId, scheduledDateStart: date, scheduledDateEnd: date }
      : "skip"
  );

  const sorted = calls
    ? [...calls].sort((a, b) => {
        // Completed calls go to the bottom
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        // Then sort by callOrder
        return (a.callOrder ?? 999) - (b.callOrder ?? 999);
      })
    : undefined;

  return {
    calls: sorted,
    isLoading: calls === undefined,
  };
}
