import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeProps = {
  status: string;
};

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  safe: {
    label: "Active",
    className: "bg-green-100 text-green-700 border-green-200",
  },
  warning: {
    label: "Warning",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  overdue: {
    label: "Overdue",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  inactive: {
    label: "Paused",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  not_started: {
    label: "Not Started",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.not_started;

  return (
    <Badge
      variant="outline"
      className={cn("border px-2.5 py-0.5 text-xs font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}
