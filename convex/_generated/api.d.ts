/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityLog from "../activityLog.js";
import type * as auth from "../auth.js";
import type * as callNotes from "../callNotes.js";
import type * as csvImports from "../csvImports.js";
import type * as dashboardMetrics from "../dashboardMetrics.js";
import type * as http from "../http.js";
import type * as seed from "../seed.js";
import type * as seedTestMetrics from "../seedTestMetrics.js";
import type * as seedUsers from "../seedUsers.js";
import type * as serviceCalls from "../serviceCalls.js";
import type * as smsActions from "../smsActions.js";
import type * as technicians from "../technicians.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityLog: typeof activityLog;
  auth: typeof auth;
  callNotes: typeof callNotes;
  csvImports: typeof csvImports;
  dashboardMetrics: typeof dashboardMetrics;
  http: typeof http;
  seed: typeof seed;
  seedTestMetrics: typeof seedTestMetrics;
  seedUsers: typeof seedUsers;
  serviceCalls: typeof serviceCalls;
  smsActions: typeof smsActions;
  technicians: typeof technicians;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
