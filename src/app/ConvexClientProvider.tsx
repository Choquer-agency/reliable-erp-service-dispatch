"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// Fallback to placeholder during build/prerender — the client is only used at runtime
const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud"
);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return <>{children}</>;
  }
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
