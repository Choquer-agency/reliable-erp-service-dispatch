"use client";

import { Doc, Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Inbox, Users } from "lucide-react";

interface WeeklyGridToolbarProps {
  dateRangeLabel: string;
  unassignedCount: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onToggleUnassigned: () => void;
  onAddCall: () => void;
  technicians?: Doc<"technicians">[];
  selectedTechIds: Set<string> | null;
  onFilterChange: (techIds: Set<string> | null) => void;
}

export function WeeklyGridToolbar({
  dateRangeLabel,
  unassignedCount,
  onPrevWeek,
  onNextWeek,
  onToday,
  onToggleUnassigned,
  onAddCall,
  technicians,
  selectedTechIds,
  onFilterChange,
}: WeeklyGridToolbarProps) {
  const allSelected = selectedTechIds === null;
  const filterCount = selectedTechIds?.size ?? 0;

  function toggleTech(techId: string) {
    if (!technicians) return;

    if (allSelected) {
      // Switch from "all" to "all except this one"
      const newSet = new Set(technicians.map((t) => t._id as string));
      newSet.delete(techId);
      onFilterChange(newSet);
    } else {
      const newSet = new Set(selectedTechIds);
      if (newSet.has(techId)) {
        newSet.delete(techId);
        if (newSet.size === 0) {
          // Don't allow empty — revert to all
          onFilterChange(null);
          return;
        }
      } else {
        newSet.add(techId);
      }
      // If all are selected, switch back to null (all)
      if (technicians && newSet.size === technicians.length) {
        onFilterChange(null);
      } else {
        onFilterChange(newSet);
      }
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevWeek}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[180px] text-center">
          {dateRangeLabel}
        </h2>
        <Button variant="outline" size="icon" onClick={onNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onToday}>
          Today
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {technicians && technicians.length > 5 && (
          <Popover>
            <PopoverTrigger
              className="inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground h-8 px-3 cursor-pointer"
            >
              <Users className="h-4 w-4" />
              Technicians
              {!allSelected && (
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                  {filterCount}
                </Badge>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="space-y-1">
                <button
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
                  onClick={() => onFilterChange(null)}
                >
                  <Checkbox checked={allSelected} />
                  <span className="font-medium">All Technicians</span>
                </button>
                <div className="h-px bg-border my-1" />
                {technicians.map((tech) => {
                  const isChecked = allSelected || selectedTechIds?.has(tech._id) || false;
                  return (
                    <button
                      key={tech._id}
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md hover:bg-accent transition-colors"
                      onClick={() => toggleTech(tech._id)}
                    >
                      <Checkbox checked={isChecked} />
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tech.color }}
                      />
                      <span className="truncate">{tech.name}</span>
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onToggleUnassigned}
          className="gap-1.5"
        >
          <Inbox className="h-4 w-4" />
          Unassigned
          {unassignedCount > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0">
              {unassignedCount}
            </Badge>
          )}
        </Button>
        <Button size="sm" onClick={onAddCall} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Call
        </Button>
      </div>
    </div>
  );
}
