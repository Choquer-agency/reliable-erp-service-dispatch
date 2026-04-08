"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { formatPhone } from "@/lib/phoneFormat";

interface AddServiceCallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddServiceCallDialog({
  open,
  onOpenChange,
}: AddServiceCallDialogProps) {
  const createCall = useMutation(api.serviceCalls.create);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    rNumber: "",
    customerName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    machineInfo: "",
    itemName: "",
    complaint: "",
    address: "",
    city: "",
    postalCode: "",
    locationName: "",
    priority: "normal" as "urgent" | "normal" | "low",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      rNumber: "",
      customerName: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      machineInfo: "",
      itemName: "",
      complaint: "",
      address: "",
      city: "",
      postalCode: "",
      locationName: "",
      priority: "normal",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.machineInfo.trim() || !form.complaint.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await createCall({
        rNumber: form.rNumber || undefined,
        customerName: form.customerName.trim(),
        contactName: form.contactName || undefined,
        contactPhone: form.contactPhone || undefined,
        contactEmail: form.contactEmail || undefined,
        machineInfo: form.machineInfo.trim(),
        itemName: form.itemName || undefined,
        complaint: form.complaint.trim(),
        address: form.address || undefined,
        city: form.city || undefined,
        postalCode: form.postalCode || undefined,
        locationName: form.locationName || undefined,
        priority: form.priority,
      });
      toast.success("Service call created");
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error("Failed to create service call");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Service Call</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">R-Number</Label>
              <Input
                value={form.rNumber}
                onChange={(e) => updateField("rNumber", e.target.value)}
                placeholder="e.g. r52010"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => v && updateField("priority", v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Customer Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
              placeholder="Customer or company name"
              className="h-8 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Contact Name</Label>
              <Input
                value={form.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input
                value={form.contactPhone}
                onChange={(e) => updateField("contactPhone", formatPhone(e.target.value))}
                type="tel"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                value={form.contactEmail}
                onChange={(e) => updateField("contactEmail", e.target.value)}
                type="email"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">
                Machine Info <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.machineInfo}
                onChange={(e) => updateField("machineInfo", e.target.value)}
                placeholder="e.g. GS-2632 #5601"
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Item Name</Label>
              <Input
                value={form.itemName}
                onChange={(e) => updateField("itemName", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Complaint <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={form.complaint}
              onChange={(e) => updateField("complaint", e.target.value)}
              placeholder="Describe the issue..."
              className="text-sm min-h-[80px]"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Address</Label>
              <Input
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">City</Label>
              <Input
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Postal Code</Label>
              <Input
                value={form.postalCode}
                onChange={(e) => updateField("postalCode", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Location Name</Label>
              <Input
                value={form.locationName}
                onChange={(e) => updateField("locationName", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-sm"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="h-9 text-sm">
              {submitting ? "Creating..." : "Create Call"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
