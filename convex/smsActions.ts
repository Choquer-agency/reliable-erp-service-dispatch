import {
  internalAction,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const getServiceCallForSms = internalQuery({
  args: { serviceCallId: v.id("serviceCalls") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.serviceCallId);
  },
});

export const getTechnicianForSms = internalQuery({
  args: { technicianId: v.id("technicians") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.technicianId);
  },
});

export const getUserForSms = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const logSmsMessage = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("smsMessages", args);
  },
});

export const sendSmsNotification = internalAction({
  args: {
    serviceCallId: v.id("serviceCalls"),
    callNoteId: v.id("callNotes"),
    authorId: v.string(),
    authorName: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Get the service call
    const serviceCall = await ctx.runQuery(
      internal.smsActions.getServiceCallForSms,
      { serviceCallId: args.serviceCallId }
    );
    if (!serviceCall || !serviceCall.assignedTechnician) {
      return; // No assigned tech, nothing to notify
    }

    // 2. Get the technician
    const technician = await ctx.runQuery(
      internal.smsActions.getTechnicianForSms,
      { technicianId: serviceCall.assignedTechnician }
    );
    if (!technician || !technician.phone) {
      return;
    }

    // 3. Check if the author is the assigned technician (don't SMS yourself)
    const author = await ctx.runQuery(internal.smsActions.getUserForSms, {
      userId: args.authorId as Id<"users">,
    });
    if (author && author.technicianId === serviceCall.assignedTechnician) {
      return; // Author is the assigned tech, skip SMS
    }

    // 4. Build the SMS body
    const appUrl = process.env.APP_URL;
    const deepLink = appUrl
      ? `${appUrl}/my-schedule?call=${args.serviceCallId}`
      : "";
    const jobLine = [serviceCall.rNumber, serviceCall.customerName]
      .filter(Boolean)
      .join(" - ");
    const smsBody = `${args.content}\n\n${jobLine}${deepLink ? `\n${deepLink}` : ""}\n\n— ${args.authorName}`;

    // 5. Send via Twilio REST API
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.error("Twilio environment variables not configured");
      return;
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    try {
      const response = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: technician.phone,
          From: fromNumber,
          Body: smsBody,
        }).toString(),
      });

      const result = await response.json();

      await ctx.runMutation(internal.smsActions.logSmsMessage, {
        serviceCallId: args.serviceCallId,
        callNoteId: args.callNoteId,
        technicianId: serviceCall.assignedTechnician,
        twilioSid: result.sid ?? undefined,
        direction: "outbound",
        status: response.ok ? "sent" : "failed",
        phone: technician.phone,
      });

      if (!response.ok) {
        console.error("Twilio SMS failed:", result.message ?? result);
      }
    } catch (error) {
      console.error("Failed to send SMS:", error);
      await ctx.runMutation(internal.smsActions.logSmsMessage, {
        serviceCallId: args.serviceCallId,
        callNoteId: args.callNoteId,
        technicianId: serviceCall.assignedTechnician,
        direction: "outbound",
        status: "failed",
        phone: technician.phone,
      });
    }
  },
});
