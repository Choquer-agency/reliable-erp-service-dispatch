"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Plus,
  RefreshCw,
  SkipForward,
  AlertTriangle,
  ArrowRight,
  Upload,
} from "lucide-react";

interface ImportResultsProps {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
  onReset: () => void;
}

function StatCard({
  label,
  count,
  icon: Icon,
  color,
}: {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-full p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ImportResults({
  created,
  updated,
  skipped,
  errors,
  onReset,
}: ImportResultsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Import Complete</h3>
        <p className="text-sm text-muted-foreground">
          {created + updated} service calls processed successfully
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Created"
          count={created}
          icon={Plus}
          color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          label="Updated"
          count={updated}
          icon={RefreshCw}
          color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          label="Skipped"
          count={skipped}
          icon={SkipForward}
          color="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
        />
        <StatCard
          label="Errors"
          count={errors.length}
          icon={AlertTriangle}
          color={
            errors.length > 0
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
          }
        />
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="mb-2 text-sm font-medium text-red-800 dark:text-red-400">
            Error Details
          </p>
          <ul className="space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-xs text-red-700 dark:text-red-300">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onReset}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Import Another File
        </Button>
        <Link href="/dashboard" className={buttonVariants()}>
          Go to Dispatch Board
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
