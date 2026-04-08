import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const seedData = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Idempotent — skip if data already exists
    const existing = await ctx.db.query("technicians").take(1);
    if (existing.length > 0) {
      console.log("Seed data already exists, skipping.");
      return;
    }

    // --- Technicians ---
    const amritId = await ctx.db.insert("technicians", {
      name: "Amrit Darred",
      phone: "604-555-0101",
      isActive: true,
      color: "#3B82F6",
    });
    const brianId = await ctx.db.insert("technicians", {
      name: "Brian Yi",
      phone: "604-555-0102",
      isActive: true,
      color: "#10B981",
    });
    const surendraId = await ctx.db.insert("technicians", {
      name: "Surendra Reddy",
      phone: "604-555-0103",
      isActive: true,
      color: "#F59E0B",
    });
    const calvinId = await ctx.db.insert("technicians", {
      name: "Calvin Au-Yeung",
      phone: "604-555-0104",
      isActive: true,
      color: "#8B5CF6",
    });
    const daveId = await ctx.db.insert("technicians", {
      name: "Dave Morrison",
      phone: "604-555-0105",
      isActive: true,
      color: "#EF4444",
    });

    // --- Service Calls ---
    // Dates spread across this week (2026-04-07 is a Monday)
    const r51854 = await ctx.db.insert("serviceCalls", {
      rNumber: "r51854",
      status: "assigned",
      customerName: "Burke Mountain Secondary",
      contactName: "Mike Chen",
      contactPhone: "604-555-1001",
      machineInfo: "GS-2632 - #5601",
      complaint: "Machine not raising to full height, possible hydraulic issue",
      address: "1505 Coast Meridian Rd",
      city: "Coquitlam",
      postalCode: "V3E 0K1",
      locationName: "Burke Mountain Secondary School",
      assignedTechnician: brianId,
      scheduledDate: "2026-04-07",
      callOrder: 1,
      priority: "normal",
      dateOpened: "2026-04-03",
      requiresReturn: false,
    });

    const r51896 = await ctx.db.insert("serviceCalls", {
      rNumber: "r51896",
      status: "assigned",
      customerName: "Oakridge (Keystone)",
      contactName: "Sarah Lee",
      contactPhone: "604-555-1002",
      machineInfo: "GS-1930 - #4820",
      complaint: "Annual safety inspection due, customer requesting ASAP",
      address: "650 W 41st Ave",
      city: "Vancouver",
      postalCode: "V5Z 2M9",
      locationName: "Oakridge Centre",
      assignedTechnician: brianId,
      scheduledDate: "2026-04-07",
      callOrder: 2,
      priority: "normal",
      dateOpened: "2026-04-04",
      requiresReturn: false,
    });

    const r51945 = await ctx.db.insert("serviceCalls", {
      rNumber: "r51945",
      status: "assigned",
      customerName: "Apollo Exteriors",
      contactName: "James Wright",
      contactPhone: "604-555-1003",
      machineInfo: "S-85N - #3344",
      complaint: "Platform tilt sensor showing fault code E47",
      address: "2180 Gladwin Rd",
      city: "Abbotsford",
      postalCode: "V2S 3G4",
      locationName: "Apollo Exteriors Warehouse",
      assignedTechnician: surendraId,
      scheduledDate: "2026-04-07",
      callOrder: 1,
      priority: "urgent",
      dateOpened: "2026-04-02",
      requiresReturn: false,
    });

    const r51949 = await ctx.db.insert("serviceCalls", {
      rNumber: "r51949",
      status: "assigned",
      customerName: "Home Craft Siding",
      contactName: "Tom Park",
      contactPhone: "604-555-1004",
      machineInfo: "S-65 D-GEN - #4443",
      complaint: "Generator not starting, batteries may need replacement",
      address: "1220 Kingsway",
      city: "Coquitlam",
      postalCode: "V3E 1J1",
      assignedTechnician: surendraId,
      scheduledDate: "2026-04-08",
      callOrder: 1,
      priority: "normal",
      dateOpened: "2026-04-04",
      requiresReturn: false,
    });

    const r51965 = await ctx.db.insert("serviceCalls", {
      rNumber: "r51965",
      status: "assigned",
      customerName: "Westminster Lift Truck",
      contactName: "Dave Richards",
      contactPhone: "604-555-1005",
      machineInfo: "GS-3246 - #6102",
      complaint: "Outrigger cylinder leaking, needs seal replacement",
      address: "7725 Birdcall Ave",
      city: "Delta",
      postalCode: "V4G 1H7",
      locationName: "Westminster Lift Truck Shop",
      assignedTechnician: brianId,
      scheduledDate: "2026-04-08",
      callOrder: 1,
      priority: "normal",
      dateOpened: "2026-04-05",
      requiresReturn: false,
    });

    // Unassigned calls
    const r51981 = await ctx.db.insert("serviceCalls", {
      rNumber: "r51981",
      status: "unassigned",
      customerName: "Quantum Mechanical",
      contactName: "Ryan Patel",
      contactPhone: "604-555-1006",
      machineInfo: "GS-2646 - #5890",
      complaint: "Drive motor making grinding noise, intermittent",
      address: "1455 Quebec St",
      city: "Vancouver",
      postalCode: "V6A 3Z6",
      priority: "normal",
      dateOpened: "2026-04-05",
      requiresReturn: false,
    });

    const r51993 = await ctx.db.insert("serviceCalls", {
      rNumber: "r51993",
      status: "unassigned",
      customerName: "New Hospital",
      contactName: "Linda Nguyen",
      contactPhone: "604-555-1007",
      machineInfo: "GR-20 - #2210",
      complaint: "Boom not extending past 3rd stage, customer says happened suddenly",
      address: "13750 96 Ave",
      city: "Surrey",
      postalCode: "V3V 1Z2",
      priority: "urgent",
      dateOpened: "2026-04-04",
      requiresReturn: false,
    });

    const r52003 = await ctx.db.insert("serviceCalls", {
      rNumber: "r52003",
      status: "unassigned",
      customerName: "Midland Exteriors",
      contactName: "Steve Gordon",
      contactPhone: "604-555-1008",
      machineInfo: "S-65 D-GEN - #4450",
      complaint: "Scheduled preventive maintenance, customer flexible on timing",
      address: "3888 Main St",
      city: "Vancouver",
      postalCode: "V5V 3P2",
      priority: "low",
      dateOpened: "2026-04-06",
      requiresReturn: false,
    });

    // --- Call Notes ---
    await ctx.db.insert("callNotes", {
      serviceCallId: r51854,
      authorId: "system",
      authorName: "Daniel (Dispatcher)",
      content:
        "Customer called in saying the scissor lift is stuck at about 20ft. They need it working by Wednesday for the ceiling install.",
      noteType: "general",
    });

    await ctx.db.insert("callNotes", {
      serviceCallId: r51945,
      authorId: "system",
      authorName: "Surendra Reddy",
      content:
        "Checked fault code E47 — tilt sensor connector was corroded. Cleaned and reseated but may need full sensor replacement. Ordering part.",
      noteType: "swap_required",
    });

    await ctx.db.insert("callNotes", {
      serviceCallId: r51945,
      authorId: "system",
      authorName: "Daniel (Dispatcher)",
      content:
        "Part ordered from Skyjack — ETA Thursday. Will need to schedule return trip.",
      noteType: "return_required",
    });

    await ctx.db.insert("callNotes", {
      serviceCallId: r51993,
      authorId: "system",
      authorName: "Daniel (Dispatcher)",
      content:
        "Hospital construction site — they need this unit for framing work starting next week. High priority.",
      noteType: "general",
    });

    console.log(
      "Seed data loaded: 5 technicians, 8 service calls, 4 notes."
    );
  },
});
