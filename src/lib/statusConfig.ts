export type ServiceCallStatus =
  | "unassigned"
  | "assigned"
  | "swap_required"
  | "return_with_parts"
  | "transfer_to_shop"
  | "billable_to_customer"
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
  swap_required: {
    border: "border-l-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  return_with_parts: {
    border: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
  },
  transfer_to_shop: {
    border: "border-l-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-600",
    badge: "bg-purple-100 text-purple-700",
    dot: "bg-purple-500",
  },
  billable_to_customer: {
    border: "border-l-cyan-500",
    bg: "bg-cyan-50",
    text: "text-cyan-600",
    badge: "bg-cyan-100 text-cyan-700",
    dot: "bg-cyan-500",
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
  swap_required: "Unit Swap Required",
  return_with_parts: "Need to Return with Parts",
  transfer_to_shop: "Transfer Repair to Shop",
  billable_to_customer: "Billable to Customer",
  completed: "Completed",
};

export const ALLOWED_TRANSITIONS: Record<ServiceCallStatus, ServiceCallStatus[]> = {
  unassigned: ["assigned"],
  assigned: ["swap_required", "return_with_parts", "transfer_to_shop", "billable_to_customer", "completed", "unassigned"],
  swap_required: ["assigned", "completed"],
  return_with_parts: ["assigned", "completed"],
  transfer_to_shop: ["assigned", "completed"],
  billable_to_customer: ["assigned", "completed"],
  completed: [],
};

// Legacy status display support — so old data doesn't crash the UI
export const LEGACY_STATUS_LABELS: Record<string, string> = {
  in_progress: "In Progress (legacy)",
  on_hold: "On Hold (legacy)",
  needs_return: "Needs Return (legacy)",
};

export const LEGACY_STATUS_COLORS = {
  border: "border-l-gray-300",
  bg: "bg-gray-50",
  text: "text-gray-500",
  badge: "bg-gray-100 text-gray-600",
  dot: "bg-gray-300",
};
