"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link2, Unlink } from "lucide-react";

interface LinkAccountDialogProps {
  technicianId: Id<"technicians">;
  technicianName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LinkAccountDialog({
  technicianId,
  technicianName,
  open,
  onOpenChange,
}: LinkAccountDialogProps) {
  const linkableUsers = useQuery(api.users.listLinkable);
  const linkedUser = useQuery(api.users.getLinkedUser, { technicianId });
  const linkMutation = useMutation(api.users.linkTechnician);
  const unlinkMutation = useMutation(api.users.unlinkTechnician);

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLink = async () => {
    if (!selectedUserId) return;
    setIsSubmitting(true);
    try {
      await linkMutation({
        userId: selectedUserId as Id<"users">,
        technicianId,
      });
      toast.success(`Account linked to ${technicianName}`);
      setSelectedUserId("");
      onOpenChange(false);
    } catch {
      toast.error("Failed to link account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async () => {
    if (!linkedUser) return;
    setIsSubmitting(true);
    try {
      await unlinkMutation({ userId: linkedUser._id });
      toast.success(`Account unlinked from ${technicianName}`);
    } catch {
      toast.error("Failed to unlink account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Account — {technicianName}</DialogTitle>
          <DialogDescription>
            Link a user account so this technician can log in and see their
            schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Currently linked */}
          {linkedUser && (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">{linkedUser.name}</p>
                <p className="text-xs text-muted-foreground">
                  {linkedUser.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUnlink}
                disabled={isSubmitting}
                className="gap-1 text-muted-foreground"
              >
                <Unlink className="h-3.5 w-3.5" />
                Unlink
              </Button>
            </div>
          )}

          {/* Link a new account */}
          {!linkedUser && (
            <>
              {linkableUsers && linkableUsers.length > 0 ? (
                <div className="space-y-3">
                  <Select
                    value={selectedUserId}
                    onValueChange={(v) => v && setSelectedUserId(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user account" />
                    </SelectTrigger>
                    <SelectContent>
                      {linkableUsers.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleLink}
                    disabled={!selectedUserId || isSubmitting}
                    className="w-full gap-1"
                  >
                    <Link2 className="h-4 w-4" />
                    {isSubmitting ? "Linking..." : "Link Account"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No unlinked user accounts available. The technician needs to
                  sign up first.
                </p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
