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
import { BarChart3 } from "lucide-react";

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
  const noteKpis = useQuery(api.dashboardMetrics.noteBasedKpis, {
    dateFrom,
    dateTo,
  });

  const isLoading = performance === undefined || workload === undefined || noteKpis === undefined;

  // Merge workload into performance data
  const workloadMap = new Map(
    (workload ?? []).map((w) => [w.techId, w])
  );

  // Merge note KPIs per tech
  const noteKpiMap = new Map(
    (noteKpis?.perTech ?? []).map((t) => [t.techId, t])
  );

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
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Completed"
              value={performance.summary.totalCompleted}
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

          {/* Note-Based KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Swaps"
              value={noteKpis.swapCount}
              color={noteKpis.swapCount > 0 ? "yellow" : "green"}
            />
            <KpiCard
              label="Preventable Calls"
              value={noteKpis.preventableCount}
              color={noteKpis.preventableCount > 0 ? "red" : "green"}
            />
            <KpiCard
              label="Return Required"
              value={noteKpis.returnRequiredCount}
              color={noteKpis.returnRequiredCount > 0 ? "yellow" : "green"}
            />
            <KpiCard
              label="Calls 2+ Days Old"
              value={noteKpis.oldOpenCallsCount}
              color={noteKpis.oldOpenCallsCount === 0 ? "green" : noteKpis.oldOpenCallsCount <= 3 ? "yellow" : "red"}
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
