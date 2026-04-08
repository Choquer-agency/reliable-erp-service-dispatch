"use client";

import { useState } from "react";
import { Doc } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

interface AssignmentDialogProps {
  open: boolean;
  call: Doc<"serviceCalls"> | null;
  technicians: Doc<"technicians">[];
  onConfirm: (
    technicianId: string,
    scheduledDate: Date,
    callOrder?: number,
    timeSlot?: "am" | "pm"
  ) => void;
  onCancel: () => void;
}

export function AssignmentDialog({
  open,
  call,
  technicians,
  onConfirm,
  onCancel,
}: AssignmentDialogProps) {
  const [techId, setTechId] = useState("");
  const [date, setDate] = useState<Date | undefined>();
  const [order, setOrder] = useState("");
  const [timeSlot, setTimeSlot] = useState<"am" | "pm" | "">("");

  const handleConfirm = () => {
    if (!techId || !date) return;
    onConfirm(
      techId,
      date,
      order ? parseInt(order) : undefined,
      timeSlot ? (timeSlot as "am" | "pm") : undefined
    );
    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const resetForm = () => {
    setTechId("");
    setDate(undefined);
    setOrder("");
    setTimeSlot("");
  };

  if (!call) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Service Call</DialogTitle>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{call.rNumber}</span> &mdash;{" "}
            {call.customerName}
          </p>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="text-xs">
              Technician <span className="text-red-500">*</span>
            </Label>
            <Select value={techId} onValueChange={(v) => v && setTechId(v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select technician" />
              </SelectTrigger>
              <SelectContent>
                {technicians.map((tech) => (
                  <SelectItem key={tech._id} value={tech._id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tech.color }}
                      />
                      {tech.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Scheduled Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger className="inline-flex items-center justify-start h-8 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground hover:bg-accent hover:text-accent-foreground">
                <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                {date
                  ? date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })
                  : "Select a date"}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Time Slot</Label>
              <Select
                value={timeSlot}
                onValueChange={(v) => setTimeSlot(v as "am" | "pm" | "")}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="am">AM</SelectItem>
                  <SelectItem value="pm">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Call Order</Label>
              <Input
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="e.g. 1"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            className="h-9 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!techId || !date}
            className="h-9 text-sm"
          >
            Assign & Move
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
