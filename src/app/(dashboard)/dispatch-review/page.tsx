"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { redirect } from "next/navigation";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PeriodSelector, usePeriod } from "@/components/dashboard/PeriodSelector";
import {
  ThroughputChart,
  DistributionBars,
} from "@/components/dashboard/SimpleBarChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Target, ArrowRight } from "lucide-react";

function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function assignmentTimeColor(
  minutes: number | null
): "green" | "yellow" | "red" | "neutral" {
  if (minutes === null) return "neutral";
  if (minutes < 60) return "green";
  if (minutes < 240) return "yellow";
  return "red";
}

function formatAgeHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function StageBox({ label, color }: { label: string; color: string }) {
  return (
    <div className={`rounded-lg px-4 py-3 text-center ${color}`}>
      <p className="text-xs font-semibold whitespace-nowrap">{label}</p>
    </div>
  );
}

function StageArrow({
  avgMinutes,
  samples,
}: {
  avgMinutes: number | null;
  samples: number;
}) {
  return (
    <div className="flex items-center flex-1 min-w-0">
      <div className="h-px flex-1 bg-muted-foreground/20" />
      <div className="flex flex-col items-center px-2">
        <span className="text-sm font-bold tabular-nums whitespace-nowrap text-foreground">
          {formatMinutes(avgMinutes)}
        </span>
        <span className="text-[10px] text-muted-foreground leading-none whitespace-nowrap">
          {samples} calls
        </span>
      </div>
      <div className="h-px flex-1 bg-muted-foreground/20" />
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
    </div>
  );
}

export default function DispatchReviewPage() {
  const { role } = useCurrentUser();
  if (role !== "admin") redirect("/dashboard");

  const periodState = usePeriod("this-month");
  const { dateFrom, dateTo } = periodState;

  const dispatch = useQuery(api.dashboardMetrics.dispatchPerformance, {
    dateFrom,
    dateTo,
  });
  const backlog = useQuery(api.dashboardMetrics.currentBacklog);
  const throughput = useQuery(api.dashboardMetrics.dailyThroughput, {
    dateFrom,
    dateTo,
  });
  const lifecycle = useQuery(api.dashboardMetrics.callLifecycle, {
    dateFrom,
    dateTo,
  });

  const isLoading =
    dispatch === undefined ||
    backlog === undefined ||
    throughput === undefined ||
    lifecycle === undefined;

  return (
    <div className="p-4 md:p-6 space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Dispatch Manager Review</h1>
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
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard
              label="Completed"
              value={lifecycle.sampleSize}
              subtitle={`of ${dispatch.totalCreated} created`}
              color="green"
            />
            <KpiCard
              label="Avg Time to Assign"
              value={formatMinutes(dispatch.avgAssignmentMinutes)}
              subtitle={
                dispatch.medianAssignmentMinutes !== null
                  ? `Median: ${formatMinutes(dispatch.medianAssignmentMinutes)}`
                  : undefined
              }
              color={assignmentTimeColor(dispatch.avgAssignmentMinutes)}
            />
            <KpiCard
              label="Unassigned Now"
              value={backlog.unassignedCount}
              subtitle={
                backlog.unassignedCount > 0
                  ? `Oldest: ${formatAgeHours(backlog.oldestUnassignedAgeHours)}`
                  : "Queue is clear"
              }
              color={
                backlog.unassignedCount === 0
                  ? "green"
                  : backlog.unassignedCount <= 3
                    ? "yellow"
                    : "red"
              }
            />
            <KpiCard
              label="Comeback Rate"
              value={`${lifecycle.comebackRate}%`}
              subtitle={`${lifecycle.comebackCount} of ${lifecycle.sampleSize} needed return`}
              color={
                lifecycle.comebackRate <= 10
                  ? "green"
                  : lifecycle.comebackRate <= 25
                    ? "yellow"
                    : "red"
              }
            />
            <KpiCard
              label="Stuck Calls"
              value={backlog.onHoldCount + backlog.needsReturnCount}
              subtitle={`${backlog.onHoldCount} on hold, ${backlog.needsReturnCount} needs return`}
              color={
                backlog.onHoldCount + backlog.needsReturnCount === 0
                  ? "green"
                  : backlog.onHoldCount + backlog.needsReturnCount <= 3
                    ? "yellow"
                    : "red"
              }
            />
          </div>

          {/* Call Lifecycle Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Call Lifecycle
                {lifecycle.sampleSize > 0 && (
                  <span className="text-xs font-normal text-muted-foreground">
                    Based on {lifecycle.sampleSize} completed calls
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lifecycle.sampleSize === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No completed calls in this period.
                </p>
              ) : (
                <div className="space-y-5">
                  {/* Full path: Unassigned → Assigned → In Progress → Completed */}
                  <div className="overflow-x-auto">
                    <div className="flex items-center min-w-[600px]">
                      <StageBox label="Unassigned" color="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
                      <StageArrow avgMinutes={lifecycle.avgMinutes.unassignedToAssigned} samples={lifecycle.sampleCounts.unassignedToAssigned} />
                      <StageBox label="Assigned" color="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" />
                      <StageArrow avgMinutes={lifecycle.avgMinutes.assignedToInProgress} samples={lifecycle.sampleCounts.assignedToInProgress} />
                      <StageBox label="In Progress" color="bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300" />
                      <StageArrow avgMinutes={lifecycle.avgMinutes.inProgressToCompleted} samples={lifecycle.sampleCounts.inProgressToCompleted} />
                      <StageBox label="Completed" color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" />
                      <div className="pl-4 ml-4 border-l-2 border-muted-foreground/20 flex flex-col items-end shrink-0">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Avg Total</span>
                        <span className="text-2xl font-bold tabular-nums">{formatMinutes(lifecycle.avgMinutes.totalOpenToClose)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skipped path: Assigned → Completed (no In Progress) */}
                  {lifecycle.skippedInProgressCount > 0 && (
                    <div className="overflow-x-auto">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">
                        Skipped In Progress ({lifecycle.skippedInProgressCount} calls)
                      </p>
                      <div className="flex items-center min-w-[600px]">
                        <StageBox label="Assigned" color="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" />
                        <StageArrow avgMinutes={lifecycle.avgMinutes.assignedToCompleted} samples={lifecycle.sampleCounts.assignedToCompleted} />
                        <StageBox label="Completed" color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300" />
                        <div className="pl-4 ml-4 border-l-2 border-transparent flex flex-col items-end shrink-0 invisible">
                          <span className="text-[10px] uppercase tracking-wide font-medium">Avg Total</span>
                          <span className="text-2xl font-bold tabular-nums">{formatMinutes(lifecycle.avgMinutes.totalOpenToClose)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daily Throughput Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              {throughput.length > 0 ? (
                <>
                  <ThroughputChart data={throughput} />
                  <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded bg-blue-500/70" />
                      Created
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded bg-emerald-500/70" />
                      Completed
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No data for this period.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Workload Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Workload Balance
                <Badge
                  className={`text-[10px] ${
                    dispatch.balanceScore >= 80
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : dispatch.balanceScore >= 60
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {dispatch.balanceScore}% balanced
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DistributionBars
                data={dispatch.techDistribution.map((t) => ({
                  label: t.techName,
                  value: t.count,
                  color: t.techColor,
                }))}
              />
            </CardContent>
          </Card>

          {/* Stuck Calls Table */}
          {backlog.stuckCalls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Stuck Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>R-Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Age</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backlog.stuckCalls.map((call) => (
                      <TableRow key={call._id}>
                        <TableCell className="font-mono text-sm">
                          {call.rNumber}
                        </TableCell>
                        <TableCell>{call.customerName}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              call.status === "on_hold"
                                ? "border-orange-300 text-orange-600"
                                : "border-amber-300 text-amber-600"
                            }
                          >
                            {call.status === "on_hold"
                              ? "On Hold"
                              : "Needs Return"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatAgeHours(call.ageHours)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Unassigned Calls Table */}
          {backlog.unassignedCalls.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Unassigned Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>R-Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Machine
                      </TableHead>
                      <TableHead className="text-right">Waiting</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backlog.unassignedCalls.map((call) => (
                      <TableRow key={call._id}>
                        <TableCell className="font-mono text-sm">
                          {call.rNumber}
                        </TableCell>
                        <TableCell>{call.customerName}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {call.machineInfo}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span
                            className={
                              call.ageHours > 24
                                ? "text-red-600 font-medium"
                                : call.ageHours > 4
                                  ? "text-amber-600 font-medium"
                                  : ""
                            }
                          >
                            {formatAgeHours(call.ageHours)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
