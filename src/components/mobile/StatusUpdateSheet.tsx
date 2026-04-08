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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { type ServiceCallStatus } from "@/lib/statusConfig";

interface StatusUpdateSheetProps {
  call: Doc<"serviceCalls"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FlowState = "actions" | "hold_reason" | "confirm_complete" | "confirm_start";

export function StatusUpdateSheet({
  call,
  open,
  onOpenChange,
}: StatusUpdateSheetProps) {
  const updateStatus = useMutation(api.serviceCalls.updateStatus);
  const updateCall = useMutation(api.serviceCalls.update);
  const createNote = useMutation(api.callNotes.create);

  const [flowState, setFlowState] = useState<FlowState>("actions");
  const [holdReason, setHoldReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const status = (call?.status ?? "unassigned") as ServiceCallStatus;

  const reset = () => {
    setFlowState("actions");
    setHoldReason("");
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

      if (newStatus === "on_hold" && holdReason.trim()) {
        await updateCall({
          id: call._id,
          requiresReturn: true,
          returnReason: holdReason.trim(),
        });
        await createNote({
          serviceCallId: call._id,
          content: holdReason.trim(),
          noteType: "return_required",
        });
      }

      const labels: Record<string, string> = {
        in_progress: "Job started",
        on_hold: "Job put on hold",
        completed: "Job completed",
      };
      toast.success(labels[newStatus] ?? "Status updated");
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
                <Button
                  onClick={() => setFlowState("confirm_start")}
                  disabled={isSubmitting}
                  className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white"
                >
                  Start Job
                </Button>
              )}

              {status === "in_progress" && (
                <>
                  <Button
                    onClick={() => setFlowState("confirm_complete")}
                    disabled={isSubmitting}
                    className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white"
                  >
                    Mark Complete
                  </Button>
                  <Button
                    onClick={() => setFlowState("hold_reason")}
                    disabled={isSubmitting}
                    className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Put On Hold
                  </Button>
                </>
              )}

              {status === "on_hold" && (
                <>
                  <Button
                    onClick={() => setFlowState("confirm_start")}
                    disabled={isSubmitting}
                    className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Resume Job
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

          {/* Hold reason flow */}
          {flowState === "hold_reason" && (
            <>
              <p className="text-sm font-medium">
                Why is this job being put on hold?
              </p>
              <Textarea
                value={holdReason}
                onChange={(e) => setHoldReason(e.target.value)}
                placeholder="e.g. Waiting for parts, need to return with equipment..."
                className="min-h-[100px] text-base"
                autoFocus
              />
              <Button
                onClick={() => handleTransition("on_hold")}
                disabled={isSubmitting || !holdReason.trim()}
                className="w-full min-h-[56px] text-lg font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isSubmitting ? "Updating..." : "Confirm — Put On Hold"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setFlowState("actions");
                  setHoldReason("");
                }}
                className="w-full min-h-[48px]"
              >
                Cancel
              </Button>
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

          {/* Confirm start/resume flow */}
          {flowState === "confirm_start" && (
            <>
              <p className="text-center text-sm font-medium py-2">
                {status === "on_hold" ? "Resume this job?" : "Start this job?"}
              </p>
              <Button
                onClick={() => handleTransition("in_progress")}
                disabled={isSubmitting}
                className={`w-full min-h-[56px] text-lg font-bold rounded-xl text-white ${
                  status === "on_hold"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isSubmitting
                  ? "Updating..."
                  : status === "on_hold"
                    ? "Yes, Resume"
                    : "Yes, Start Job"}
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
        </div>
      </SheetContent>
    </Sheet>
  );
}
