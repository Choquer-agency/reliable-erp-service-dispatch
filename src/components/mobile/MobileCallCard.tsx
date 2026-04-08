"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, MessageSquare, AlertTriangle } from "lucide-react";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  type ServiceCallStatus,
} from "@/lib/statusConfig";
import { formatPhone } from "@/lib/phoneFormat";

interface MobileCallCardProps {
  call: Doc<"serviceCalls">;
  noteCount: number;
  onStatusTap: () => void;
  onNotesTap: () => void;
}

export function MobileCallCard({
  call,
  noteCount,
  onStatusTap,
  onNotesTap,
}: MobileCallCardProps) {
  const status = call.status as ServiceCallStatus;
  const colors = STATUS_COLORS[status];
  const isCompleted = status === "completed";

  const fullAddress = [call.address, call.city, call.postalCode]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`
    : null;

  return (
    <Card
      className={`touch-manipulation transition-opacity ${isCompleted ? "opacity-50" : ""}`}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Call order number */}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white`}
            style={{
              backgroundColor: isCompleted
                ? "#9ca3af"
                : status === "assigned"
                  ? "#3b82f6"
                  : status === "swap_required"
                    ? "#f59e0b"
                    : status === "return_with_parts"
                      ? "#f97316"
                      : status === "transfer_to_shop"
                        ? "#a855f7"
                        : status === "billable_to_customer"
                          ? "#06b6d4"
                          : "#6b7280",
            }}
          >
            #{call.callOrder ?? "–"}
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Customer + priority */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-bold leading-tight">
                {call.customerName}
              </h3>
              {call.priority === "urgent" && (
                <Badge variant="destructive" className="flex-shrink-0 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Urgent
                </Badge>
              )}
            </div>

            {/* Machine info */}
            <p className="text-sm text-muted-foreground">{call.machineInfo}</p>

            {/* Complaint - full text, no truncation */}
            {call.complaint && (
              <p className="text-sm">{call.complaint}</p>
            )}

            {/* R-number */}
            {call.rNumber && (
              <p className="text-xs font-mono text-muted-foreground">
                {call.rNumber}
              </p>
            )}

            {/* Address - tappable for directions */}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 min-h-[48px] py-2 -mx-1 px-1 rounded-md active:bg-accent"
              >
                <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-blue-600 underline underline-offset-2">
                  {fullAddress}
                </span>
              </a>
            )}

            {/* Contact phone - tappable to call */}
            {call.contactPhone && (
              <a
                href={`tel:${call.contactPhone}`}
                className="flex items-center gap-2 min-h-[48px] py-2 -mx-1 px-1 rounded-md active:bg-accent"
              >
                <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-blue-600">
                  {call.contactName && (
                    <span className="text-foreground mr-2">{call.contactName}</span>
                  )}
                  {formatPhone(call.contactPhone)}
                </span>
              </a>
            )}

            {/* Bottom row: status pill + notes badge */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onStatusTap}
                className="min-h-[44px] px-4 py-2 rounded-full text-sm font-semibold active:scale-95 transition-transform"
                style={{
                  backgroundColor:
                    status === "assigned"
                      ? "#dbeafe"
                      : status === "swap_required"
                        ? "#fef3c7"
                        : status === "return_with_parts"
                          ? "#ffedd5"
                          : status === "transfer_to_shop"
                            ? "#f3e8ff"
                            : status === "billable_to_customer"
                              ? "#cffafe"
                              : status === "completed"
                                ? "#dcfce7"
                                : "#f3f4f6",
                  color:
                    status === "assigned"
                      ? "#1d4ed8"
                      : status === "swap_required"
                        ? "#92400e"
                        : status === "return_with_parts"
                          ? "#c2410c"
                          : status === "transfer_to_shop"
                            ? "#7e22ce"
                            : status === "billable_to_customer"
                              ? "#0e7490"
                              : status === "completed"
                                ? "#15803d"
                                : "#374151",
                }}
              >
                {STATUS_LABELS[status]}
              </button>

              <button
                type="button"
                onClick={onNotesTap}
                className="flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-lg text-sm text-muted-foreground active:bg-accent transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
                {noteCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {noteCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
