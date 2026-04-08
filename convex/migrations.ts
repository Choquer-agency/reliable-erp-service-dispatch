import { mutation } from "./_generated/server";

/**
 * One-time migration to update old status and note type values.
 * Run via the Convex dashboard or `npx convex run migrations:migrateStatuses`.
 */
export const migrateStatuses = mutation({
  args: {},
  handler: async (ctx) => {
    // Migrate serviceCalls statuses
    const STATUS_MAP: Record<string, string> = {
      in_progress: "assigned",
      on_hold: "swap_required",
      needs_return: "return_with_parts",
    };

    const allCalls = await ctx.db.query("serviceCalls").take(5000);
    let callsMigrated = 0;
    for (const call of allCalls) {
      const newStatus = STATUS_MAP[call.status];
      if (newStatus) {
        await ctx.db.patch(call._id, { status: newStatus as typeof call.status });
        callsMigrated++;
      }
    }

    // Migrate callNotes noteTypes
    const NOTE_TYPE_MAP: Record<string, string> = {
      parts_needed: "swap_required",
      status_update: "general",
    };

    const allNotes = await ctx.db.query("callNotes").take(10000);
    let notesMigrated = 0;
    for (const note of allNotes) {
      const newType = NOTE_TYPE_MAP[note.noteType];
      if (newType) {
        await ctx.db.patch(note._id, { noteType: newType as typeof note.noteType });
        notesMigrated++;
      }
    }

    return { callsMigrated, notesMigrated };
  },
});
