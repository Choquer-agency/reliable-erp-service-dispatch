"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useCurrentUser() {
  const user = useQuery(api.users.currentUser);
  return {
    user: user ?? null,
    role: user?.role ?? "dispatcher",
    isLoading: user === undefined,
  };
}
