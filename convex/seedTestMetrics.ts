import { internalMutation } from "./_generated/server";

/**
 * Seeds 30 test service calls with full lifecycle activity logs
 * including realistic occurredAt timestamps for lifecycle timing.
 * All test data is tagged with importSource: "test-seed" for easy cleanup.
 */
export const seedTestData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const techs = await ctx.db
      .query("technicians")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(10);

    if (techs.length === 0) {
      console.log("No technicians found. Run main seed first.");
      return;
    }

    const customers = [
      "Pacific Heights Construction", "Metro Glass Solutions", "West End Painting",
      "Fraser Valley Roofing", "Burnaby Steel Works", "Delta Port Services",
      "North Shore Electric", "Richmond Building Group", "Langley Tree Service",
      "Chilliwack Construction", "White Rock Plumbing", "Maple Ridge Interiors",
      "Port Moody Mechanical", "New Westminster Glass", "Pitt Meadows Farms",
      "Mission Reno Co", "Squamish Lumber", "Whistler Resort Maintenance",
      "Kamloops Industrial", "Kelowna Vineyards", "Victoria Harbour Works",
      "Nanaimo Marine Services", "Courtenay Building Supply", "Prince George Mills",
      "Surrey Central Mall", "Coquitlam Civic Centre", "Tri-City Exteriors",
      "Abbotsford Airport Authority", "Hope Construction Co", "Revelstoke Resort",
    ];

    const machines = [
      "GS-2632 - #5701", "GS-1930 - #4901", "S-85N - #3401",
      "S-65 D-GEN - #4501", "GS-3246 - #6201", "GR-20 - #2301",
      "GS-2646 - #5901", "S-40 - #3801", "GS-4069 - #6301",
      "ZX-135 - #7101", "GS-2632 - #5702", "GS-1930 - #4902",
      "S-85N - #3402", "S-65 D-GEN - #4502", "GS-3246 - #6202",
      "GR-20 - #2302", "GS-2646 - #5902", "S-40 - #3802",
      "GS-4069 - #6302", "ZX-135 - #7102", "GS-2632 - #5703",
      "GS-1930 - #4903", "S-85N - #3403", "S-65 D-GEN - #4503",
      "GS-3246 - #6203", "GR-20 - #2303", "GS-2646 - #5903",
      "S-40 - #3803", "GS-4069 - #6303", "ZX-135 - #7103",
    ];

    const complaints = [
      "Hydraulic leak at base cylinder",
      "Platform not leveling properly",
      "Annual safety inspection due",
      "Drive motor grinding noise",
      "Battery not holding charge",
      "Outrigger won't fully extend",
      "Fault code E12 on display",
      "Boom won't retract past stage 2",
      "Steering sluggish, possible pump issue",
      "Preventive maintenance scheduled",
    ];

    const MIN = 60 * 1000;
    const HR = 60 * MIN;

    // Each call defines realistic lifecycle timing
    interface CallDef {
      dateOpened: string;
      dateCompleted: string | undefined;
      status: "completed" | "assigned" | "in_progress" | "on_hold" | "needs_return";
      hasReturn: boolean;
      skipInProgress?: boolean;      // tech went Assigned → Completed directly
      wentOnHold?: boolean;          // went through on_hold before completing
      assignDelayMin: number;
      startDelayMin: number;
      workDurationMin: number;
    }

    const calls: CallDef[] = [
      // Week of Mar 23-27 — all completed, varying timings
      { dateOpened: "2026-03-23", dateCompleted: "2026-03-23", status: "completed", hasReturn: false, assignDelayMin: 22, startDelayMin: 95, workDurationMin: 180 },
      { dateOpened: "2026-03-23", dateCompleted: "2026-03-24", status: "completed", hasReturn: false, assignDelayMin: 45, startDelayMin: 310, workDurationMin: 240 },
      { dateOpened: "2026-03-24", dateCompleted: "2026-03-24", status: "completed", hasReturn: false, skipInProgress: true, assignDelayMin: 8, startDelayMin: 0, workDurationMin: 145 },
      { dateOpened: "2026-03-24", dateCompleted: "2026-03-25", status: "completed", hasReturn: true,  assignDelayMin: 35, startDelayMin: 180, workDurationMin: 420 },
      { dateOpened: "2026-03-25", dateCompleted: "2026-03-25", status: "completed", hasReturn: false, assignDelayMin: 12, startDelayMin: 45, workDurationMin: 120 },
      { dateOpened: "2026-03-25", dateCompleted: "2026-03-26", status: "completed", hasReturn: false, wentOnHold: true, assignDelayMin: 90, startDelayMin: 240, workDurationMin: 300 },
      { dateOpened: "2026-03-26", dateCompleted: "2026-03-26", status: "completed", hasReturn: false, assignDelayMin: 15, startDelayMin: 70, workDurationMin: 150 },
      { dateOpened: "2026-03-26", dateCompleted: "2026-03-27", status: "completed", hasReturn: false, assignDelayMin: 55, startDelayMin: 200, workDurationMin: 360 },
      { dateOpened: "2026-03-27", dateCompleted: "2026-03-27", status: "completed", hasReturn: true,  assignDelayMin: 18, startDelayMin: 90, workDurationMin: 210 },
      { dateOpened: "2026-03-27", dateCompleted: "2026-03-27", status: "completed", hasReturn: false, skipInProgress: true, assignDelayMin: 5, startDelayMin: 0, workDurationMin: 95 },

      // Week of Mar 30 - Apr 3 — all completed
      { dateOpened: "2026-03-30", dateCompleted: "2026-03-30", status: "completed", hasReturn: false, assignDelayMin: 10, startDelayMin: 55, workDurationMin: 135 },
      { dateOpened: "2026-03-30", dateCompleted: "2026-03-31", status: "completed", hasReturn: false, assignDelayMin: 120, startDelayMin: 300, workDurationMin: 480 },
      { dateOpened: "2026-03-31", dateCompleted: "2026-03-31", status: "completed", hasReturn: false, assignDelayMin: 25, startDelayMin: 80, workDurationMin: 160 },
      { dateOpened: "2026-03-31", dateCompleted: "2026-04-01", status: "completed", hasReturn: false, wentOnHold: true, assignDelayMin: 40, startDelayMin: 150, workDurationMin: 270 },
      { dateOpened: "2026-04-01", dateCompleted: "2026-04-01", status: "completed", hasReturn: true,  assignDelayMin: 7, startDelayMin: 40, workDurationMin: 100 },
      { dateOpened: "2026-04-01", dateCompleted: "2026-04-02", status: "completed", hasReturn: false, assignDelayMin: 65, startDelayMin: 210, workDurationMin: 350 },
      { dateOpened: "2026-04-02", dateCompleted: "2026-04-02", status: "completed", hasReturn: false, skipInProgress: true, assignDelayMin: 20, startDelayMin: 0, workDurationMin: 130 },
      { dateOpened: "2026-04-02", dateCompleted: "2026-04-03", status: "completed", hasReturn: false, assignDelayMin: 180, startDelayMin: 360, workDurationMin: 240 },
      { dateOpened: "2026-04-03", dateCompleted: "2026-04-03", status: "completed", hasReturn: false, assignDelayMin: 30, startDelayMin: 120, workDurationMin: 195 },
      { dateOpened: "2026-04-03", dateCompleted: "2026-04-03", status: "completed", hasReturn: false, assignDelayMin: 14, startDelayMin: 50, workDurationMin: 85 },

      // This week (Apr 6-7) — mix of statuses
      { dateOpened: "2026-04-06", dateCompleted: "2026-04-06", status: "completed", hasReturn: false, assignDelayMin: 11, startDelayMin: 45, workDurationMin: 130 },
      { dateOpened: "2026-04-06", dateCompleted: "2026-04-06", status: "completed", hasReturn: false, skipInProgress: true, assignDelayMin: 28, startDelayMin: 0, workDurationMin: 175 },
      { dateOpened: "2026-04-06", dateCompleted: "2026-04-07", status: "completed", hasReturn: false, wentOnHold: true, assignDelayMin: 50, startDelayMin: 180, workDurationMin: 310 },
      { dateOpened: "2026-04-06", dateCompleted: undefined,     status: "in_progress", hasReturn: false, assignDelayMin: 35, startDelayMin: 90, workDurationMin: 0 },
      { dateOpened: "2026-04-07", dateCompleted: undefined,     status: "in_progress", hasReturn: false, assignDelayMin: 15, startDelayMin: 60, workDurationMin: 0 },
      { dateOpened: "2026-04-07", dateCompleted: undefined,     status: "in_progress", hasReturn: false, assignDelayMin: 42, startDelayMin: 120, workDurationMin: 0 },
      { dateOpened: "2026-04-07", dateCompleted: undefined,     status: "assigned",    hasReturn: false, assignDelayMin: 20, startDelayMin: 0, workDurationMin: 0 },
      { dateOpened: "2026-04-07", dateCompleted: undefined,     status: "assigned",    hasReturn: false, assignDelayMin: 60, startDelayMin: 0, workDurationMin: 0 },
      { dateOpened: "2026-04-07", dateCompleted: undefined,     status: "on_hold",     hasReturn: false, assignDelayMin: 25, startDelayMin: 75, workDurationMin: 0 },
      { dateOpened: "2026-04-07", dateCompleted: undefined,     status: "needs_return", hasReturn: true, assignDelayMin: 10, startDelayMin: 40, workDurationMin: 0 },
    ];

    let count = 0;
    for (const def of calls) {
      const techIndex = count % techs.length;
      const tech = techs[techIndex];
      const rNumber = `test-${9000 + count}`;

      // Base timestamp: 7:30 AM on the dateOpened
      const baseMs = new Date(def.dateOpened + "T07:30:00").getTime();
      const createdAt = baseMs + (count % 5) * 15 * MIN; // stagger within the morning
      const assignedAt = createdAt + def.assignDelayMin * MIN;
      const inProgressAt = assignedAt + def.startDelayMin * MIN;
      const completedAt = inProgressAt + def.workDurationMin * MIN;

      const callId = await ctx.db.insert("serviceCalls", {
        rNumber,
        status: def.status,
        customerName: customers[count],
        contactName: "Test Contact",
        contactPhone: "604-555-9999",
        machineInfo: machines[count],
        complaint: complaints[count % complaints.length],
        city: "Vancouver",
        assignedTechnician: tech._id,
        scheduledDate: def.dateOpened,
        callOrder: (count % 5) + 1,
        priority: count % 7 === 0 ? "urgent" : "normal",
        dateOpened: def.dateOpened,
        dateCompleted: def.dateCompleted,
        requiresReturn: def.hasReturn,
        returnReason: def.hasReturn ? "Parts on order" : undefined,
        importSource: "test-seed",
      });

      // Created
      await ctx.db.insert("activityLog", {
        serviceCallId: callId,
        actorName: "System",
        action: "created",
        detail: "created ticket",
        occurredAt: createdAt,
      });

      // Assigned
      await ctx.db.insert("activityLog", {
        serviceCallId: callId,
        actorName: "Daniel",
        action: "assigned",
        detail: `assigned ${tech.name}`,
        occurredAt: assignedAt,
      });

      // In Progress (skip if tech went Assigned → Completed)
      const shouldHaveInProgress =
        !def.skipInProgress &&
        (def.status === "in_progress" ||
          def.status === "completed" ||
          def.status === "on_hold" ||
          def.status === "needs_return");

      if (shouldHaveInProgress) {
        await ctx.db.insert("activityLog", {
          serviceCallId: callId,
          actorName: tech.name,
          action: "status_changed",
          detail: "changed status to In Progress",
          occurredAt: inProgressAt,
        });
      }

      // On Hold (current status or went through it before completing)
      if (def.status === "on_hold" || def.wentOnHold) {
        await ctx.db.insert("activityLog", {
          serviceCallId: callId,
          actorName: tech.name,
          action: "status_changed",
          detail: "changed status to On Hold",
          occurredAt: inProgressAt + 45 * MIN,
        });
        // If completed after on_hold, also log back to In Progress
        if (def.wentOnHold && def.status === "completed") {
          await ctx.db.insert("activityLog", {
            serviceCallId: callId,
            actorName: tech.name,
            action: "status_changed",
            detail: "changed status to In Progress",
            occurredAt: inProgressAt + 120 * MIN,
          });
        }
      }

      // Needs Return
      if (def.status === "needs_return") {
        await ctx.db.insert("activityLog", {
          serviceCallId: callId,
          actorName: tech.name,
          action: "status_changed",
          detail: "changed status to Needs Return",
          occurredAt: inProgressAt + 60 * MIN,
        });
      }

      // Completed
      if (def.status === "completed") {
        await ctx.db.insert("activityLog", {
          serviceCallId: callId,
          actorName: tech.name,
          action: "status_changed",
          detail: "changed status to Completed",
          occurredAt: completedAt,
        });
      }

      count++;
    }

    console.log(`Seeded ${count} test service calls with realistic lifecycle timestamps.`);
  },
});

/**
 * Deletes ALL service calls, activity logs, and call notes. Clean slate.
 */
export const deleteAllServiceCalls = internalMutation({
  args: {},
  handler: async (ctx) => {
    let calls = 0, logs = 0, notes = 0;

    const allCalls = await ctx.db.query("serviceCalls").take(5000);
    for (const call of allCalls) {
      const callLogs = await ctx.db
        .query("activityLog")
        .withIndex("by_serviceCall", (q) => q.eq("serviceCallId", call._id))
        .take(200);
      for (const log of callLogs) { await ctx.db.delete(log._id); logs++; }

      const callNotes = await ctx.db
        .query("callNotes")
        .withIndex("by_serviceCall", (q) => q.eq("serviceCallId", call._id))
        .take(200);
      for (const note of callNotes) { await ctx.db.delete(note._id); notes++; }

      await ctx.db.delete(call._id);
      calls++;
    }
    console.log(`Deleted ALL: ${calls} calls, ${logs} logs, ${notes} notes.`);
  },
});

/**
 * Deletes all test data where importSource === "test-seed".
 */
export const deleteTestData = internalMutation({
  args: {},
  handler: async (ctx) => {
    let deletedCalls = 0;
    let deletedLogs = 0;
    let deletedNotes = 0;

    const allCalls = await ctx.db.query("serviceCalls").take(5000);
    const testCalls = allCalls.filter((c) => c.importSource === "test-seed");

    for (const call of testCalls) {
      const logs = await ctx.db
        .query("activityLog")
        .withIndex("by_serviceCall", (q) => q.eq("serviceCallId", call._id))
        .take(100);
      for (const log of logs) {
        await ctx.db.delete(log._id);
        deletedLogs++;
      }

      const notes = await ctx.db
        .query("callNotes")
        .withIndex("by_serviceCall", (q) => q.eq("serviceCallId", call._id))
        .take(100);
      for (const note of notes) {
        await ctx.db.delete(note._id);
        deletedNotes++;
      }

      await ctx.db.delete(call._id);
      deletedCalls++;
    }

    console.log(
      `Deleted ${deletedCalls} test calls, ${deletedLogs} logs, ${deletedNotes} notes.`
    );
  },
});
