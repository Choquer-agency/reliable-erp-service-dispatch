"use client";

import { useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Loader2 } from "lucide-react";
import { ServiceCallDetail } from "@/components/dispatch/ServiceCallDetail";

export default function HistoryPage() {
  const [techFilter, setTechFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCallId, setSelectedCallId] = useState<Id<"serviceCalls"> | null>(null);

  const technicians = useQuery(api.technicians.list, {});

  const filterArgs: {
    technicianId?: Id<"technicians">;
    dateFrom?: string;
    dateTo?: string;
  } = {};
  if (techFilter && techFilter !== "all") {
    filterArgs.technicianId = techFilter as Id<"technicians">;
  }
  if (dateFrom) filterArgs.dateFrom = dateFrom;
  if (dateTo) filterArgs.dateTo = dateTo;

  const { results, status, loadMore } = usePaginatedQuery(
    api.serviceCalls.listCompleted,
    filterArgs,
    { initialNumItems: 25 }
  );

  const techMap = new Map(
    (technicians ?? []).map((t) => [t._id, t])
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      <h1 className="text-2xl font-bold">Call History</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Technician</label>
          <Select value={techFilter} onValueChange={(v) => setTechFilter(v ?? "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All technicians" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All technicians</SelectItem>
              {(technicians ?? []).map((tech) => (
                <SelectItem key={tech._id} value={tech._id}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-[160px]"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-[160px]"
          />
        </div>
        {(techFilter !== "all" || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTechFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Results table */}
      {results.length === 0 && status === "Exhausted" ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CheckCircle className="h-10 w-10 mb-3" />
          <p className="text-lg font-medium">No completed calls found</p>
          <p className="text-sm">
            {techFilter !== "all" || dateFrom || dateTo
              ? "Try adjusting your filters"
              : "Completed calls will appear here"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">R-Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Machine</TableHead>
                  <TableHead className="hidden md:table-cell">Technician</TableHead>
                  <TableHead className="hidden sm:table-cell">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((call) => {
                  const tech = call.assignedTechnician
                    ? techMap.get(call.assignedTechnician)
                    : null;
                  return (
                    <TableRow
                      key={call._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedCallId(call._id)}
                    >
                      <TableCell className="font-mono text-sm">
                        {call.rNumber}
                      </TableCell>
                      <TableCell className="font-medium">
                        {call.customerName}
                        <span className="md:hidden text-xs text-muted-foreground block">
                          {call.machineInfo}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {call.machineInfo}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {tech ? (
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: tech.color }}
                            />
                            {tech.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {call.dateCompleted ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {status === "CanLoadMore" && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                onClick={() => loadMore(25)}
              >
                Load More
              </Button>
            </div>
          )}
          {status === "LoadingMore" && (
            <div className="flex justify-center pt-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      )}

      {/* Detail Sheet */}
      <ServiceCallDetail
        callId={selectedCallId}
        onClose={() => setSelectedCallId(null)}
      />
    </div>
  );
}
