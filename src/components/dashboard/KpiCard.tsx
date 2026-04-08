"use client";

import { Card, CardContent } from "@/components/ui/card";

type ColorLevel = "green" | "yellow" | "red" | "neutral";

const colorClasses: Record<ColorLevel, string> = {
  green: "text-emerald-600 dark:text-emerald-400",
  yellow: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
  neutral: "text-foreground",
};

export function KpiCard({
  label,
  value,
  subtitle,
  color = "neutral",
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: ColorLevel;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className={`text-2xl font-bold tabular-nums ${colorClasses[color]}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
