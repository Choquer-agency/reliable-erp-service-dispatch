import { query } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ─── Technician Performance (for Dispatch Manager) ───────────────────────────

export const technicianPerformance = query({
  args: {
    dateFrom: v.string(),
    dateTo: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all active technicians
    const technicians = await ctx.db
      .query("technicians")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(50);

    // Get all completed calls in the period
    const completedCalls = await ctx.db
      .query("serviceCalls")
      .withIndex("by_status_and_dateCompleted", (q) =>
        q.eq("status", "completed").gte("dateCompleted", args.dateFrom)
      )
      .take(5000);
    const filteredCompleted = completedCalls.filter(
      (c) => c.dateCompleted && c.dateCompleted <= args.dateTo
    );

    // Build per-technician metrics
    const results = await Promise.all(
      technicians.map(async (tech) => {
        const techCompleted = filteredCompleted.filter(
          (c) => c.assignedTechnician === tech._id
        );

        // Count calls assigned to this tech in the period via activity log
        const techAssignedCount = await countAssignmentsInPeriod(
          ctx,
          tech._id,
          tech.name,
          args.dateFrom,
          args.dateTo
        );

        // Return visit rate
        const returnCount = techCompleted.filter(
          (c) => c.requiresReturn
        ).length;

        // Average completion time from activity log timestamps
        let totalCompletionHours = 0;
        let completionTimeSamples = 0;

        for (const call of techCompleted) {
          const logs = await ctx.db
            .query("activityLog")
            .withIndex("by_serviceCall", (q) =>
              q.eq("serviceCallId", call._id)
            )
            .take(50);

          const inProgressLog = logs.find(
            (l) =>
              l.action === "status_changed" &&
              l.detail?.includes("In Progress")
          );
          const completedLog = logs.find(
            (l) =>
              l.action === "status_changed" &&
              l.detail?.includes("Completed")
          );

          if (inProgressLog && completedLog) {
            const ipTime = inProgressLog.occurredAt ?? inProgressLog._creationTime;
            const cTime = completedLog.occurredAt ?? completedLog._creationTime;
            const hours = (cTime - ipTime) / (1000 * 60 * 60);
            if (hours > 0 && hours < 720) {
              // Sanity cap at 30 days
              totalCompletionHours += hours;
              completionTimeSamples++;
            }
          }
        }

        return {
          techId: tech._id,
          techName: tech.name,
          techColor: tech.color,
          completedCount: techCompleted.length,
          assignedCount: Math.max(techAssignedCount, techCompleted.length),
          completionRate:
            techAssignedCount > 0
              ? Math.round((techCompleted.length / techAssignedCount) * 100)
              : techCompleted.length > 0
                ? 100
                : 0,
          avgCompletionTimeHours:
            completionTimeSamples > 0
              ? Math.round((totalCompletionHours / completionTimeSamples) * 10) /
                10
              : null,
          returnRate:
            techCompleted.length > 0
              ? Math.round(
                  (returnCount / techCompleted.length) * 100
                )
              : 0,
          returnCount,
        };
      })
    );

    // Summary totals
    const totalCompleted = results.reduce((s, r) => s + r.completedCount, 0);
    const totalReturns = results.reduce((s, r) => s + r.returnCount, 0);
    const allAvgTimes = results
      .filter((r) => r.avgCompletionTimeHours !== null)
      .map((r) => r.avgCompletionTimeHours!);
    const overallAvgTime =
      allAvgTimes.length > 0
        ? Math.round(
            (allAvgTimes.reduce((s, t) => s + t, 0) / allAvgTimes.length) * 10
          ) / 10
        : null;

    return {
      technicians: results,
      summary: {
        totalCompleted,
        overallAvgCompletionTimeHours: overallAvgTime,
        overallReturnRate:
          totalCompleted > 0
            ? Math.round((totalReturns / totalCompleted) * 100)
            : 0,
      },
    };
  },
});

/**
 * Count how many calls were assigned to a technician during a date range.
 * We look at activity logs for "assigned" actions that mention the tech's name
 * and fall within the period.
 */
async function countAssignmentsInPeriod(
  ctx: QueryCtx,
  techId: Id<"technicians">,
  techName: string,
  dateFrom: string,
  dateTo: string
): Promise<number> {
  const dateFromMs = new Date(dateFrom).getTime();
  const dateToMs = new Date(dateTo + "T23:59:59").getTime();

  // Get all calls currently or previously assigned to this tech
  const currentCalls = await ctx.db
    .query("serviceCalls")
    .withIndex("by_assignedTechnician", (q) =>
      q.eq("assignedTechnician", techId)
    )
    .take(1000);

  // Check each call's activity log for assignment events in the period
  let count = 0;
  const seen = new Set<string>();

  for (const call of currentCalls) {
    if (seen.has(call._id)) continue;
    seen.add(call._id);

    const logs = await ctx.db
      .query("activityLog")
      .withIndex("by_serviceCall", (q) => q.eq("serviceCallId", call._id))
      .take(50);

    const assignedInPeriod = logs.some(
      (l) =>
        l.action === "assigned" &&
        l.detail?.includes(techName) &&
        l._creationTime >= dateFromMs &&
        l._creationTime <= dateToMs
    );

    if (assignedInPeriod) count++;
  }

  return count;
}

// ─── Technician Current Workload ─────────────────────────────────────────────

export const technicianWorkload = query({
  args: {},
  handler: async (ctx) => {
    const technicians = await ctx.db
      .query("technicians")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(50);

    const results = await Promise.all(
      technicians.map(async (tech) => {
        const calls = await ctx.db
          .query("serviceCalls")
          .withIndex("by_assignedTechnician", (q) =>
            q.eq("assignedTechnician", tech._id)
          )
          .take(500);

        const active = calls.filter((c) => c.status !== "completed");

        return {
          techId: tech._id,
          techName: tech.name,
          techColor: tech.color,
          assigned: active.filter((c) => c.status === "assigned").length,
          inProgress: active.filter((c) => c.status === "in_progress").length,
          onHold: active.filter((c) => c.status === "on_hold").length,
          needsReturn: active.filter((c) => c.status === "needs_return")
            .length,
          total: active.length,
        };
      })
    );

    return results;
  },
});

// ─── Dispatch Manager Performance (for CEO) ──────────────────────────────────

export const dispatchPerformance = query({
  args: {
    dateFrom: v.string(),
    dateTo: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all calls created in the period (use dateOpened)
    const allCalls = await ctx.db.query("serviceCalls").take(5000);
    const callsInPeriod = allCalls.filter(
      (c) => c.dateOpened >= args.dateFrom && c.dateOpened <= args.dateTo
    );

    // Get completed calls in the period
    const completedInPeriod = allCalls.filter(
      (c) =>
        c.dateCompleted &&
        c.dateCompleted >= args.dateFrom &&
        c.dateCompleted <= args.dateTo
    );

    // Compute time-to-assignment for each call created in period
    const assignmentTimes: number[] = [];

    for (const call of callsInPeriod) {
      const logs = await ctx.db
        .query("activityLog")
        .withIndex("by_serviceCall", (q) =>
          q.eq("serviceCallId", call._id)
        )
        .take(50);

      const createdLog = logs.find((l) => l.action === "created");
      const assignedLog = logs.find((l) => l.action === "assigned");

      if (createdLog && assignedLog) {
        const cTime = createdLog.occurredAt ?? createdLog._creationTime;
        const aTime = assignedLog.occurredAt ?? assignedLog._creationTime;
        const minutes = (aTime - cTime) / (1000 * 60);
        if (minutes >= 0 && minutes < 43200) {
          // Cap at 30 days
          assignmentTimes.push(minutes);
        }
      }
    }

    // Compute average and median
    const avgAssignmentMinutes =
      assignmentTimes.length > 0
        ? Math.round(
            assignmentTimes.reduce((s, t) => s + t, 0) /
              assignmentTimes.length
          )
        : null;

    const sorted = [...assignmentTimes].sort((a, b) => a - b);
    const medianAssignmentMinutes =
      sorted.length > 0
        ? Math.round(sorted[Math.floor(sorted.length / 2)])
        : null;

    // Per-tech assignment distribution
    const technicians = await ctx.db
      .query("technicians")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(50);

    const techDistribution = await Promise.all(
      technicians.map(async (tech) => {
        // Count calls assigned to this tech in the period
        let count = 0;
        for (const call of callsInPeriod) {
          const logs = await ctx.db
            .query("activityLog")
            .withIndex("by_serviceCall", (q) =>
              q.eq("serviceCallId", call._id)
            )
            .take(50);

          const wasAssignedToTech = logs.some(
            (l) =>
              l.action === "assigned" &&
              l.detail?.includes(tech.name)
          );
          if (wasAssignedToTech) count++;
        }

        return {
          techId: tech._id,
          techName: tech.name,
          techColor: tech.color,
          count,
        };
      })
    );

    // Workload balance coefficient of variation
    const counts = techDistribution.map((t) => t.count);
    const mean =
      counts.length > 0
        ? counts.reduce((s, c) => s + c, 0) / counts.length
        : 0;
    const variance =
      counts.length > 0
        ? counts.reduce((s, c) => s + Math.pow(c - mean, 2), 0) /
          counts.length
        : 0;
    const stdDev = Math.sqrt(variance);
    const balanceScore =
      mean > 0 ? Math.round((1 - stdDev / mean) * 100) : 100;

    return {
      totalCreated: callsInPeriod.length,
      totalCompleted: completedInPeriod.length,
      backlogDelta: callsInPeriod.length - completedInPeriod.length,
      avgAssignmentMinutes,
      medianAssignmentMinutes,
      callsWithAssignment: assignmentTimes.length,
      callsWithoutAssignment:
        callsInPeriod.length - assignmentTimes.length,
      techDistribution,
      balanceScore: Math.max(0, Math.min(100, balanceScore)),
    };
  },
});

// ─── Current Backlog Status (for CEO) ────────────────────────────────────────

export const currentBacklog = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Unassigned calls
    const unassigned = await ctx.db
      .query("serviceCalls")
      .withIndex("by_status", (q) => q.eq("status", "unassigned"))
      .take(500);

    const unassignedWithAge = unassigned.map((c) => ({
      _id: c._id,
      rNumber: c.rNumber,
      customerName: c.customerName,
      machineInfo: c.machineInfo,
      dateOpened: c.dateOpened,
      ageHours: Math.round(
        (now - c._creationTime) / (1000 * 60 * 60) * 10
      ) / 10,
    }));
    unassignedWithAge.sort((a, b) => b.ageHours - a.ageHours);

    // Stuck calls (on_hold + needs_return)
    const onHold = await ctx.db
      .query("serviceCalls")
      .withIndex("by_status", (q) => q.eq("status", "on_hold"))
      .take(500);
    const needsReturn = await ctx.db
      .query("serviceCalls")
      .withIndex("by_status", (q) => q.eq("status", "needs_return"))
      .take(500);

    const stuckCalls = [...onHold, ...needsReturn].map((c) => ({
      _id: c._id,
      rNumber: c.rNumber,
      customerName: c.customerName,
      status: c.status,
      ageHours: Math.round(
        (now - c._creationTime) / (1000 * 60 * 60) * 10
      ) / 10,
    }));
    stuckCalls.sort((a, b) => b.ageHours - a.ageHours);

    return {
      unassignedCount: unassigned.length,
      oldestUnassignedAgeHours:
        unassignedWithAge.length > 0
          ? unassignedWithAge[0].ageHours
          : 0,
      avgUnassignedAgeHours:
        unassignedWithAge.length > 0
          ? Math.round(
              (unassignedWithAge.reduce((s, c) => s + c.ageHours, 0) /
                unassignedWithAge.length) *
                10
            ) / 10
          : 0,
      unassignedCalls: unassignedWithAge.slice(0, 10),
      onHoldCount: onHold.length,
      needsReturnCount: needsReturn.length,
      stuckCalls: stuckCalls.slice(0, 10),
    };
  },
});

// ─── Daily Throughput (for CEO) ──────────────────────────────────────────────

export const dailyThroughput = query({
  args: {
    dateFrom: v.string(),
    dateTo: v.string(),
  },
  handler: async (ctx, args) => {
    const allCalls = await ctx.db.query("serviceCalls").take(5000);

    // Group by dateOpened (created)
    const createdByDay: Record<string, number> = {};
    const completedByDay: Record<string, number> = {};

    for (const call of allCalls) {
      if (call.dateOpened >= args.dateFrom && call.dateOpened <= args.dateTo) {
        createdByDay[call.dateOpened] =
          (createdByDay[call.dateOpened] ?? 0) + 1;
      }
      if (
        call.dateCompleted &&
        call.dateCompleted >= args.dateFrom &&
        call.dateCompleted <= args.dateTo
      ) {
        completedByDay[call.dateCompleted] =
          (completedByDay[call.dateCompleted] ?? 0) + 1;
      }
    }

    // Build array of all days in range
    const days: { date: string; created: number; completed: number }[] = [];
    const current = new Date(args.dateFrom);
    const end = new Date(args.dateTo);

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        created: createdByDay[dateStr] ?? 0,
        completed: completedByDay[dateStr] ?? 0,
      });
      current.setDate(current.getDate() + 1);
    }

    return days;
  },
});

// ─── Call Lifecycle Timing (for CEO) ────────���────────────────────────────────

export const callLifecycle = query({
  args: {
    dateFrom: v.string(),
    dateTo: v.string(),
  },
  handler: async (ctx, args) => {
    // Get completed calls in the period
    const completedCalls = await ctx.db
      .query("serviceCalls")
      .withIndex("by_status_and_dateCompleted", (q) =>
        q.eq("status", "completed").gte("dateCompleted", args.dateFrom)
      )
      .take(5000);
    const filtered = completedCalls.filter(
      (c) => c.dateCompleted && c.dateCompleted <= args.dateTo
    );

    // For each completed call, compute time spent in each stage
    const stages = {
      unassignedToAssigned: [] as number[],
      assignedToInProgress: [] as number[],
      inProgressToCompleted: [] as number[],
      assignedToCompleted: [] as number[],
      totalOpenToClose: [] as number[],
    };
    let comebackCount = 0;
    let skippedInProgressCount = 0;

    for (const call of filtered) {
      const logs = await ctx.db
        .query("activityLog")
        .withIndex("by_serviceCall", (q) =>
          q.eq("serviceCallId", call._id)
        )
        .take(100);

      // Use occurredAt if set, otherwise fall back to _creationTime
      function ts(log: { occurredAt?: number; _creationTime: number }) {
        return log.occurredAt ?? log._creationTime;
      }

      // Sort logs chronologically
      const sorted = [...logs].sort((a, b) => ts(a) - ts(b));

      const createdLog = sorted.find((l) => l.action === "created");
      const assignedLog = sorted.find((l) => l.action === "assigned");
      const inProgressLog = sorted.find(
        (l) =>
          l.action === "status_changed" && l.detail?.includes("In Progress")
      );
      const completedLog = sorted.find(
        (l) =>
          l.action === "status_changed" && l.detail?.includes("Completed")
      );

      // Check if call went through on_hold or needs_return (comeback)
      const hadOnHold = sorted.some(
        (l) =>
          l.action === "status_changed" && l.detail?.includes("On Hold")
      );
      const hadNeedsReturn = sorted.some(
        (l) =>
          l.action === "status_changed" && l.detail?.includes("Needs Return")
      );
      if (hadOnHold || hadNeedsReturn || call.requiresReturn) {
        comebackCount++;
      }

      const createdAt = createdLog ? ts(createdLog) : undefined;
      const assignedAt = assignedLog ? ts(assignedLog) : undefined;
      const inProgressAt = inProgressLog ? ts(inProgressLog) : undefined;
      const completedAt = completedLog ? ts(completedLog) : undefined;

      if (createdAt && assignedAt) {
        const mins = (assignedAt - createdAt) / (1000 * 60);
        if (mins >= 0 && mins < 43200) stages.unassignedToAssigned.push(mins);
      }
      if (assignedAt && inProgressAt) {
        const mins = (inProgressAt - assignedAt) / (1000 * 60);
        if (mins >= 0 && mins < 43200) stages.assignedToInProgress.push(mins);
      }
      if (inProgressAt && completedAt) {
        const mins = (completedAt - inProgressAt) / (1000 * 60);
        if (mins >= 0 && mins < 43200) stages.inProgressToCompleted.push(mins);
      }
      // Assigned → Completed (tech skipped In Progress)
      if (assignedAt && completedAt && !inProgressAt) {
        const mins = (completedAt - assignedAt) / (1000 * 60);
        if (mins >= 0 && mins < 43200) stages.assignedToCompleted.push(mins);
        skippedInProgressCount++;
      }
      if (createdAt && completedAt) {
        const mins = (completedAt - createdAt) / (1000 * 60);
        if (mins >= 0 && mins < 43200) stages.totalOpenToClose.push(mins);
      }
    }

    function avg(arr: number[]): number | null {
      if (arr.length === 0) return null;
      return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
    }

    return {
      sampleSize: filtered.length,
      comebackCount,
      comebackRate:
        filtered.length > 0
          ? Math.round((comebackCount / filtered.length) * 100)
          : 0,
      skippedInProgressCount,
      avgMinutes: {
        unassignedToAssigned: avg(stages.unassignedToAssigned),
        assignedToInProgress: avg(stages.assignedToInProgress),
        inProgressToCompleted: avg(stages.inProgressToCompleted),
        assignedToCompleted: avg(stages.assignedToCompleted),
        totalOpenToClose: avg(stages.totalOpenToClose),
      },
      sampleCounts: {
        unassignedToAssigned: stages.unassignedToAssigned.length,
        assignedToInProgress: stages.assignedToInProgress.length,
        inProgressToCompleted: stages.inProgressToCompleted.length,
        assignedToCompleted: stages.assignedToCompleted.length,
        totalOpenToClose: stages.totalOpenToClose.length,
      },
    };
  },
});
