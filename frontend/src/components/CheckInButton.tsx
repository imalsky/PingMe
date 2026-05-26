import { useState } from "react";
import { Loader2Icon, CheckCircle2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckInButtonProps = {
  onCheckIn: () => Promise<void>;
  status: string;
  isLoading: boolean;
};

const statusStyles: Record<string, { bg: string; ring: string; text: string }> =
  {
    safe: {
      bg: "bg-green-500 hover:bg-green-600 active:bg-green-700",
      ring: "ring-green-300",
      text: "text-white",
    },
    warning: {
      bg: "bg-amber-500 hover:bg-amber-600 active:bg-amber-700",
      ring: "ring-amber-300",
      text: "text-white",
    },
    overdue: {
      bg: "bg-red-500 hover:bg-red-600 active:bg-red-700",
      ring: "ring-red-300",
      text: "text-white",
    },
    inactive: {
      bg: "bg-slate-400 hover:bg-slate-500 active:bg-slate-600",
      ring: "ring-slate-200",
      text: "text-white",
    },
    not_started: {
      bg: "bg-slate-500 hover:bg-slate-600 active:bg-slate-700",
      ring: "ring-slate-300",
      text: "text-white",
    },
  };

export function CheckInButton({
  onCheckIn,
  status,
  isLoading,
}: CheckInButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  const styles = statusStyles[status] ?? statusStyles.not_started;

  const handleClick = async () => {
    if (isLoading || showSuccess) return;
    try {
      await onCheckIn();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1500);
    } catch {
      // Error handling is done in the parent via toast
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "relative flex size-44 items-center justify-center rounded-full shadow-lg transition-all duration-200 sm:size-52",
        "ring-4 focus-visible:outline-none focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-70",
        "active:not-disabled:scale-95",
        showSuccess
          ? "bg-green-500 ring-green-300 text-white"
          : `${styles.bg} ${styles.ring} ${styles.text}`
      )}
    >
      {isLoading ? (
        <Loader2Icon className="size-10 animate-spin" />
      ) : showSuccess ? (
        <div className="flex flex-col items-center gap-1">
          <CheckCircle2Icon className="size-10" />
          <span className="text-sm font-medium">Done!</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold tracking-tight sm:text-3xl">
            CHECK IN
          </span>
          <span className="text-xs opacity-80 sm:text-sm">
            Tap to confirm you're OK
          </span>
        </div>
      )}
    </button>
  );
}
