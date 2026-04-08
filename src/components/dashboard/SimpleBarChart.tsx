"use client";

import { format, parseISO, getDay } from "date-fns";

export function ThroughputChart({
  data,
}: {
  data: { date: string; created: number; completed: number }[];
}) {
  // Filter out weekends (Saturday = 6, Sunday = 0)
  const weekdays = data.filter((d) => {
    const dow = getDay(parseISO(d.date));
    return dow !== 0 && dow !== 6;
  });

  const maxVal = Math.max(
    ...weekdays.map((d) => Math.max(d.created, d.completed)),
    1
  );

  return (
    <div className="flex items-end gap-2 h-44 overflow-x-auto">
      {weekdays.map((day) => {
        const parsed = parseISO(day.date);
        return (
          <div
            key={day.date}
            className="flex flex-col items-center gap-1 min-w-[3rem] flex-1"
          >
            {/* Numbers above bars */}
            <div className="flex gap-1 text-[10px] tabular-nums text-muted-foreground">
              {day.created > 0 && (
                <span className="text-blue-500">{day.created}</span>
              )}
              {day.completed > 0 && (
                <span className="text-emerald-500">{day.completed}</span>
              )}
            </div>
            {/* Bars */}
            <div className="flex items-end gap-0.5 h-28 w-full">
              <div
                className="flex-1 rounded-t bg-blue-500/70 transition-all duration-300"
                style={{
                  height: `${(day.created / maxVal) * 100}%`,
                  minHeight: day.created > 0 ? "4px" : 0,
                }}
                title={`${day.created} created`}
              />
              <div
                className="flex-1 rounded-t bg-emerald-500/70 transition-all duration-300"
                style={{
                  height: `${(day.completed / maxVal) * 100}%`,
                  minHeight: day.completed > 0 ? "4px" : 0,
                }}
                title={`${day.completed} completed`}
              />
            </div>
            {/* Day label */}
            <div className="text-center">
              <p className="text-[10px] font-medium text-muted-foreground">
                {format(parsed, "EEE")}
              </p>
              <p className="text-[9px] text-muted-foreground/60">
                {format(parsed, "M/d")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DistributionBars({
  data,
  maxVal: maxValOverride,
}: {
  data: { label: string; value: number; color: string }[];
  maxVal?: number;
}) {
  const maxVal = maxValOverride ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-28 text-sm font-medium truncate">
            {item.label}
          </span>
          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / maxVal) * 100}%`,
                backgroundColor: item.color,
                minWidth: item.value > 0 ? "1rem" : 0,
              }}
            />
          </div>
          <span className="w-8 text-sm tabular-nums text-right font-medium">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
