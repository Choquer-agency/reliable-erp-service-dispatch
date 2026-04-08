"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function HomePage() {
  const { role, isLoading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (role === "technician") {
      router.replace("/my-schedule");
    } else {
      router.replace("/dashboard");
    }
  }, [role, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
