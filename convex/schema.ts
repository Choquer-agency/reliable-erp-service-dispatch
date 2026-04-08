import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.optional(
      v.union(
        v.literal("dispatcher"),
        v.literal("technician"),
        v.literal("admin")
      )
    ),
    technicianId: v.optional(v.id("technicians")),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  technicians: defineTable({
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    isActive: v.boolean(),
    color: v.string(),
  })
    .index("by_name", ["name"])
    .index("by_active", ["isActive"])
    .index("by_phone", ["phone"]),

  serviceCalls: defineTable({
    rNumber: v.string(),
    status: v.union(
      v.literal("unassigned"),
      v.literal("assigned"),
      v.literal("swap_required"),
      v.literal("return_with_parts"),
      v.literal("transfer_to_shop"),
      v.literal("billable_to_customer"),
      v.literal("completed"),
      // Legacy statuses — kept for backward compat until all data is migrated
      v.literal("in_progress"),
      v.literal("on_hold"),
      v.literal("needs_return")
    ),
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
    assignedTechnician: v.optional(v.id("technicians")),
    scheduledDate: v.optional(v.string()),
    callOrder: v.optional(v.number()),
    timeSlot: v.optional(v.union(v.literal("am"), v.literal("pm"))),
    priority: v.optional(
      v.union(v.literal("urgent"), v.literal("normal"), v.literal("low"))
    ),
    dateOpened: v.string(),
    dateCompleted: v.optional(v.string()),
    requiresReturn: v.boolean(),
    returnReason: v.optional(v.string()),
    importSource: v.optional(v.string()),
  })
    .index("by_rNumber", ["rNumber"])
    .index("by_status", ["status"])
    .index("by_assignedTechnician", ["assignedTechnician"])
    .index("by_scheduledDate", ["scheduledDate"])
    .index("by_technician_and_date", ["assignedTechnician", "scheduledDate"])
    .index("by_status_and_technician", ["status", "assignedTechnician"])
    .index("by_status_and_dateCompleted", ["status", "dateCompleted"])
    .searchIndex("search_calls", {
      searchField: "customerName",
      filterFields: ["status", "assignedTechnician"],
    }),

  callNotes: defineTable({
    serviceCallId: v.id("serviceCalls"),
    authorId: v.string(),
    authorName: v.string(),
    content: v.string(),
    noteType: v.union(
      v.literal("general"),
      v.literal("message"),
      v.literal("return_required"),
      v.literal("swap"),
      v.literal("preventable"),
      v.literal("swap_required"),
      // Legacy note types — kept for backward compat until data is migrated
      v.literal("parts_needed"),
      v.literal("status_update")
    ),
    authorRole: v.optional(
      v.union(
        v.literal("dispatcher"),
        v.literal("technician"),
        v.literal("admin")
      )
    ),
  })
    .index("by_serviceCall", ["serviceCallId"])
    .index("by_author", ["authorId"]),

  smsMessages: defineTable({
    serviceCallId: v.id("serviceCalls"),
    callNoteId: v.id("callNotes"),
    technicianId: v.id("technicians"),
    twilioSid: v.optional(v.string()),
    direction: v.union(v.literal("outbound"), v.literal("inbound")),
    status: v.union(
      v.literal("sent"),
      v.literal("failed"),
      v.literal("received")
    ),
    phone: v.string(),
  })
    .index("by_serviceCall", ["serviceCallId"])
    .index("by_technicianId", ["technicianId"]),

  activityLog: defineTable({
    serviceCallId: v.id("serviceCalls"),
    actorName: v.string(),
    action: v.string(),
    detail: v.optional(v.string()),
    occurredAt: v.optional(v.number()),
  })
    .index("by_serviceCall", ["serviceCallId"]),

  csvImports: defineTable({
    fileName: v.string(),
    importedAt: v.number(),
    importedBy: v.string(),
    rowCount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    errors: v.optional(v.array(v.string())),
  })
    .index("by_importedBy", ["importedBy"])
    .index("by_status", ["status"]),
});
