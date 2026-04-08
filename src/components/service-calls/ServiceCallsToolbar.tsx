"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ViewToggle } from "./ViewToggle";

interface ServiceCallsToolbarProps {
  view: "list" | "kanban";
  onViewChange: (view: "list" | "kanban") => void;
  totalCalls: number;
  onAddCall: () => void;
}

export function ServiceCallsToolbar({
  view,
  onViewChange,
  totalCalls,
  onAddCall,
}: ServiceCallsToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Service Calls</h1>
        <Badge variant="secondary" className="text-xs">
          {totalCalls}
        </Badge>
      </div>
      <div className="flex items-center gap-3">
        <ViewToggle view={view} onChange={onViewChange} />
        <Button onClick={onAddCall} size="sm" className="h-8">
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Call
        </Button>
      </div>
    </div>
  );
}
