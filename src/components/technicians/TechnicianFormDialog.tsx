"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { formatPhone } from "@/lib/phoneFormat";

const PRESET_COLORS = [
  { label: "Blue", value: "#3B82F6" },
  { label: "Green", value: "#10B981" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Red", value: "#EF4444" },
  { label: "Teal", value: "#14B8A6" },
  { label: "Indigo", value: "#6366F1" },
  { label: "Pink", value: "#EC4899" },
  { label: "Orange", value: "#F97316" },
  { label: "Cyan", value: "#06B6D4" },
];

interface TechnicianFormDialogProps {
  mode: "add" | "edit";
  technician?: Doc<"technicians">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TechnicianFormDialog({
  mode,
  technician,
  open,
  onOpenChange,
}: TechnicianFormDialogProps) {
  const createTech = useMutation(api.technicians.create);
  const updateTech = useMutation(api.technicians.update);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && mode === "edit" && technician) {
      setName(technician.name);
      setPhone(formatPhone(technician.phone));
      setEmail(technician.email ?? "");
      setColor(technician.color);
    } else if (open && mode === "add") {
      setName("");
      setPhone("");
      setEmail("");
      setColor(PRESET_COLORS[0].value);
    }
  }, [open, mode, technician]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setIsSubmitting(true);
    try {
      if (mode === "add") {
        await createTech({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          isActive: true,
          color,
        });
        toast.success(`${name.trim()} added`);
      } else if (technician) {
        await updateTech({
          id: technician._id,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          color,
        });
        toast.success(`${name.trim()} updated`);
      }
      onOpenChange(false);
    } catch {
      toast.error(mode === "add" ? "Failed to add technician" : "Failed to update technician");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Add Technician" : `Edit ${technician?.name}`}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add a new technician to the dispatch board."
              : "Update technician details."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="tech-name">Name *</Label>
            <Input
              id="tech-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tech-phone">Phone *</Label>
            <Input
              id="tech-phone"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="604-555-1234"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tech-email">Email</Label>
            <Input
              id="tech-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className="h-8 w-8 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    borderColor: color === c.value ? "currentColor" : "transparent",
                  }}
                  title={c.label}
                >
                  {color === c.value && (
                    <Check className="h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || !name.trim() || !phone.trim()} className="w-full">
            {isSubmitting
              ? mode === "add" ? "Adding..." : "Saving..."
              : mode === "add" ? "Add Technician" : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
