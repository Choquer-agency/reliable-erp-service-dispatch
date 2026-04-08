import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { logActivity } from "./activityLog";
const statusValidator = v.union(
  v.literal("unassigned"),
  v.literal("assigned"),
  v.literal("swap_required"),
  v.literal("return_with_parts"),
  v.literal("transfer_to_shop"),
  v.literal("billable_to_customer"),
  v.literal("completed"),
  // Legacy — accepted for backward compat
  v.literal("in_progress"),
  v.literal("on_hold"),
  v.literal("needs_return")
);

export const list = query({
  args: {
    status: v.optional(statusValidator),
    assignedTechnician: v.optional(v.id("technicians")),
    scheduledDateStart: v.optional(v.string()),
    scheduledDateEnd: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Compound query: technician + date range
    if (args.assignedTechnician && args.scheduledDateStart) {
      const results = await ctx.db
        .query("serviceCalls")
        .withIndex("by_technician_and_date", (q) =>
          q
            .eq("assignedTechnician", args.assignedTechnician!)
            .gte("scheduledDate", args.scheduledDateStart!)
        )
        .take(200);
      if (args.scheduledDateEnd) {
        return results.filter(
          (r) => !r.scheduledDate || r.scheduledDate <= args.scheduledDateEnd!
        );
      }
      return results;
    }

    // Filter by status + technician
    if (args.status && args.assignedTechnician) {
      return await ctx.db
        .query("serviceCalls")
        .withIndex("by_status_and_technician", (q) =>
          q
            .eq("status", args.status!)
            .eq("assignedTechnician", args.assignedTechnician!)
        )
        .take(200);
    }

    // Filter by status only
    if (args.status) {
      return await ctx.db
        .query("serviceCalls")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .take(200);
    }

    // Filter by technician only
    if (args.assignedTechnician) {
      return await ctx.db
        .query("serviceCalls")
        .withIndex("by_assignedTechnician", (q) =>
          q.eq("assignedTechnician", args.assignedTechnician!)
        )
        .take(200);
    }

    // Filter by date range only
    if (args.scheduledDateStart) {
      const results = await ctx.db
        .query("serviceCalls")
        .withIndex("by_scheduledDate", (q) =>
          q.gte("scheduledDate", args.scheduledDateStart!)
        )
        .take(200);
      if (args.scheduledDateEnd) {
        return results.filter(
          (r) => !r.scheduledDate || r.scheduledDate <= args.scheduledDateEnd!
        );
      }
      return results;
    }

    // No filters — return all
    return await ctx.db.query("serviceCalls").take(200);
  },
});

export const getById = query({
  args: { id: v.id("serviceCalls") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByRNumber = query({
  args: { rNumber: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("serviceCalls")
      .withIndex("by_rNumber", (q) => q.eq("rNumber", args.rNumber))
      .unique();
  },
});

export const listCompleted = query({
  args: {
    paginationOpts: paginationOptsValidator,
    technicianId: v.optional(v.id("technicians")),
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("serviceCalls")
      .withIndex("by_status_and_dateCompleted", (q) =>
        q.eq("status", "completed")
      )
      .order("desc")
      .paginate(args.paginationOpts);

    // Post-filter for technician and date range (page size is small)
    let filtered = results.page;
    if (args.technicianId) {
      filtered = filtered.filter(
        (c) => c.assignedTechnician === args.technicianId
      );
    }
    if (args.dateFrom) {
      filtered = filtered.filter(
        (c) => c.dateCompleted && c.dateCompleted >= args.dateFrom!
      );
    }
    if (args.dateTo) {
      filtered = filtered.filter(
        (c) => c.dateCompleted && c.dateCompleted <= args.dateTo!
      );
    }

    return {
      ...results,
      page: filtered,
    };
  },
});

export const search = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    if (!args.query.trim()) return [];

    const results = await ctx.db
      .query("serviceCalls")
      .withSearchIndex("search_calls", (q) =>
        q.search("customerName", args.query)
      )
      .take(limit);

    // Also check by rNumber if query looks like one
    const normalized = args.query.trim().toLowerCase();
    const byRNumber = await ctx.db
      .query("serviceCalls")
      .withIndex("by_rNumber", (q) => q.eq("rNumber", normalized))
      .unique();

    if (byRNumber && !results.some((r) => r._id === byRNumber._id)) {
      results.unshift(byRNumber);
    }

    return results.slice(0, limit);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const unassigned = (
      await ctx.db
        .query("serviceCalls")
        .withIndex("by_status", (q) => q.eq("status", "unassigned"))
        .take(10000)
    ).length;
    const assigned = (
      await ctx.db
        .query("serviceCalls")
        .withIndex("by_status", (q) => q.eq("status", "assigned"))
        .take(10000)
    ).length;
    const swapRequired = (
      await ctx.db
        .query("serviceCalls")
        .withIndex("by_status", (q) => q.eq("status", "swap_required"))
        .take(10000)
    ).length;
    const returnWithParts = (
      await ctx.db
        .query("serviceCalls")
        .withIndex("by_status", (q) => q.eq("status", "return_with_parts"))
        .take(10000)
    ).length;
    const transferToShop = (
      await ctx.db
        .query("serviceCalls")
        .withIndex("by_status", (q) => q.eq("status", "transfer_to_shop"))
        .take(10000)
    ).length;
    const billableToCustomer = (
      await ctx.db
        .query("serviceCalls")
        .withIndex("by_status", (q) => q.eq("status", "billable_to_customer"))
        .take(10000)
    ).length;
    const completed = (
      await ctx.db
        .query("serviceCalls")
        .withIndex("by_status", (q) => q.eq("status", "completed"))
        .take(10000)
    ).length;

    return {
      total: unassigned + assigned + swapRequired + returnWithParts + transferToShop + billableToCustomer + completed,
      unassigned,
      assigned,
      swapRequired,
      returnWithParts,
      transferToShop,
      billableToCustomer,
      completed,
    };
  },
});

export const create = mutation({
  args: {
    rNumber: v.optional(v.string()),
    customerName: v.string(),
    contactName: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    machineInfo: v.string(),
    itemName: v.optional(v.string()),
    complaint: v.string(),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    locationName: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("urgent"), v.literal("normal"), v.literal("low"))
    ),
    importSource: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const actorName = user?.name ?? "System";

    const id = await ctx.db.insert("serviceCalls", {
      ...args,
      rNumber: args.rNumber ?? "",
      status: "unassigned",
      dateOpened: new Date().toISOString().split("T")[0],
      requiresReturn: false,
    });
    await logActivity(ctx, id, actorName, "created", "created ticket");
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("serviceCalls"),
    customerName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    machineInfo: v.optional(v.string()),
    itemName: v.optional(v.string()),
    complaint: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    locationName: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("urgent"), v.literal("normal"), v.literal("low"))
    ),
    requiresReturn: v.optional(v.boolean()),
    returnReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(id, updates);

      const userId = await getAuthUserId(ctx);
      const user = userId ? await ctx.db.get(userId) : null;
      const actorName = user?.name ?? "System";
      const changedFields = Object.keys(updates).join(", ");
      await logActivity(ctx, id, actorName, "updated", `updated ${changedFields}`);
    }
  },
});

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  unassigned: ["assigned"],
  assigned: ["swap_required", "return_with_parts", "transfer_to_shop", "billable_to_customer", "completed", "unassigned"],
  swap_required: ["assigned", "completed"],
  return_with_parts: ["assigned", "completed"],
  transfer_to_shop: ["assigned", "completed"],
  billable_to_customer: ["assigned", "completed"],
  completed: [],
};

export const assign = mutation({
  args: {
    id: v.id("serviceCalls"),
    technicianId: v.id("technicians"),
    scheduledDate: v.string(),
    callOrder: v.optional(v.number()),
    timeSlot: v.optional(v.union(v.literal("am"), v.literal("pm"))),
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.id);
    if (!call) throw new Error("Service call not found");
    await ctx.db.patch(args.id, {
      assignedTechnician: args.technicianId,
      scheduledDate: args.scheduledDate,
      callOrder: args.callOrder,
      timeSlot: args.timeSlot ?? "am",
      status: call.status === "unassigned" ? "assigned" : call.status,
    });

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const actorName = user?.name ?? "System";
    const tech = await ctx.db.get(args.technicianId);
    const techName = tech?.name ?? "unknown";
    await logActivity(ctx, args.id, actorName, "assigned", `assigned ${techName}`);
    await logActivity(ctx, args.id, actorName, "date_changed", `set scheduled date to ${args.scheduledDate}`);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("serviceCalls"),
    status: statusValidator,
  },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.id);
    if (!call) throw new Error("Service call not found");

    const allowed = ALLOWED_TRANSITIONS[call.status];
    if (!allowed || !allowed.includes(args.status)) {
      throw new Error(
        `Cannot transition from "${call.status}" to "${args.status}"`
      );
    }

    const updates: Record<string, unknown> = { status: args.status };
    if (args.status === "completed") {
      updates.dateCompleted = new Date().toISOString().split("T")[0];
    }
    if (args.status === "return_with_parts") {
      updates.requiresReturn = true;
    }
    if (args.status === "unassigned") {
      // Clear assignment when moving back to unassigned
      updates.assignedTechnician = undefined;
      updates.scheduledDate = undefined;
      updates.callOrder = undefined;
      updates.timeSlot = undefined;
    }

    await ctx.db.patch(args.id, updates);

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const actorName = user?.name ?? "System";
    const statusLabels: Record<string, string> = {
      unassigned: "Unassigned",
      assigned: "Scheduled",
      swap_required: "Unit Swap Required",
      return_with_parts: "Need to Return with Parts",
      transfer_to_shop: "Transfer Repair to Shop",
      billable_to_customer: "Billable to Customer",
      completed: "Completed",
    };
    await logActivity(ctx, args.id, actorName, "status_changed", `changed status to ${statusLabels[args.status] ?? args.status}`);
  },
});

export const unassign = mutation({
  args: { id: v.id("serviceCalls") },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.id);
    if (!call) throw new Error("Service call not found");
    await ctx.db.patch(args.id, {
      assignedTechnician: undefined,
      scheduledDate: undefined,
      callOrder: undefined,
      timeSlot: undefined,
      status: "unassigned",
    });

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const actorName = user?.name ?? "System";
    await logActivity(ctx, args.id, actorName, "unassigned", "unassigned ticket");
  },
});

export const reorder = mutation({
  args: {
    callIds: v.array(v.id("serviceCalls")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.callIds.length; i++) {
      await ctx.db.patch(args.callIds[i], { callOrder: i + 1 });
    }
  },
});
