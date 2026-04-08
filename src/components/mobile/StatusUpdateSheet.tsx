"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { STATUS_LABELS, type ServiceCallStatus } from "@/lib/statusConfig";

interface StatusUpdateSheetProps {
  call: Doc<"serviceCalls"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FlowState = "actions" | "confirm_complete" | "confirm_status";

export function StatusUpdateSheet({
  call,
  open,
  onOpenChange,
}: StatusUpdateSheetProps) {
  const updateStatus = useMutation(api.serviceCalls.updateStatus);

  const [flowState, setFlowState] = useState<FlowState>("actions");
  const [pendingStatus, setPendingStatus] = useState<ServiceCallStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status = (call?.status ?? "unassigned") as ServiceCallStatus;

  const reset = () => {
    setFlowState("actions");
    setPendingStatus(null);
    setIsSubmitting(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleTransition = async (newStatus: ServiceCallStatus) => {
    if (!call) return;
    setIsSubmitting(true);
    try {
      await updateStatus({ id: call._id, status: newStatus });
      toast.success("Status updated");
      handleOpenChange(false);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!call) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-6 pb-2">
          <SheetTitle className="text-lg">Update Status</SheetTitle>
          <SheetDescription className="text-sm">
            {call.customerName} — {call.machineInfo}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 pb-4 space-y-3">
          {/* Default: show available actions */}
          {flowState === "actions" && (
            <>
              {status === "assigned" && (
                <>
                  <Button
                    onClick={() => { setPendingStatus("swap_required"); setFlowState("confirm_status"); }}
                    disabled={isSubmitting}
                    className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Unit Swap Required
                  </Button>
                  <Button
                    onClick={() => { setPendingStatus("return_with_parts"); setFlowState("confirm_status"); }}
                    disabled={isSubmitting}
                    className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Need to Return with Parts
                  </Button>
                  <Button
                    onClick={() => { setPendingStatus("transfer_to_shop"); setFlowState("confirm_status"); }}
                    disabled={isSubmitting}
                    className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    Transfer Repair to Shop
                  </Button>
                  <Button
                    onClick={() => { setPendingStatus("billable_to_customer"); setFlowState("confirm_status"); }}
                    disabled={isSubmitting}
                    className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white"
                  >
                    Billable to Customer
                  </Button>
                  <Button
                    onClick={() => setFlowState("confirm_complete")}
                    disabled={isSubmitting}
                    className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white"
                  >
                    Mark Complete
                  </Button>
                </>
              )}

              {(status === "swap_required" || status === "return_with_parts" || status === "transfer_to_shop" || status === "billable_to_customer") && (
                <>
                  <Button
                    onClick={() => { setPendingStatus("assigned"); setFlowState("confirm_status"); }}
                    disabled={isSubmitting}
                    className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Back to Scheduled
                  </Button>
                  <Button
                    onClick={() => setFlowState("confirm_complete")}
                    disabled={isSubmitting}
                    className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white"
                  >
                    Mark Complete
                  </Button>
                </>
              )}

              {status === "completed" && (
                <p className="text-center text-muted-foreground py-4">
                  This job is already completed.
                </p>
              )}
            </>
          )}

          {/* Confirm complete flow */}
          {flowState === "confirm_complete" && (
            <>
              <p className="text-center text-sm font-medium py-2">
                Are you sure? This marks the job as done.
              </p>
              <Button
                onClick={() => handleTransition("completed")}
                disabled={isSubmitting}
                className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? "Completing..." : "Yes, Mark Complete"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setFlowState("actions")}
                className="w-full min-h-[48px]"
              >
                Cancel
              </Button>
            </>
          )}

          {/* Confirm status change flow */}
          {flowState === "confirm_status" && pendingStatus && (
            <>
              <p className="text-center text-sm font-medium py-2">
                Change status to {STATUS_LABELS[pendingStatus]}?
              </p>
              <Button
                onClick={() => handleTransition(pendingStatus)}
                disabled={isSubmitting}
                className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Updating..." : "Yes, Confirm"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => { setFlowState("actions"); setPendingStatus(null); }}
                className="w-full min-h-[48px]"
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
