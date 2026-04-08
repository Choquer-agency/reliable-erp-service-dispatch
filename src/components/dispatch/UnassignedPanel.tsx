"use client";

import { Doc, Id } from "../../../convex/_generated/dataModel";
import { ServiceCallCard } from "./ServiceCallCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";
import { daysSince } from "@/lib/weekUtils";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface UnassignedPanelProps {
  calls: Doc<"serviceCalls">[];
  onCallClick: (callId: Id<"serviceCalls">) => void;
  onClose: () => void;
}

export function UnassignedPanel({
  calls,
  onCallClick,
  onClose,
}: UnassignedPanelProps) {
  const sorted = [...calls].sort((a, b) =>
    a.dateOpened.localeCompare(b.dateOpened)
  );
  const callIds = sorted.map((c) => c._id);

  return (
    <div className="w-[280px] shrink-0 border-l bg-muted/40 flex flex-col">
      <div className="flex items-center justify-between p-3 border-b bg-muted/60">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Unassigned</h3>
          <Badge variant="secondary" className="text-xs">
            {calls.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          <SortableContext items={callIds} strategy={verticalListSortingStrategy}>
            {sorted.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                All caught up! No unassigned calls.
              </div>
            ) : (
              sorted.map((call) => (
                <div key={call._id} className="relative">
                  <ServiceCallCard
                    call={call}
                    draggable
                    onClick={() => onCallClick(call._id)}
                  />
                  <div className="flex items-center gap-1.5 px-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">
                      {daysSince(call.dateOpened) === 0
                        ? "Opened today"
                        : `${daysSince(call.dateOpened)}d ago`}
                    </span>
                    {call.priority === "urgent" && (
                      <Badge
                        variant="destructive"
                        className="text-[10px] px-1 py-0"
                      >
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
