export type ServiceCallStatus =
  | "unassigned"
  | "assigned"
  | "in_progress"
  | "on_hold"
  | "needs_return"
  | "completed";

export const STATUS_COLORS: Record<
  ServiceCallStatus,
  { border: string; bg: string; text: string; badge: string; dot: string }
> = {
  unassigned: {
    border: "border-l-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-600",
    badge: "bg-gray-100 text-gray-700",
    dot: "bg-gray-400",
  },
  assigned: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
  },
  in_progress: {
    border: "border-l-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  on_hold: {
    border: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
  needs_return: {
    border: "border-l-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
  },
  completed: {
    border: "border-l-green-500",
    bg: "bg-green-50",
    text: "text-green-600",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
};

export const STATUS_LABELS: Record<ServiceCallStatus, string> = {
  unassigned: "Unassigned",
  assigned: "Scheduled",
  in_progress: "In Progress",
  on_hold: "On Hold",
  needs_return: "Needs Return",
  completed: "Completed",
};

export const ALLOWED_TRANSITIONS: Record<ServiceCallStatus, ServiceCallStatus[]> = {
  unassigned: ["assigned"],
  assigned: ["in_progress", "unassigned"],
  in_progress: ["on_hold", "completed", "needs_return"],
  on_hold: ["in_progress", "completed"],
  needs_return: ["unassigned"],
  completed: [],
};
