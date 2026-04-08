"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useNoteCount(serviceCallId: Id<"serviceCalls">): number {
  const notes = useQuery(api.callNotes.listByServiceCall, { serviceCallId });
  return notes?.length ?? 0;
}
