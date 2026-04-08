"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { parseWorkbook, markExistingCalls, ParsedServiceCall } from "@/lib/porParser";
import { FileDropZone } from "@/components/import/FileDropZone";
import { PreviewTable } from "@/components/import/PreviewTable";
import { ImportResults } from "@/components/import/ImportResults";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileSpreadsheet, History, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

type ImportState =
  | { phase: "idle" }
  | { phase: "parsing"; fileName: string }
  | { phase: "preview"; rows: ParsedServiceCall[]; fileName: string }
  | { phase: "importing"; progress: number; total: number }
  | { phase: "results"; created: number; updated: number; skipped: number; errors: string[] };

const BATCH_SIZE = 25;

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ImportPage() {
  const { user } = useCurrentUser();
  const technicians = useQuery(api.technicians.list, { activeOnly: true });
  const importHistory = useQuery(api.csvImports.listImports);

  const [state, setState] = useState<ImportState>({ phase: "idle" });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Collect rNumbers for duplicate checking (only when in preview)
  const rNumbersToCheck = useMemo(() => {
    if (state.phase === "preview") {
      return state.rows
        .filter((r) => r.rowStatus !== "error")
        .map((r) => r.rNumber);
    }
    return null;
  }, [state]);

  const existingCalls = useQuery(
    api.csvImports.checkExistingRNumbers,
    rNumbersToCheck ? { rNumbers: rNumbersToCheck } : "skip"
  );

  // Once existingCalls loads, update rows with duplicate status
  const displayRows = useMemo(() => {
    if (state.phase !== "preview") return [];
    if (!existingCalls) return state.rows; // still loading
    return markExistingCalls(state.rows, existingCalls);
  }, [state, existingCalls]);

  // Deselect duplicates once they're detected (default to skip)
  useEffect(() => {
    const existingIndexes = displayRows
      .filter((r) => r.rowStatus === "existing")
      .map((r) => r.rowIndex);
    if (existingIndexes.length === 0) return;
    setSelectedRows((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const idx of existingIndexes) {
        if (next.has(idx)) {
          next.delete(idx);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [displayRows]);

  const createImportRecord = useMutation(api.csvImports.createImportRecord);
  const processBatch = useMutation(api.csvImports.processBatch);
  const updateImportStatus = useMutation(api.csvImports.updateImportStatus);

  // ─── File Selection ──────────────────────────────────────────────────────

  const handleFileSelected = useCallback(
    (file: File) => {
      if (!technicians) {
        toast.error("Technicians not loaded yet. Please wait.");
        return;
      }

      setState({ phase: "parsing", fileName: file.name });

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const { rows, missingColumns } = parseWorkbook(buffer, technicians);

          if (missingColumns.length > 0) {
            toast.error(
              `Missing required columns: ${missingColumns.join(", ")}. Check that this is a Point of Rental export.`
            );
            setState({ phase: "idle" });
            return;
          }

          if (rows.length === 0) {
            toast.error("No data rows found in the spreadsheet.");
            setState({ phase: "idle" });
            return;
          }

          // Auto-select all non-error rows initially
          // (duplicates get deselected once detected, via the effect below)
          const selectable = rows
            .filter((r) => r.rowStatus !== "error")
            .map((r) => r.rowIndex);
          setSelectedRows(new Set(selectable));

          setState({ phase: "preview", rows, fileName: file.name });
          toast.success(`Parsed ${rows.length} rows from ${file.name}`);
        } catch (err) {
          toast.error(
            `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}`
          );
          setState({ phase: "idle" });
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file.");
        setState({ phase: "idle" });
      };

      reader.readAsArrayBuffer(file);
    },
    [technicians]
  );

  // ─── Import Execution ────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    if (state.phase !== "preview") return;

    const rowsToImport = displayRows.filter((r) => selectedRows.has(r.rowIndex));
    if (rowsToImport.length === 0) return;

    // Chunk into batches
    const batches: ParsedServiceCall[][] = [];
    for (let i = 0; i < rowsToImport.length; i += BATCH_SIZE) {
      batches.push(rowsToImport.slice(i, i + BATCH_SIZE));
    }

    setState({ phase: "importing", progress: 0, total: batches.length });

    let totalCreated = 0;
    let totalUpdated = 0;
    const allErrors: string[] = [];

    try {
      const importId = await createImportRecord({
        fileName: state.fileName,
        rowCount: rowsToImport.length,
        importedBy: user?.name ?? user?.email ?? "Unknown",
      });

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const isLastBatch = i === batches.length - 1;

        try {
          const result = await processBatch({
            importId,
            rows: batch.map((row) => ({
              rNumber: row.rNumber,
              customerName: row.customerName,
              contactName: row.contactName,
              contactPhone: row.contactPhone,
              machineInfo: row.machineInfo,
              itemName: row.itemName,
              complaint: row.complaint,
              address: row.address,
              city: row.city,
              postalCode: row.postalCode,
              dateOpened: row.dateOpened,
              dateClosed: row.dateClosed,
              scheduledDate: row.scheduledDate,
              matchedTechnicianId: row.matchedTechnicianId as Id<"technicians"> | undefined,
            })),
            isLastBatch,
          });

          totalCreated += result.created;
          totalUpdated += result.updated;
          allErrors.push(...result.errors);
        } catch (err) {
          allErrors.push(
            `Batch ${i + 1} failed: ${err instanceof Error ? err.message : "Unknown error"}`
          );
        }

        setState({
          phase: "importing",
          progress: i + 1,
          total: batches.length,
        });
      }

      // If there were batch-level errors and we didn't reach the last batch cleanly,
      // mark the import as failed
      if (allErrors.length > 0) {
        try {
          await updateImportStatus({
            id: importId,
            status: "failed",
            errors: allErrors,
          });
        } catch {
          // Best-effort status update
        }
      }
    } catch (err) {
      allErrors.push(
        `Import setup failed: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }

    const skipped = rowsToImport.length - totalCreated - totalUpdated;
    setState({
      phase: "results",
      created: totalCreated,
      updated: totalUpdated,
      skipped: Math.max(0, skipped),
      errors: allErrors,
    });

    if (allErrors.length === 0) {
      toast.success(`Import complete: ${totalCreated} created, ${totalUpdated} updated`);
    } else {
      toast.warning(`Import finished with ${allErrors.length} error(s)`);
    }
  }, [state, displayRows, selectedRows, user, createImportRecord, processBatch, updateImportStatus]);

  // ─── Reset ───────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setState({ phase: "idle" });
    setSelectedRows(new Set());
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Import Service Calls</h1>
        <p className="text-sm text-muted-foreground">
          Upload a Point of Rental export (.xls or .xlsx) to bulk-create or update service calls
        </p>
      </div>

      {/* State machine render */}
      {state.phase === "idle" && (
        <FileDropZone
          onFileSelected={handleFileSelected}
          disabled={!technicians}
        />
      )}

      {state.phase === "parsing" && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Parsing {state.fileName}...
          </p>
        </div>
      )}

      {state.phase === "preview" && (
        <PreviewTable
          rows={displayRows}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          onImport={handleImport}
          onCancel={handleReset}
          importing={false}
        />
      )}

      {state.phase === "importing" && (
        <div className="flex flex-col items-center gap-4 rounded-lg border p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <div className="text-center">
            <p className="text-sm font-medium">Importing...</p>
            <p className="text-xs text-muted-foreground">
              Processing batch {state.progress} of {state.total}
            </p>
          </div>
          <div className="h-2 w-64 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${state.total > 0 ? (state.progress / state.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {state.phase === "results" && (
        <ImportResults
          created={state.created}
          updated={state.updated}
          skipped={state.skipped}
          errors={state.errors}
          onReset={handleReset}
        />
      )}

      {/* Import history — only show when idle or after results */}
      {(state.phase === "idle" || state.phase === "results") && importHistory && importHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <History className="h-4 w-4" />
              Import History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {importHistory.map((imp) => (
                <div
                  key={imp._id}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{imp.fileName}</span>
                    <span className="text-xs text-muted-foreground">
                      {imp.rowCount} rows
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        imp.status === "completed"
                          ? "default"
                          : imp.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {imp.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(imp.importedAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
