import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export type CountdownTimerProps = {
  nextDeadline: string | null;
  status: string;
};

const statusColors: Record<string, string> = {
  safe: "text-green-600",
  warning: "text-amber-600",
  overdue: "text-red-600",
  inactive: "text-slate-400",
  not_started: "text-slate-500",
};

function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return "Overdue";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  return `${hours}h ${minutes}m ${seconds}s`;
}

export function CountdownTimer({ nextDeadline, status }: CountdownTimerProps) {
  const calculateRemaining = useCallback(() => {
    if (!nextDeadline) return null;
    return new Date(nextDeadline).getTime() - Date.now();
  }, [nextDeadline]);

  const [remaining, setRemaining] = useState<number | null>(
    calculateRemaining
  );

  useEffect(() => {
    if (!nextDeadline) {
      setRemaining(null);
      return;
    }

    // Recalculate immediately
    setRemaining(calculateRemaining());

    const interval = setInterval(() => {
      setRemaining(new Date(nextDeadline).getTime() - Date.now());
    }, 1000);

    // Recalculate on tab focus instead of relying on accumulated intervals
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setRemaining(new Date(nextDeadline).getTime() - Date.now());
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [nextDeadline, calculateRemaining]);

  const colorClass = statusColors[status] ?? statusColors.not_started;

  if (remaining === null) {
    return (
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Next check-in due</p>
        <p className="mt-1 text-lg font-medium text-slate-400">
          No deadline set
        </p>
      </div>
    );
  }

  const isOverdue = remaining <= 0;

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground">
        {isOverdue ? "Check-in overdue by" : "Next check-in due in"}
      </p>
      <p className={cn("mt-1 text-3xl font-bold tabular-nums", colorClass)}>
        {isOverdue ? formatTimeRemaining(Math.abs(remaining)) : formatTimeRemaining(remaining)}
      </p>
    </div>
  );
}
