"use client";

import { useSyncExternalStore } from "react";
import { useConvex } from "convex/react";

type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export function useConnectionState(): ConnectionStatus {
  const client = useConvex();

  return useSyncExternalStore(
    (callback) => client.subscribeToConnectionState(callback),
    () => {
      const state = client.connectionState();
      if (state.isWebSocketConnected) return "connected" as const;
      if (state.hasEverConnected) return "reconnecting" as const;
      return "disconnected" as const;
    },
    () => "disconnected" as const
  );
}
