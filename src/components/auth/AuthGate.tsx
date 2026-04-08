"use client";

import { useConvexAuth } from "convex/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ReactNode } from "react";

const PUBLIC_ROUTES = ["/sign-in", "/sign-up"];

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublic) {
      router.replace("/sign-in");
    }
    if (isAuthenticated && isPublic) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, isPublic, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Not authenticated and not on public route — will redirect
  if (!isAuthenticated && !isPublic) return null;
  // Authenticated and on public route — will redirect
  if (isAuthenticated && isPublic) return null;

  return <>{children}</>;
}
