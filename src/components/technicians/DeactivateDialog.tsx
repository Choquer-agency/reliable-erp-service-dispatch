"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface DeactivateDialogProps {
  technicianId: Id<"technicians">;
  technicianName: string;
  activeCallCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateDialog({
  technicianId,
  technicianName,
  activeCallCount,
  open,
  onOpenChange,
}: DeactivateDialogProps) {
  const deactivate = useMutation(api.technicians.deactivate);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeactivate = async () => {
    setIsSubmitting(true);
    try {
      await deactivate({ id: technicianId });
      toast.success(`${technicianName} deactivated`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to deactivate technician");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate {technicianName}?</DialogTitle>
          <DialogDescription>
            This technician will be removed from the dispatch grid. This can be
            reversed later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {activeCallCount > 0 && (
            <div className="flex items-start gap-3 rounded-md border border-orange-200 bg-orange-50 p-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">
                  {activeCallCount} active call{activeCallCount !== 1 ? "s" : ""}
                </p>
                <p className="text-orange-700">
                  These calls will need to be reassigned to another technician.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deactivating..." : "Deactivate"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
