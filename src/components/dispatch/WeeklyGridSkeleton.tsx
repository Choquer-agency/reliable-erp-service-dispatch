import { Skeleton } from "@/components/ui/skeleton";

export function WeeklyGridSkeleton() {
  const dayCount = 6;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `110px repeat(${dayCount}, minmax(130px, 1fr))`,
        gap: "4px",
      }}
    >
      {/* Header row: corner + day labels */}
      <div className="h-10" />
      {Array.from({ length: dayCount }).map((_, i) => (
        <div key={i} className="h-10 flex items-center justify-center">
          <Skeleton className="h-4 w-16" />
        </div>
      ))}

      {/* Technician rows */}
      {Array.from({ length: 4 }).map((_, row) => (
        <div key={row} className="contents">
          <div className="flex items-center gap-2 px-3 py-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          {Array.from({ length: dayCount }).map((_, col) => (
            <div key={col} className="min-h-[60px] rounded-md p-1 space-y-1">
              <Skeleton className="h-14 w-full rounded" />
              {row % 2 === 0 && <Skeleton className="h-14 w-full rounded" />}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
