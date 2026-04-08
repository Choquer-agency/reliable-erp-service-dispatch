"use client";

import { useState, useMemo, useCallback } from "react";
import { getMonday, getWeekDates, formatDateRange } from "@/lib/weekUtils";

export function useWeekNavigation() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const weekStartISO = weekDates[0];
  const weekEndISO = weekDates[weekDates.length - 1];
  const dateRangeLabel = useMemo(() => formatDateRange(weekDates), [weekDates]);

  const prevWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const nextWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setWeekStart(getMonday(new Date()));
  }, []);

  return {
    weekStart,
    weekDates,
    weekStartISO,
    weekEndISO,
    dateRangeLabel,
    prevWeek,
    nextWeek,
    goToToday,
  };
}
