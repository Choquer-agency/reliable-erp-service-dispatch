import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/** Reusable helper — call from any mutation to log an activity entry. */
export async function logActivity(
  ctx: MutationCtx,
  serviceCallId: Id<"serviceCalls">,
  actorName: string,
  action: string,
  detail?: string
) {
  await ctx.db.insert("activityLog", {
    serviceCallId,
    actorName,
    action,
    detail,
  });
}

export const listByServiceCall = query({
  args: { serviceCallId: v.id("serviceCalls") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityLog")
      .withIndex("by_serviceCall", (q) =>
        q.eq("serviceCallId", args.serviceCallId)
      )
      .order("desc")
      .take(200);
  },
});

export const create = mutation({
  args: {
    serviceCallId: v.id("serviceCalls"),
    action: v.string(),
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    let actorName = "Unknown";
    if (userId) {
      const user = await ctx.db.get(userId);
      actorName = user?.name ?? "Unknown";
    }
    await logActivity(
      ctx,
      args.serviceCallId,
      actorName,
      args.action,
      args.detail
    );
  },
});
