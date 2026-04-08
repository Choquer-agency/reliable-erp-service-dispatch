import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (args.activeOnly) {
      return await ctx.db
        .query("technicians")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .take(50);
    }
    return await ctx.db.query("technicians").take(50);
  },
});

export const getById = query({
  args: { id: v.id("technicians") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    isActive: v.boolean(),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("technicians", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("technicians"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: Record<string, string | boolean | undefined> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }
    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(id, updates);
    }
  },
});

export const getActiveCallCounts = query({
  args: {},
  handler: async (ctx) => {
    const technicians = await ctx.db
      .query("technicians")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(50);

    const counts: Record<string, number> = {};
    for (const tech of technicians) {
      const calls = await ctx.db
        .query("serviceCalls")
        .withIndex("by_assignedTechnician", (q) =>
          q.eq("assignedTechnician", tech._id)
        )
        .take(1000);
      counts[tech._id] = calls.filter(
        (c) => c.status !== "completed"
      ).length;
    }
    return counts;
  },
});

export const deactivate = mutation({
  args: { id: v.id("technicians") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
  },
});
