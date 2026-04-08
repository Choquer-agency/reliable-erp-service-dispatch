"use client";

import { Doc, Id } from "../../../convex/_generated/dataModel";
import { TechDayCell } from "./TechDayCell";
import { dayLabel } from "@/lib/weekUtils";
import { Badge } from "@/components/ui/badge";

interface WeeklyGridProps {
  weekDates: string[];
  technicians: Doc<"technicians">[] | undefined;
  grouped: Map<string, Doc<"serviceCalls">[]>;
  onCallClick: (callId: Id<"serviceCalls">) => void;
}

export function WeeklyGrid({
  weekDates,
  technicians,
  grouped,
  onCallClick,
}: WeeklyGridProps) {
  if (!technicians) {
    return <WeeklyGridSkeleton dayCount={weekDates.length} />;
  }

  if (technicians.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No active technicians. Add technicians to start dispatching.
      </div>
    );
  }

  const dayCount = weekDates.length;
  const useCompact = technicians.length > 12;

  // Count calls per technician for the week
  const techWeekCounts = new Map<string, number>();
  for (const tech of technicians) {
    let count = 0;
    for (const date of weekDates) {
      count += (grouped.get(`${tech._id}::${date}::am`) ?? []).length;
      count += (grouped.get(`${tech._id}::${date}::pm`) ?? []).length;
    }
    techWeekCounts.set(tech._id, count);
  }

  return (
    <div className="overflow-auto h-full">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `110px repeat(${dayCount}, minmax(130px, 1fr))`,
          gridTemplateRows: `auto repeat(${technicians.length}, minmax(90px, 1fr))`,
          gap: "4px",
          minHeight: "100%",
        }}
      >
        {/* Header row: empty corner + day labels */}
        <div className="sticky top-0 left-0 z-20 bg-background" />
        {weekDates.map((date) => (
          <div
            key={`header-${date}`}
            className="sticky top-0 z-10 bg-background flex items-center justify-center px-2 py-2 rounded-md border border-border/50"
          >
            <span className="text-xs font-medium text-center leading-tight">
              {dayLabel(date)}
            </span>
          </div>
        ))}

        {/* Technician rows */}
        {technicians.map((tech) => {
          const weekCount = techWeekCounts.get(tech._id) ?? 0;
          const nameParts = tech.name.trim().split(/\s+/);
          const firstName = nameParts[0];
          const lastName = nameParts.slice(1).join(" ");

          return (
            <div key={tech._id} className="contents">
              {/* Technician name cell */}
              <div
                className="sticky left-0 z-[5] bg-background flex items-center gap-1.5 px-2 py-1.5 rounded-md border border-border/50"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: tech.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium leading-tight truncate">
                    {firstName}
                  </p>
                  {lastName && (
                    <p className="text-xs font-medium leading-tight truncate text-muted-foreground">
                      {lastName}
                    </p>
                  )}
                </div>
                {weekCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1 py-0 shrink-0"
                  >
                    {weekCount}
                  </Badge>
                )}
              </div>

              {/* Day cells for this technician */}
              {weekDates.map((date) => {
                const amCalls =
                  grouped.get(`${tech._id}::${date}::am`) ?? [];
                const pmCalls =
                  grouped.get(`${tech._id}::${date}::pm`) ?? [];
                return (
                  <TechDayCell
                    key={`${tech._id}::${date}`}
                    amCalls={amCalls}
                    pmCalls={pmCalls}
                    technicianId={tech._id}
                    date={date}
                    onCallClick={onCallClick}
                    compact={useCompact}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyGridSkeleton({ dayCount = 5 }: { dayCount?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `110px repeat(${dayCount}, minmax(130px, 1fr))`,
        gap: "4px",
      }}
    >
      {/* Header row */}
      <div className="h-10" />
      {Array.from({ length: dayCount }).map((_, i) => (
        <div key={i} className="h-10 bg-muted/50 rounded-md animate-pulse" />
      ))}
      {/* 4 skeleton tech rows */}
      {Array.from({ length: 4 }).map((_, row) => (
        <div key={row} className="contents">
          <div className="h-16 bg-muted/30 rounded-md animate-pulse" />
          {Array.from({ length: dayCount }).map((_, col) => (
            <div
              key={col}
              className="h-16 bg-muted/50 rounded-md animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
