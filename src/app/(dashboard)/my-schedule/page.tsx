"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTechnicianSchedule } from "@/hooks/useTechnicianSchedule";
import { useNoteCount } from "@/hooks/useNoteCount";
import { MobileCallCard } from "@/components/mobile/MobileCallCard";
import { StatusUpdateSheet } from "@/components/mobile/StatusUpdateSheet";
import { MobileNotesSheet } from "@/components/mobile/MobileNotesSheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  UserX,
} from "lucide-react";
import { toISODate, parseLocalDate, dayLabel } from "@/lib/weekUtils";
import { Id } from "../../../../convex/_generated/dataModel";
import { Doc } from "../../../../convex/_generated/dataModel";

function NoteCountBridge({
  call,
  onStatusTap,
  onNotesTap,
}: {
  call: Doc<"serviceCalls">;
  onStatusTap: () => void;
  onNotesTap: () => void;
}) {
  const noteCount = useNoteCount(call._id);
  return (
    <MobileCallCard
      call={call}
      noteCount={noteCount}
      onStatusTap={onStatusTap}
      onNotesTap={onNotesTap}
    />
  );
}

export default function MySchedulePage() {
  const { user, isLoading: userLoading } = useCurrentUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [activeSheet, setActiveSheet] = useState<"status" | "notes" | null>(
    null
  );
  const [selectedCallId, setSelectedCallId] =
    useState<Id<"serviceCalls"> | null>(null);
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);

  const technicianId = user?.technicianId as
    | Id<"technicians">
    | undefined;
  const { calls, isLoading: callsLoading } = useTechnicianSchedule(
    technicianId,
    selectedDate
  );

  // Handle deep link from SMS: /my-schedule?call=<serviceCallId>
  useEffect(() => {
    if (deepLinkHandled || callsLoading) return;
    const callParam = searchParams.get("call");
    if (!callParam) return;

    const callId = callParam as Id<"serviceCalls">;
    setSelectedCallId(callId);
    setActiveSheet("notes");
    setDeepLinkHandled(true);

    // Clean the URL
    router.replace("/my-schedule");
  }, [searchParams, callsLoading, deepLinkHandled, router]);

  const selectedCall = calls?.find((c) => c._id === selectedCallId) ?? null;

  const today = toISODate(new Date());
  const isToday = selectedDate === today;

  const navigateDay = (offset: number) => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(toISODate(d));
  };

  const handleStatusTap = (callId: Id<"serviceCalls">) => {
    setSelectedCallId(callId);
    setActiveSheet("status");
  };

  const handleNotesTap = (callId: Id<"serviceCalls">) => {
    setSelectedCallId(callId);
    setActiveSheet("notes");
  };

  // Loading state
  if (userLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  // Unlinked account guard
  if (!technicianId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <UserX className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-bold">Account Not Linked</h2>
        <p className="text-muted-foreground max-w-sm">
          Your account is not linked to a technician profile. Contact your
          dispatcher to get set up.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDay(-1)}
            className="h-12 w-12"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setSelectedDate(today)}
              className="text-lg font-bold"
            >
              {dayLabel(selectedDate)}
            </button>
            {isToday && (
              <p className="text-xs text-primary font-medium">Today</p>
            )}
            {!isToday && (
              <button
                type="button"
                onClick={() => setSelectedDate(today)}
                className="text-xs text-blue-600 hover:underline"
              >
                Go to today
              </button>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDay(1)}
            className="h-12 w-12"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
        {user?.name && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            {user.name}
          </p>
        )}
      </div>

      {/* Call list */}
      <div className="flex-1 p-4 space-y-3 pb-20">
        {callsLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </>
        ) : !calls || calls.length === 0 ? (
          <Card className="border-dashed mt-8">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-4">
              <Calendar className="h-12 w-12" />
              <p className="text-lg">No calls scheduled for this day</p>
            </CardContent>
          </Card>
        ) : (
          calls.map((call) => (
            <NoteCountBridge
              key={call._id}
              call={call}
              onStatusTap={() => handleStatusTap(call._id)}
              onNotesTap={() => handleNotesTap(call._id)}
            />
          ))
        )}
      </div>

      {/* Bottom sheets */}
      <StatusUpdateSheet
        call={selectedCall}
        open={activeSheet === "status"}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSheet(null);
            setSelectedCallId(null);
          }
        }}
      />

      <MobileNotesSheet
        serviceCallId={selectedCallId}
        open={activeSheet === "notes"}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSheet(null);
            setSelectedCallId(null);
          }
        }}
      />
    </div>
  );
}
