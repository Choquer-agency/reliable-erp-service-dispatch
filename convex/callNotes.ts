import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { logActivity } from "./activityLog";
import { internal } from "./_generated/api";

export const listByServiceCall = query({
  args: { serviceCallId: v.id("serviceCalls") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("callNotes")
      .withIndex("by_serviceCall", (q) =>
        q.eq("serviceCallId", args.serviceCallId)
      )
      .take(100);
  },
});

export const create = mutation({
  args: {
    serviceCallId: v.id("serviceCalls"),
    content: v.string(),
    noteType: v.union(
      v.literal("general"),
      v.literal("message"),
      v.literal("return_required"),
      v.literal("swap"),
      v.literal("preventable"),
      v.literal("swap_required")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const noteId = await ctx.db.insert("callNotes", {
      serviceCallId: args.serviceCallId,
      authorId: userId,
      authorName: user.name ?? "Unknown",
      content: args.content,
      noteType: args.noteType,
      authorRole: user.role ?? undefined,
    });

    const isMessage = args.noteType === "message";
    await logActivity(
      ctx,
      args.serviceCallId,
      user.name ?? "Unknown",
      "note_added",
      isMessage ? "sent a message" : "left a note"
    );

    // Schedule SMS notification for messages
    if (isMessage) {
      await ctx.scheduler.runAfter(
        0,
        internal.smsActions.sendSmsNotification,
        {
          serviceCallId: args.serviceCallId,
          callNoteId: noteId,
          authorId: userId,
          authorName: user.name ?? "Unknown",
          content: args.content,
        }
      );
    }

    return noteId;
  },
});
