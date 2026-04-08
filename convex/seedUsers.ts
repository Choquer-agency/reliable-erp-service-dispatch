"use node";

import { internalAction } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";

export const seedUsers = internalAction({
  args: {},
  handler: async (ctx) => {
    // Daniel Goncalves — Service Manager / Dispatcher
    const daniel = await createAccount(ctx, {
      provider: "password",
      account: {
        id: "DanielG@reliableequipment.ca",
        secret: "Password123",
      },
      profile: {
        name: "Daniel Goncalves",
        email: "DanielG@reliableequipment.ca",
        role: "dispatcher",
      },
    });
    console.log("Created Daniel Goncalves:", daniel.user._id);

    // Carson Heppell — CEO / Admin
    const carson = await createAccount(ctx, {
      provider: "password",
      account: {
        id: "CarsonH@graftongroup.ca",
        secret: "Heppells",
      },
      profile: {
        name: "Carson Heppell",
        email: "CarsonH@graftongroup.ca",
        role: "admin",
      },
    });
    console.log("Created Carson Heppell:", carson.user._id);
  },
});
