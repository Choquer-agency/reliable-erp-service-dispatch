import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface CallSnapshot {
  _id: string;
  status: string;
  customerName: string;
  rNumber: string;
}

export function useCallNotifications(calls: CallSnapshot[] | undefined) {
  const prevRef = useRef<Map<string, string> | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (calls === undefined) return;

    // Skip the first load to avoid toasting all existing data
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      prevRef.current = new Map(calls.map((c) => [c._id, c.status]));
      return;
    }

    const prev = prevRef.current;
    if (!prev) {
      prevRef.current = new Map(calls.map((c) => [c._id, c.status]));
      return;
    }

    for (const call of calls) {
      const prevStatus = prev.get(call._id);

      // New call appeared
      if (prevStatus === undefined && call.status === "unassigned") {
        toast.info(`New call: ${call.customerName}`, {
          description: call.rNumber,
        });
        continue;
      }

      // Status changed
      if (prevStatus && prevStatus !== call.status) {
        if (call.status === "swap_required" || call.status === "return_with_parts" || call.status === "transfer_to_shop") {
          toast.warning(`${call.rNumber} status changed`, {
            description: call.customerName,
          });
        } else if (call.status === "completed") {
          toast.success(`${call.rNumber} completed`, {
            description: call.customerName,
          });
        }
      }
    }

    prevRef.current = new Map(calls.map((c) => [c._id, c.status]));
  }, [calls]);
}
