import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("dispatcher"),
      v.literal("technician"),
      v.literal("admin")
    ),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("Not authenticated");
    const caller = await ctx.db.get(callerId);
    if (!caller || caller.role !== "admin") {
      throw new Error("Only admins can change roles");
    }
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const listLinkable = query({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").take(200);
    return allUsers.filter((u) => !u.technicianId);
  },
});

export const getLinkedUser = query({
  args: { technicianId: v.id("technicians") },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "technician"))
      .take(200);
    return allUsers.find((u) => u.technicianId === args.technicianId) ?? null;
  },
});

export const unlinkTechnician = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("Not authenticated");
    const caller = await ctx.db.get(callerId);
    if (!caller || (caller.role !== "admin" && caller.role !== "dispatcher")) {
      throw new Error("Only dispatchers and admins can unlink technicians");
    }
    await ctx.db.patch(args.userId, {
      technicianId: undefined,
    });
  },
});

export const linkTechnician = mutation({
  args: {
    userId: v.id("users"),
    technicianId: v.id("technicians"),
  },
  handler: async (ctx, args) => {
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new Error("Not authenticated");
    const caller = await ctx.db.get(callerId);
    if (!caller || (caller.role !== "admin" && caller.role !== "dispatcher")) {
      throw new Error("Only dispatchers and admins can link technicians");
    }
    await ctx.db.patch(args.userId, {
      technicianId: args.technicianId,
      role: "technician",
    });
  },
});
