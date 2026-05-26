import { CheckCircle2Icon } from "lucide-react";

export type CheckInItem = {
  id: string;
  checked_in_at: string;
};

export type RecentCheckInsProps = {
  items: CheckInItem[];
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return dateFormatter.format(date);
}

export function RecentCheckIns({ items }: RecentCheckInsProps) {
  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No check-ins yet. Make your first one!
      </div>
    );
  }

  const displayed = items.slice(0, 10);

  return (
    <ul className="flex flex-col gap-2">
      {displayed.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50"
        >
          <CheckCircle2Icon className="size-4 shrink-0 text-green-500" />
          <span className="font-medium">Checked in</span>
          <span
            className="ml-auto text-xs text-muted-foreground"
            title={dateFormatter.format(new Date(item.checked_in_at))}
          >
            {formatRelative(item.checked_in_at)}
          </span>
        </li>
      ))}
    </ul>
  );
}
