import * as XLSX from "xlsx";
import { format, isValid, parse } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ParsedServiceCall = {
  rowIndex: number;
  rNumber: string;
  customerName: string;
  contactName?: string;
  contactPhone?: string;
  machineInfo: string;
  itemName?: string;
  complaint: string;
  address?: string;
  city?: string;
  postalCode?: string;
  dateOpened: string; // YYYY-MM-DD
  dateClosed?: string; // YYYY-MM-DD
  scheduledDate: string; // YYYY-MM-DD — defaults to dateOpened
  operatorAssigned?: string; // raw name from POR
  matchedTechnicianId?: string; // resolved Id from technicians list
  rowStatus: "new" | "existing" | "error";
  errors: string[];
  existingCallId?: string;
};

type Technician = {
  _id: string;
  name: string;
};

// Map of POR column headers (lowercase) → raw row keys
const COLUMN_MAP: Record<string, string> = {
  contract: "Contract",
  "date open": "Date Open",
  "item name": "Item Name",
  description: "Description",
  location: "Location",
  contact: "Contact",
  phone: "Phone",
  address: "Address",
  city: "City",
  zip: "Zip",
  "operator assigned": "Operator Assigned",
  "date closed": "Date Closed",
};

// ─── Description Parser ──────────────────────────────────────────────────────

/**
 * Extracts machine model and unit number from POR Description field.
 *
 * Patterns seen in POR exports:
 *   "Service Call - S65 - #4443 - Midland"
 *   "Service Call - GS-2632 - #5601 - Burke Mountain"
 *   "Service Call - S-85N - #3344 - Apollo"
 *   "Service Call - S-65 D-GEN - #4443 - Home Craft"
 *   "Service Call - #8435 - 1930 - Keystone"  (unit first, model second)
 */
export function parseMachineInfo(description: string): string {
  if (!description) return "";

  // Pattern A: "Service Call - MODEL - #UNIT - CUSTOMER"
  const patternA = description.match(
    /Service\s+Call\s*-\s*([A-Za-z0-9\s-]+?)\s*-\s*#(\d+)/i
  );
  if (patternA) {
    const model = patternA[1].trim();
    const unit = patternA[2];
    return `${model} - #${unit}`;
  }

  // Pattern B: "Service Call - #UNIT - MODEL - CUSTOMER" (unit before model)
  const patternB = description.match(
    /Service\s+Call\s*-\s*#(\d+)\s*-\s*([A-Za-z0-9\s-]+?)\s*-/i
  );
  if (patternB) {
    const unit = patternB[1];
    const model = patternB[2].trim();
    return `${model} - #${unit}`;
  }

  // Fallback: try to grab anything after "Service Call -"
  const fallback = description.match(/Service\s+Call\s*-\s*(.+)/i);
  if (fallback) {
    // Take first two segments
    const parts = fallback[1].split("-").map((s) => s.trim());
    return parts.slice(0, 2).join(" - ");
  }

  return description;
}

// ─── Technician Matching ─────────────────────────────────────────────────────

/**
 * Three-tier deterministic match: exact → last name → first name.
 * Returns technician _id or undefined.
 */
export function matchTechnician(
  operatorName: string,
  technicians: Technician[]
): string | undefined {
  const normalized = operatorName.trim().toLowerCase();
  if (!normalized) return undefined;

  // 1. Exact match (case-insensitive)
  const exact = technicians.find((t) => t.name.toLowerCase() === normalized);
  if (exact) return exact._id;

  // 2. Last-name match ("Yi" → "Brian Yi")
  const lastNameMatch = technicians.find((t) => {
    const parts = t.name.toLowerCase().split(/\s+/);
    return parts[parts.length - 1] === normalized;
  });
  if (lastNameMatch) return lastNameMatch._id;

  // 3. First-name match ("Brian" → "Brian Yi")
  const firstNameMatch = technicians.find((t) =>
    t.name.toLowerCase().startsWith(normalized + " ")
  );
  if (firstNameMatch) return firstNameMatch._id;

  return undefined;
}

// ─── Date Parsing ────────────────────────────────────────────────────────────

/**
 * Parses various POR date formats into YYYY-MM-DD.
 * Handles: JS Date objects (from SheetJS cellDates), date strings, etc.
 */
function parseDate(value: unknown): string | null {
  if (!value) return null;

  // SheetJS with cellDates:true may return a Date object
  if (value instanceof Date) {
    if (!isValid(value)) return null;
    return format(value, "yyyy-MM-dd");
  }

  const str = String(value).trim();
  if (!str) return null;

  // Try common date formats
  const formats = [
    "yyyy-MM-dd",
    "MM/dd/yyyy",
    "M/d/yyyy",
    "MM-dd-yyyy",
    "dd/MM/yyyy",
    "MMM d, yyyy",
    "MMMM d, yyyy",
  ];

  for (const fmt of formats) {
    const parsed = parse(str, fmt, new Date());
    if (isValid(parsed)) {
      return format(parsed, "yyyy-MM-dd");
    }
  }

  // Last resort: try native Date parsing
  const nativeParsed = new Date(str);
  if (isValid(nativeParsed)) {
    return format(nativeParsed, "yyyy-MM-dd");
  }

  return null;
}

// ─── R-Number Normalization ──────────────────────────────────────────────────

function normalizeRNumber(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  // Ensure lowercase "r" prefix
  if (/^\d+$/.test(trimmed)) return `r${trimmed}`;
  if (/^R\d+$/.test(trimmed)) return `r${trimmed.slice(1)}`;
  return trimmed.toLowerCase();
}

// ─── Header Resolution ──────────────────────────────────────────────────────

/**
 * Maps actual spreadsheet headers to our canonical column names.
 * Case-insensitive, trimmed matching.
 */
function resolveHeaders(
  headers: string[]
): Record<string, number> {
  const resolved: Record<string, number> = {};
  const canonical = Object.keys(COLUMN_MAP);

  for (let i = 0; i < headers.length; i++) {
    const headerLower = (headers[i] || "").trim().toLowerCase();
    for (const key of canonical) {
      if (headerLower === key && !(key in resolved)) {
        resolved[COLUMN_MAP[key]] = i;
        break;
      }
    }
  }
  return resolved;
}

// ─── Main Parse Function ─────────────────────────────────────────────────────

export function parseWorkbook(
  buffer: ArrayBuffer,
  technicians: Technician[]
): { rows: ParsedServiceCall[]; missingColumns: string[] } {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    return { rows: [], missingColumns: [] };
  }

  // Parse sheet to array of arrays (preserves date objects)
  const raw: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, {
    header: 1,
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd",
  });

  if (raw.length < 2) {
    return { rows: [], missingColumns: [] };
  }

  // First row is headers
  const headers = (raw[0] as string[]).map((h) => String(h || ""));
  const colMap = resolveHeaders(headers);

  // Check for required columns
  const required = ["Contract", "Description", "Location"];
  const missingColumns = required.filter((col) => !(col in colMap));
  if (missingColumns.length > 0) {
    return { rows: [], missingColumns };
  }

  const getCell = (row: unknown[], colName: string): string => {
    const idx = colMap[colName];
    if (idx === undefined) return "";
    const val = row[idx];
    if (val === null || val === undefined) return "";
    return String(val).trim();
  };

  const getCellRaw = (row: unknown[], colName: string): unknown => {
    const idx = colMap[colName];
    if (idx === undefined) return "";
    return row[idx];
  };

  // Parse data rows
  const parsed: ParsedServiceCall[] = [];
  const seenRNumbers = new Map<string, number>(); // rNumber → index in parsed[]

  for (let i = 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row || row.every((cell) => !cell)) continue; // skip empty rows

    const rNumberRaw = getCell(row, "Contract");
    const customerName = getCell(row, "Location");
    const description = getCell(row, "Description");

    // Skip rows where all required fields are empty (garbage/trailing rows)
    if (!rNumberRaw.trim() && !customerName && !description) continue;

    const errors: string[] = [];

    const rNumber = normalizeRNumber(rNumberRaw);
    if (!rNumber) errors.push("Missing R-Number (Contract)");

    if (!customerName) errors.push("Missing Customer (Location)");

    if (!description) errors.push("Missing Description");

    const machineInfo = description ? parseMachineInfo(description) : "";
    if (!machineInfo && description) errors.push("Could not parse machine info from Description");

    const dateOpenedRaw = getCellRaw(row, "Date Open");
    const dateOpened = parseDate(dateOpenedRaw);
    if (!dateOpened) errors.push("Invalid or missing Date Open");

    const dateClosedRaw = getCellRaw(row, "Date Closed");
    const dateClosed = parseDate(dateClosedRaw) ?? undefined;

    const operatorAssigned = getCell(row, "Operator Assigned");
    const matchedTechnicianId = operatorAssigned
      ? matchTechnician(operatorAssigned, technicians)
      : undefined;

    const entry: ParsedServiceCall = {
      rowIndex: i,
      rNumber: rNumber || `row-${i}`,
      customerName: customerName || "Unknown",
      contactName: getCell(row, "Contact") || undefined,
      contactPhone: getCell(row, "Phone") || undefined,
      machineInfo: machineInfo || description || "Unknown",
      itemName: getCell(row, "Item Name") || undefined,
      complaint: description || "No description provided",
      address: getCell(row, "Address") || undefined,
      city: getCell(row, "City") || undefined,
      postalCode: getCell(row, "Zip") || undefined,
      dateOpened: dateOpened || new Date().toISOString().split("T")[0],
      dateClosed,
      scheduledDate: dateOpened || new Date().toISOString().split("T")[0],
      operatorAssigned: operatorAssigned || undefined,
      matchedTechnicianId,
      rowStatus: errors.length > 0 ? "error" : "new",
      errors,
    };

    // Deduplicate: if same rNumber seen before, keep the later occurrence
    if (rNumber && seenRNumbers.has(rNumber)) {
      const prevIdx = seenRNumbers.get(rNumber)!;
      parsed[prevIdx] = entry;
      // Don't change seenRNumbers — same index
    } else {
      if (rNumber) seenRNumbers.set(rNumber, parsed.length);
      parsed.push(entry);
    }
  }

  return { rows: parsed, missingColumns: [] };
}

/**
 * Marks rows that have existing rNumbers in the database.
 */
export function markExistingCalls(
  rows: ParsedServiceCall[],
  existingCalls: Array<{ rNumber: string; _id: string }>
): ParsedServiceCall[] {
  const existingMap = new Map(existingCalls.map((c) => [c.rNumber, c._id]));

  return rows.map((row) => {
    const existingId = existingMap.get(row.rNumber);
    if (existingId && row.rowStatus !== "error") {
      return { ...row, rowStatus: "existing" as const, existingCallId: existingId };
    }
    return row;
  });
}
