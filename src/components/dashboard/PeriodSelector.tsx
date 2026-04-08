"use client";

import { useState, useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  format,
} from "date-fns";

type PeriodKey = "this-week" | "last-week" | "this-month" | "last-month" | "custom";

const periodLabels: Record<PeriodKey, string> = {
  "this-week": "This Week",
  "last-week": "Last Week",
  "this-month": "This Month",
  "last-month": "Last Month",
  custom: "Custom",
};

export function usePeriod(defaultPeriod: PeriodKey = "this-week") {
  const [period, setPeriod] = useState<PeriodKey>(defaultPeriod);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { dateFrom, dateTo } = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "this-week":
        return {
          dateFrom: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          dateTo: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      case "last-week": {
        const lastWeek = subWeeks(now, 1);
        return {
          dateFrom: format(startOfWeek(lastWeek, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          dateTo: format(endOfWeek(lastWeek, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      }
      case "this-month":
        return {
          dateFrom: format(startOfMonth(now), "yyyy-MM-dd"),
          dateTo: format(endOfMonth(now), "yyyy-MM-dd"),
        };
      case "last-month": {
        const lastMonth = subMonths(now, 1);
        return {
          dateFrom: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
          dateTo: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
        };
      }
      case "custom":
        return {
          dateFrom: customFrom || format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          dateTo: customTo || format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
    }
  }, [period, customFrom, customTo]);

  return { period, setPeriod, dateFrom, dateTo, customFrom, setCustomFrom, customTo, setCustomTo };
}

export function PeriodSelector({
  period,
  setPeriod,
  customFrom,
  setCustomFrom,
  customTo,
  setCustomTo,
}: {
  period: PeriodKey;
  setPeriod: (p: PeriodKey) => void;
  customFrom: string;
  setCustomFrom: (v: string) => void;
  customTo: string;
  setCustomTo: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-lg border border-input bg-card p-0.5">
        {(Object.keys(periodLabels) as PeriodKey[]).map((key) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              period === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {periodLabels[key]}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs"
          />
        </div>
      )}
    </div>
  );
}
