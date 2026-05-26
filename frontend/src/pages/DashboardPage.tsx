import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { CheckInButton } from "@/components/CheckInButton";
import { CountdownTimer } from "@/components/CountdownTimer";
import { StatusBadge } from "@/components/StatusBadge";
import { RecentCheckIns, type CheckInItem } from "@/components/RecentCheckIns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2Icon, SparklesIcon } from "lucide-react";

type CheckInStatus = {
  last_check_in: string | null;
  next_deadline: string | null;
  time_remaining_seconds: number | null;
  status: "safe" | "warning" | "overdue" | "inactive" | "not_started";
};

type CheckInHistory = {
  items: CheckInItem[];
  total: number;
  page: number;
  per_page: number;
};

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const statusQuery = useQuery<CheckInStatus>({
    queryKey: ["check-in-status"],
    queryFn: async () => {
      const { data } = await api.get("/api/check-in/status");
      return data;
    },
    refetchInterval: 60_000,
  });

  const historyQuery = useQuery<CheckInHistory>({
    queryKey: ["check-in-history"],
    queryFn: async () => {
      const { data } = await api.get("/api/check-in/history", {
        params: { page: 1, per_page: 10 },
      });
      return data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/api/check-in");
      return data;
    },
    onSuccess: () => {
      toast.success("You're all checked in. Stay well!");
      queryClient.invalidateQueries({ queryKey: ["check-in-status"] });
      queryClient.invalidateQueries({ queryKey: ["check-in-history"] });
    },
    onError: () => {
      toast.error("Could not check in. Please try again.");
    },
  });

  const status = statusQuery.data?.status ?? "not_started";
  const isFirstTime = status === "not_started";

  if (statusQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl font-bold">
          {isFirstTime
            ? `Welcome, ${user?.name ?? "there"}!`
            : `Hey, ${user?.name ?? "there"}`}
        </h1>
        {isFirstTime ? (
          <p className="mt-1 text-muted-foreground">
            Make your first check-in to start your schedule.
          </p>
        ) : (
          <p className="mt-1 text-muted-foreground">
            Here's your wellness overview.
          </p>
        )}
      </div>

      {/* Status + Timer Card */}
      <Card>
        <CardContent className="flex flex-col items-center gap-6 py-8">
          {/* Status badge */}
          <StatusBadge status={status} />

          {/* Countdown */}
          <CountdownTimer
            nextDeadline={statusQuery.data?.next_deadline ?? null}
            status={status}
          />

          {/* The big check-in button */}
          <CheckInButton
            onCheckIn={() => checkInMutation.mutateAsync()}
            status={status}
            isLoading={checkInMutation.isPending}
          />

          {/* First-time prompt */}
          {isFirstTime && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
              <SparklesIcon className="size-4 shrink-0" />
              <span>
                Tap the button above to make your first check-in and activate
                your schedule.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent check-ins */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {historyQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <RecentCheckIns items={historyQuery.data?.items ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
