import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Import Record Tracking ─────────────────────────────────────────────────

export const createImportRecord = mutation({
  args: {
    fileName: v.string(),
    rowCount: v.number(),
    importedBy: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("csvImports", {
      fileName: args.fileName,
      rowCount: args.rowCount,
      importedBy: args.importedBy,
      importedAt: Date.now(),
      status: "pending",
    });
  },
});

export const updateImportStatus = mutation({
  args: {
    id: v.id("csvImports"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errors: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };
    if (args.errors !== undefined) {
      updates.errors = args.errors;
    }
    await ctx.db.patch(args.id, updates);
  },
});

export const listImports = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("csvImports")
      .order("desc")
      .take(20);
  },
});

// ─── Duplicate Check ─────────────────────────────────────────────────────────

export const checkExistingRNumbers = query({
  args: {
    rNumbers: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const results: Array<{ rNumber: string; _id: string }> = [];
    for (const rNumber of args.rNumbers) {
      const existing = await ctx.db
        .query("serviceCalls")
        .withIndex("by_rNumber", (q) => q.eq("rNumber", rNumber))
        .unique();
      if (existing) {
        results.push({ rNumber: existing.rNumber, _id: existing._id });
      }
    }
    return results;
  },
});

// ─── Batch Import ────────────────────────────────────────────────────────────

const importRowValidator = v.object({
  rNumber: v.string(),
  customerName: v.string(),
  contactName: v.optional(v.string()),
  contactPhone: v.optional(v.string()),
  machineInfo: v.string(),
  itemName: v.optional(v.string()),
  complaint: v.string(),
  address: v.optional(v.string()),
  city: v.optional(v.string()),
  postalCode: v.optional(v.string()),
  dateOpened: v.string(),
  dateClosed: v.optional(v.string()),
  scheduledDate: v.string(),
  matchedTechnicianId: v.optional(v.id("technicians")),
});

export const processBatch = mutation({
  args: {
    importId: v.id("csvImports"),
    rows: v.array(importRowValidator),
    isLastBatch: v.boolean(),
  },
  handler: async (ctx, args) => {
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    // Mark import as processing on first batch
    const importRecord = await ctx.db.get(args.importId);
    if (importRecord && importRecord.status === "pending") {
      await ctx.db.patch(args.importId, { status: "processing" });
    }

    for (const row of args.rows) {
      try {
        const existing = await ctx.db
          .query("serviceCalls")
          .withIndex("by_rNumber", (q) => q.eq("rNumber", row.rNumber))
          .unique();

        if (existing) {
          // Update existing — only overwrite POR-sourced fields,
          // preserve dispatcher-managed fields (status, assignment, etc.)
          const patch: Record<string, unknown> = {
            customerName: row.customerName,
            contactName: row.contactName,
            contactPhone: row.contactPhone,
            machineInfo: row.machineInfo,
            itemName: row.itemName,
            complaint: row.complaint,
            address: row.address,
            city: row.city,
            postalCode: row.postalCode,
            dateOpened: row.dateOpened,
            importSource: "por-csv",
          };
          // Only set scheduledDate if the existing call doesn't already have one
          if (!existing.scheduledDate) {
            patch.scheduledDate = row.scheduledDate;
          }
          if (row.dateClosed) {
            patch.dateCompleted = row.dateClosed;
          }
          await ctx.db.patch(existing._id, patch);
          updated++;
        } else {
          // Create new call
          const isCompleted = !!row.dateClosed;
          await ctx.db.insert("serviceCalls", {
            rNumber: row.rNumber,
            status: isCompleted
              ? "completed"
              : row.matchedTechnicianId
                ? "assigned"
                : "unassigned",
            customerName: row.customerName,
            contactName: row.contactName,
            contactPhone: row.contactPhone,
            machineInfo: row.machineInfo,
            itemName: row.itemName,
            complaint: row.complaint,
            address: row.address,
            city: row.city,
            postalCode: row.postalCode,
            dateOpened: row.dateOpened,
            dateCompleted: row.dateClosed,
            scheduledDate: row.scheduledDate,
            requiresReturn: false,
            importSource: "por-csv",
            assignedTechnician: row.matchedTechnicianId,
          });
          created++;
        }
      } catch (e) {
        errors.push(`${row.rNumber}: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    // Finalize if last batch
    if (args.isLastBatch) {
      await ctx.db.patch(args.importId, {
        status: errors.length > 0 ? "failed" : "completed",
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    return { created, updated, errors };
  },
});

// ─── Delete Imported Calls ──────────────────────────────────────────────────

export const deleteImportedCalls = mutation({
  args: {},
  handler: async (ctx) => {
    let deleted = 0;
    const allCalls = await ctx.db.query("serviceCalls").take(500);
    for (const call of allCalls) {
      if (call.importSource === "por-csv") {
        await ctx.db.delete(call._id);
        deleted++;
      }
    }
    return { deleted };
  },
});
