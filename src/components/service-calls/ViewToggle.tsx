"use client";

import { List, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  view: "list" | "kanban";
  onChange: (view: "list" | "kanban") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center rounded-md border bg-muted p-0.5">
      <button
        onClick={() => onChange("list")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-sm font-medium transition-colors",
          view === "list"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="h-3.5 w-3.5" />
        List
      </button>
      <button
        onClick={() => onChange("kanban")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-sm font-medium transition-colors",
          view === "kanban"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Columns3 className="h-3.5 w-3.5" />
        Board
      </button>
    </div>
  );
}
