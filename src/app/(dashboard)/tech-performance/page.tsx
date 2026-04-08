"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { redirect } from "next/navigation";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PeriodSelector, usePeriod } from "@/components/dashboard/PeriodSelector";
import { DistributionBars } from "@/components/dashboard/SimpleBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, AlertTriangle } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/statusConfig";

function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function rateColor(rate: number, invert = false): "green" | "yellow" | "red" {
  if (invert) {
    if (rate <= 5) return "green";
    if (rate <= 15) return "yellow";
    return "red";
  }
  if (rate >= 80) return "green";
  if (rate >= 60) return "yellow";
  return "red";
}

/** Compact row showing a metric across time periods */
function TallyRow({
  label,
  today,
  thisWeek,
  thisMonth,
  thisYear,
  accent = "default",
}: {
  label: string;
  today: number;
  thisWeek?: number;
  thisMonth: number;
  thisYear?: number;
  accent?: "default" | "red" | "amber";
}) {
  const textClass =
    accent === "red"
      ? "text-red-600 dark:text-red-400"
      : accent === "amber"
        ? "text-amber-600 dark:text-amber-400"
        : "text-foreground";
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-b-0">
      <span className={`text-sm font-medium ${accent !== "default" ? textClass : ""}`}>
        {label}
      </span>
      <div className="flex items-center gap-6">
        <div className="text-center min-w-[48px]">
          <p className={`text-lg font-bold tabular-nums leading-none ${textClass}`}>{today}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Today</p>
        </div>
        {thisWeek !== undefined && (
          <div className="text-center min-w-[48px]">
            <p className={`text-lg font-bold tabular-nums leading-none ${textClass}`}>{thisWeek}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Week</p>
          </div>
        )}
        <div className="text-center min-w-[48px]">
          <p className={`text-lg font-bold tabular-nums leading-none ${textClass}`}>{thisMonth}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Month</p>
        </div>
        {thisYear !== undefined && (
          <div className="text-center min-w-[48px]">
            <p className={`text-lg font-bold tabular-nums leading-none ${textClass}`}>{thisYear}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Year</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TechPerformancePage() {
  const { role } = useCurrentUser();
  if (role === "technician") redirect("/my-schedule");

  const periodState = usePeriod("this-week");
  const { dateFrom, dateTo } = periodState;

  const performance = useQuery(api.dashboardMetrics.technicianPerformance, {
    dateFrom,
    dateTo,
  });
  const workload = useQuery(api.dashboardMetrics.technicianWorkload);
  const tallies = useQuery(api.dashboardMetrics.rollingTallies);

  const isLoading = performance === undefined || workload === undefined || tallies === undefined;

  // Merge workload into performance data
  const workloadMap = new Map(
    (workload ?? []).map((w) => [w.techId, w])
  );

  // Merge note KPIs per tech
  const noteKpiMap = new Map(
    (tallies?.perTech ?? []).map((t) => [t.techId, t])
  );

  // Status tally display order
  const statusOrder = [
    "swap_required",
    "return_with_parts",
    "transfer_to_shop",
    "billable_to_customer",
  ] as const;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Technician Performance</h1>
        </div>
        <PeriodSelector {...periodState} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Calls 2+ Days Old — prominent alert */}
          {tallies.oldOpenCallsCount > 0 && (
            <div className="flex items-center gap-3 rounded-xl border-2 border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-5 py-4">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" />
              <div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
                  {tallies.oldOpenCallsCount} call{tallies.oldOpenCallsCount !== 1 ? "s" : ""} 2+ days old
                </p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70">
                  Open service calls older than 48 hours need immediate attention
                </p>
              </div>
            </div>
          )}

          {/* Rolling Tallies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completed Calls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Completed Calls</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <TallyRow
                  label="Field Calls Completed"
                  today={tallies.completed.today}
                  thisMonth={tallies.completed.thisMonth}
                  thisYear={tallies.completed.thisYear}
                />
              </CardContent>
            </Card>

            {/* Swaps / Preventable / Returns */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Flags & Incidents</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <TallyRow
                  label="Swaps"
                  today={tallies.swaps.today}
                  thisWeek={tallies.swaps.thisWeek}
                  thisMonth={tallies.swaps.thisMonth}
                  accent="amber"
                />
                <TallyRow
                  label="Preventable"
                  today={tallies.preventable.today}
                  thisWeek={tallies.preventable.thisWeek}
                  thisMonth={tallies.preventable.thisMonth}
                  accent="red"
                />
                <TallyRow
                  label="Return Required"
                  today={tallies.returnRequired.today}
                  thisWeek={tallies.returnRequired.thisWeek}
                  thisMonth={tallies.returnRequired.thisMonth}
                />
              </CardContent>
            </Card>
          </div>

          {/* Current Status Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Current Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
                {statusOrder.map((s) => {
                  const count = tallies.statusCounts[s] ?? 0;
                  const colors = STATUS_COLORS[s];
                  return (
                    <div
                      key={s}
                      className={`rounded-lg border-l-4 ${colors.border} px-3 py-2.5 ${colors.bg}`}
                    >
                      <p className={`text-2xl font-bold tabular-nums ${colors.text}`}>
                        {count}
                      </p>
                      <p className={`text-xs font-medium ${colors.text} opacity-80`}>
                        {STATUS_LABELS[s]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Completed"
              value={performance.summary.totalCompleted}
              subtitle="selected period"
              color="green"
            />
            <KpiCard
              label="Avg Completion Time"
              value={formatHours(performance.summary.overallAvgCompletionTimeHours)}
              color="neutral"
            />
            <KpiCard
              label="Return Visit Rate"
              value={`${performance.summary.overallReturnRate}%`}
              color={rateColor(performance.summary.overallReturnRate, true)}
            />
            <KpiCard
              label="Total Active"
              value={workload.reduce((s, w) => s + w.total, 0)}
              color="neutral"
            />
          </div>

          {/* Technician Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Technician Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Technician</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">
                        Completion Rate
                      </TableHead>
                      <TableHead className="text-right hidden md:table-cell">
                        Avg Time
                      </TableHead>
                      <TableHead className="text-right">Return Rate</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Swaps</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Preventable</TableHead>
                      <TableHead className="text-right">Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performance.technicians.map((tech) => {
                      const wl = workloadMap.get(tech.techId);
                      const nk = noteKpiMap.get(tech.techId);
                      return (
                        <TableRow key={tech.techId}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: tech.techColor }}
                              />
                              <span className="font-medium">{tech.techName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {tech.completedCount}
                          </TableCell>
                          <TableCell className="text-right tabular-nums hidden sm:table-cell">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                tech.completionRate >= 80
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : tech.completionRate >= 60
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {tech.completionRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums hidden md:table-cell">
                            {formatHours(tech.avgCompletionTimeHours)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                tech.returnRate <= 5
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : tech.returnRate <= 15
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }`}
                            >
                              {tech.returnRate}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums hidden lg:table-cell">
                            {nk?.swapCount ?? 0}
                          </TableCell>
                          <TableCell className="text-right tabular-nums hidden lg:table-cell">
                            {nk?.preventableCount ?? 0}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {wl ? wl.total : 0}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Workload Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Current Workload Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <DistributionBars
                data={workload.map((w) => ({
                  label: w.techName,
                  value: w.total,
                  color: w.techColor,
                }))}
              />
              <div className="flex gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
                {workload.map((w) => (
                  <span key={w.techId}>
                    {w.techName}: {w.assigned}S / {w.swapRequired}SW / {w.returnWithParts}RP / {w.transferToShop}TS
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
