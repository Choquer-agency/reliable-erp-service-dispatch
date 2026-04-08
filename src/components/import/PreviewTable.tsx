"use client";

import { ParsedServiceCall } from "@/lib/porParser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertTriangle, Upload } from "lucide-react";

interface PreviewTableProps {
  rows: ParsedServiceCall[];
  selectedRows: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
  onImport: () => void;
  onCancel: () => void;
  importing: boolean;
}

function StatusBadge({
  row,
  isSelected,
}: {
  row: ParsedServiceCall;
  isSelected: boolean;
}) {
  if (row.rowStatus === "error") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger className="cursor-default">
            <Badge variant="destructive" className="text-xs">
              Error
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <ul className="list-disc pl-3 text-xs">
              {row.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (row.rowStatus === "existing") {
    if (isSelected) {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs dark:bg-amber-900/30 dark:text-amber-400">
          Update
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        Skip
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs dark:bg-green-900/30 dark:text-green-400">
      New
    </Badge>
  );
}

export function PreviewTable({
  rows,
  selectedRows,
  onSelectionChange,
  onImport,
  onCancel,
  importing,
}: PreviewTableProps) {
  const selectableRows = rows.filter((r) => r.rowStatus !== "error");
  const allSelected =
    selectableRows.length > 0 &&
    selectableRows.every((r) => selectedRows.has(r.rowIndex));

  const newCount = rows.filter((r) => r.rowStatus === "new").length;
  const existingCount = rows.filter((r) => r.rowStatus === "existing").length;
  const errorCount = rows.filter((r) => r.rowStatus === "error").length;

  function toggleAll() {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(selectableRows.map((r) => r.rowIndex)));
    }
  }

  function toggleRow(rowIndex: number) {
    const next = new Set(selectedRows);
    if (next.has(rowIndex)) {
      next.delete(rowIndex);
    } else {
      next.add(rowIndex);
    }
    onSelectionChange(next);
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3 text-sm">
          <span>
            <span className="font-medium text-green-700 dark:text-green-400">
              {newCount}
            </span>{" "}
            new
          </span>
          {existingCount > 0 && (
            <span>
              <span className="font-medium text-amber-700 dark:text-amber-400">
                {existingCount}
              </span>{" "}
              duplicates
            </span>
          )}
          {errorCount > 0 && (
            <span>
              <span className="font-medium text-red-700 dark:text-red-400">
                {errorCount}
              </span>{" "}
              errors
            </span>
          )}
          <span className="text-muted-foreground">
            &mdash; {selectedRows.size} selected for import
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onImport}
            disabled={importing || selectedRows.size === 0}
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {importing ? "Importing..." : `Import ${selectedRows.size} Rows`}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </TableHead>
                <TableHead className="w-16">Status</TableHead>
                <TableHead className="w-24">R-Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead className="w-24">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...rows].sort((a, b) => {
                const aSelected = selectedRows.has(a.rowIndex) ? 0 : 1;
                const bSelected = selectedRows.has(b.rowIndex) ? 0 : 1;
                return aSelected - bSelected;
              }).map((row) => {
                const isError = row.rowStatus === "error";
                const isSelected = selectedRows.has(row.rowIndex);
                const isDimmed =
                  isError || (row.rowStatus === "existing" && !isSelected);
                return (
                  <TableRow
                    key={row.rowIndex}
                    className={isDimmed ? "opacity-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(row.rowIndex)}
                        disabled={isError}
                        aria-label={`Select row ${row.rNumber}`}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge row={row} isSelected={isSelected} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.rNumber}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">
                      {row.customerName}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {row.machineInfo}
                    </TableCell>
                    <TableCell className="text-sm">
                      {row.operatorAssigned ? (
                        <span className="flex items-center gap-1">
                          {row.operatorAssigned}
                          {!row.matchedTechnicianId && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="cursor-default">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  No matching technician found
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.dateOpened}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
