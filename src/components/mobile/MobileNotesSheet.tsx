"use client";

import { Id } from "../../../convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NotesThread } from "@/components/dispatch/NotesThread";

interface MobileNotesSheetProps {
  serviceCallId: Id<"serviceCalls"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileNotesSheet({
  serviceCallId,
  open,
  onOpenChange,
}: MobileNotesSheetProps) {
  if (!serviceCallId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="h-[90vh] rounded-t-2xl flex flex-col pb-[env(safe-area-inset-bottom)]"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-6 pb-2 flex-shrink-0">
          <SheetTitle className="text-lg">Messages</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden px-6 pb-4">
          <NotesThread serviceCallId={serviceCallId} mobile />
        </div>
      </SheetContent>
    </Sheet>
  );
}
