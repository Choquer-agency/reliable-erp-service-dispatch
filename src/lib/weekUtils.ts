/**
 * Returns the Monday of the week containing the given date.
 */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns 5 ISO date strings (Mon–Fri) starting from a Monday.
 */
export function getWeekDates(monday: Date): string[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  });
}

/**
 * Formats a date range for display, e.g. "Apr 7 – 12, 2026"
 */
export function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return "";
  const start = parseLocalDate(dates[0]);
  const end = parseLocalDate(dates[dates.length - 1]);

  const startMonth = start.toLocaleString("en-US", { month: "short" });
  const endMonth = end.toLocaleString("en-US", { month: "short" });
  const year = start.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${year}`;
  }
  return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${year}`;
}

/**
 * Returns a short day label, e.g. "Mon Apr 7"
 */
export function dayLabel(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  const day = d.toLocaleString("en-US", { weekday: "short" });
  const month = d.toLocaleString("en-US", { month: "short" });
  return `${day} ${month} ${d.getDate()}`;
}

/**
 * Returns the number of days since the given ISO date string.
 */
export function daysSince(dateStr: string): number {
  const then = parseLocalDate(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Converts a Date to an ISO date string (YYYY-MM-DD) in local time.
 */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parses an ISO date string (YYYY-MM-DD) as a local date (avoids timezone offset issues).
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}
