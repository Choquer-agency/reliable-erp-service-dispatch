"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  Mail,
  MapPin,
  Wrench,
  User,
  CalendarIcon,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { NotesThread } from "./NotesThread";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  ALLOWED_TRANSITIONS,
  type ServiceCallStatus,
} from "@/lib/statusConfig";
import { toISODate, parseLocalDate } from "@/lib/weekUtils";
import { formatPhone } from "@/lib/phoneFormat";

interface ServiceCallDetailProps {
  callId: Id<"serviceCalls"> | null;
  onClose: () => void;
}

export function ServiceCallDetail({ callId, onClose }: ServiceCallDetailProps) {
  const call = useQuery(
    api.serviceCalls.getById,
    callId ? { id: callId } : "skip"
  );
  const technicians = useQuery(api.technicians.list, { activeOnly: true });

  const assignMutation = useMutation(api.serviceCalls.assign);
  const updateStatusMutation = useMutation(api.serviceCalls.updateStatus);
  const updateMutation = useMutation(api.serviceCalls.update);
  const logActivityMutation = useMutation(api.activityLog.create);
  const activityLogs = useQuery(
    api.activityLog.listByServiceCall,
    callId ? { serviceCallId: callId } : "skip"
  );

  const [assignTechId, setAssignTechId] = useState<string>("");
  const [assignDate, setAssignDate] = useState<Date | undefined>();
  const [assignOrder, setAssignOrder] = useState<string>("");
  const [logsOpen, setLogsOpen] = useState(false);

  // Sync local state with call data
  useEffect(() => {
    if (call) {
      setAssignTechId(call.assignedTechnician ?? "");
      setAssignDate(call.scheduledDate ? parseLocalDate(call.scheduledDate) : undefined);
      setAssignOrder(call.callOrder?.toString() ?? "");
    }
  }, [call]);

  if (!callId) return null;

  const status = (call?.status ?? "unassigned") as ServiceCallStatus;
  const colors = STATUS_COLORS[status];
  const transitions = ALLOWED_TRANSITIONS[status];

  const handleAssign = async () => {
    if (!call || !assignTechId || !assignDate) return;
    try {
      await assignMutation({
        id: call._id,
        technicianId: assignTechId as Id<"technicians">,
        scheduledDate: toISODate(assignDate),
        callOrder: assignOrder ? parseInt(assignOrder) : undefined,
      });
      toast.success("Call assigned");
    } catch (e) {
      toast.error("Failed to assign call");
    }
  };

  const handleStatusChange = async (newStatus: ServiceCallStatus) => {
    if (!call) return;
    try {
      await updateStatusMutation({ id: call._id, status: newStatus });
      toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`);
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleReturnToggle = async (requiresReturn: boolean, returnReason?: string) => {
    if (!call) return;
    try {
      await updateMutation({
        id: call._id,
        requiresReturn,
        returnReason: returnReason ?? "",
      });
    } catch {
      toast.error("Failed to update return flag");
    }
  };

  const fullAddress = [call?.address, call?.city, call?.postalCode]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = fullAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
    : null;

  const formatLogTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleLogAction = (action: string, detail: string) => {
    if (!call) return;
    logActivityMutation({ serviceCallId: call._id, action, detail });
  };

  return (
    <Sheet open={!!callId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-[480px] p-0">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-5">
            <SheetHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg">
                  {call?.customerName ?? "Loading..."}
                </SheetTitle>
              </div>
              {call && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-muted-foreground">
                    {call.rNumber}
                  </span>
                  {call.priority === "urgent" && (
                    <Badge variant="destructive">Urgent</Badge>
                  )}
                  {call.priority === "low" && (
                    <Badge variant="secondary">Low</Badge>
                  )}
                </div>
              )}
            </SheetHeader>

            {call && (
              <>
                {/* Status */}
                <section className="space-y-2">
                  <h4 className="text-sm font-semibold">Status</h4>
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      if (v && v !== status) {
                        handleStatusChange(v as ServiceCallStatus);
                      }
                    }}
                  >
                    <SelectTrigger
                      className={`w-full h-10 rounded-lg px-4 text-sm font-semibold border-0 ${colors.bg} ${colors.text}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-3 w-3 rounded-full shrink-0 ${colors.dot}`}
                        />
                        {STATUS_LABELS[status]}
                      </div>
                    </SelectTrigger>
                    <SelectContent className="p-1 !w-[260px]" align="start" alignItemWithTrigger={false}>
                      {(Object.keys(STATUS_LABELS) as ServiceCallStatus[]).map(
                        (s) => {
                          const sColors = STATUS_COLORS[s];
                          const isDisabled =
                            s !== status && !transitions.includes(s);
                          return (
                            <SelectItem
                              key={s}
                              value={s}
                              disabled={isDisabled}
                              className="py-2.5 px-3 text-sm font-medium rounded-md"
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`h-3 w-3 rounded-full shrink-0 ${sColors.dot}`}
                                />
                                {STATUS_LABELS[s]}
                              </div>
                            </SelectItem>
                          );
                        }
                      )}
                    </SelectContent>
                  </Select>
                  {call.requiresReturn && call.returnReason && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <RotateCcw className="h-3 w-3" />
                      Return reason: {call.returnReason}
                    </p>
                  )}
                </section>

                {/* Return reason input — only when status is needs_return */}
                {status === "needs_return" && (
                  <section className="space-y-1">
                    <Label className="text-xs">Return Reason</Label>
                    <Textarea
                      value={call.returnReason ?? ""}
                      onChange={(e) => handleReturnToggle(true, e.target.value)}
                      placeholder="Why does this call need a return trip?"
                      className="text-sm min-h-[60px]"
                    />
                  </section>
                )}

                <Separator />

                {/* Customer Info */}
                {(call.contactName || call.contactPhone || call.contactEmail) && (
                  <section className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Contact
                    </h4>
                    {call.contactName && (
                      <p className="text-sm">{call.contactName}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      {call.contactPhone && (
                        <a
                          href={`tel:${call.contactPhone}`}
                          onClick={() => handleLogAction("phone_tapped", "tapped phone button")}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          {formatPhone(call.contactPhone)}
                        </a>
                      )}
                      {call.contactEmail && (
                        <a
                          href={`mailto:${call.contactEmail}`}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Mail className="h-3 w-3" />
                          {call.contactEmail}
                        </a>
                      )}
                    </div>
                  </section>
                )}

                <Separator />

                {/* Equipment */}
                <section className="space-y-1">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" /> Equipment
                  </h4>
                  <p className="text-sm">{call.machineInfo}</p>
                  {call.itemName && (
                    <p className="text-xs text-muted-foreground">{call.itemName}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">
                    {call.complaint}
                  </p>
                </section>

                <Separator />

                {/* Location */}
                {fullAddress && (
                  <>
                    <section className="space-y-1">
                      <h4 className="text-sm font-semibold flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Location
                      </h4>
                      {call.locationName && (
                        <p className="text-sm font-medium">{call.locationName}</p>
                      )}
                      <p className="text-sm">{fullAddress}</p>
                      {mapsUrl && (
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => handleLogAction("maps_tapped", "opened Google Maps")}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <MapPin className="h-3 w-3" />
                          Open in Google Maps
                        </a>
                      )}
                    </section>
                    <Separator />
                  </>
                )}

                {/* Assignment */}
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" /> Assignment
                  </h4>
                  <div className="grid gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Technician</Label>
                      <Select value={assignTechId} onValueChange={(v) => v && setAssignTechId(v)}>
                        <SelectTrigger className="h-10 rounded-lg px-4 text-sm font-semibold">
                          <div className="flex items-center gap-2.5">
                            {assignTechId && technicians ? (
                              <>
                                <span
                                  className="h-3 w-3 rounded-full shrink-0"
                                  style={{ backgroundColor: technicians.find(t => t._id === assignTechId)?.color }}
                                />
                                {technicians.find(t => t._id === assignTechId)?.name}
                              </>
                            ) : (
                              <span className="text-muted-foreground font-normal">
                                {!technicians && assignTechId ? "Loading..." : "Select technician"}
                              </span>
                            )}
                          </div>
                        </SelectTrigger>
                        <SelectContent className="p-1 !w-[260px]" align="start" alignItemWithTrigger={false}>
                          {technicians?.map((tech) => (
                            <SelectItem key={tech._id} value={tech._id} className="py-2.5 px-3 text-sm font-medium rounded-md">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className="h-3 w-3 rounded-full shrink-0"
                                  style={{ backgroundColor: tech.color }}
                                />
                                {tech.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Scheduled Date</Label>
                      <Popover>
                        <PopoverTrigger
                          className="inline-flex items-center justify-start h-8 w-full rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {assignDate
                            ? assignDate.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })
                            : "Select a date"}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={assignDate}
                            onSelect={setAssignDate}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Call Order</Label>
                      <Input
                        type="number"
                        min={1}
                        value={assignOrder}
                        onChange={(e) => setAssignOrder(e.target.value)}
                        placeholder="e.g. 1"
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleAssign}
                      disabled={!assignTechId || !assignDate}
                      className="h-9 w-full text-sm"
                    >
                      {call.assignedTechnician ? "Reassign" : "Assign"}
                    </Button>
                  </div>
                </section>

                <Separator />

                {/* Notes Thread */}
                <NotesThread serviceCallId={call._id} />

                {/* Activity Log */}
                <Separator />
                <section className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Opened: {call.dateOpened}</span>
                    {call.dateCompleted && (
                      <span>Completed: {call.dateCompleted}</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setLogsOpen(!logsOpen)}
                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground w-full"
                  >
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${logsOpen ? "" : "-rotate-90"}`}
                    />
                    Logs {activityLogs ? `(${activityLogs.length})` : ""}
                  </button>

                  {logsOpen && (
                    <div className="mt-1 space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
                      {activityLogs === undefined ? (
                        <p className="text-xs text-muted-foreground">Loading...</p>
                      ) : activityLogs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No activity yet.</p>
                      ) : (
                        activityLogs.map((log) => (
                          <div
                            key={log._id}
                            className="flex items-start justify-between gap-2 text-xs"
                          >
                            <span className="text-muted-foreground">
                              <span className="font-medium text-foreground">{log.actorName}</span>{" "}
                              {log.detail ?? log.action}
                            </span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatLogTime(log._creationTime)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {call.importSource && (
                    <p className="text-[10px] text-muted-foreground">
                      Source: {call.importSource}
                    </p>
                  )}
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
