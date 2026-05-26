import { useState, useEffect, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2Icon, SaveIcon } from "lucide-react";

type Settings = {
  check_in_interval_days: number;
  warning_hours_before: number;
  alert_message: string;
  is_active: boolean;
};

export function SettingsPage() {
  const { refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const settingsQuery = useQuery<Settings>({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get("/api/settings");
      return data;
    },
  });

  const [intervalDays, setIntervalDays] = useState(7);
  const [warningHours, setWarningHours] = useState(24);
  const [alertMessage, setAlertMessage] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Sync form state when data loads
  useEffect(() => {
    if (settingsQuery.data) {
      setIntervalDays(settingsQuery.data.check_in_interval_days);
      setWarningHours(settingsQuery.data.warning_hours_before);
      setAlertMessage(settingsQuery.data.alert_message ?? "");
      setIsActive(settingsQuery.data.is_active);
    }
  }, [settingsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Settings>) => {
      const { data } = await api.put("/api/settings", updates);
      return data;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["check-in-status"] });
      refreshUser();
    },
    onError: () => {
      toast.error("Could not save settings. Please try again.");
    },
  });

  const handleScheduleSave = (e: FormEvent) => {
    e.preventDefault();
    const clampedDays = Math.max(1, Math.min(30, intervalDays));
    const clampedHours = Math.max(1, Math.min(72, warningHours));
    setIntervalDays(clampedDays);
    setWarningHours(clampedHours);
    updateMutation.mutate({
      check_in_interval_days: clampedDays,
      warning_hours_before: clampedHours,
    });
  };

  const handleMessageSave = (e: FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ alert_message: alertMessage });
  };

  const handleToggleActive = (checked: boolean) => {
    setIsActive(checked);
    updateMutation.mutate({ is_active: checked });
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your check-in schedule and preferences.
        </p>
      </div>

      {/* Check-in Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Check-in Schedule</CardTitle>
          <CardDescription>
            How often you'd like to check in and when to start sending warnings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleScheduleSave} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="interval-days">Check-in every (days)</Label>
                <Input
                  id="interval-days"
                  type="number"
                  min={1}
                  max={30}
                  value={intervalDays}
                  onChange={(e) =>
                    setIntervalDays(parseInt(e.target.value, 10) || 1)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Between 1 and 30 days
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="warning-hours">
                  Warning (hours before deadline)
                </Label>
                <Input
                  id="warning-hours"
                  type="number"
                  min={1}
                  max={72}
                  value={warningHours}
                  onChange={(e) =>
                    setWarningHours(parseInt(e.target.value, 10) || 1)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Between 1 and 72 hours
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SaveIcon className="size-4" />
                )}
                Save Schedule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Alert Message */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Message</CardTitle>
          <CardDescription>
            This message is included when your emergency contacts are notified.
            Share anything important they should know.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMessageSave} className="flex flex-col gap-4">
            <Textarea
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              placeholder="e.g., Please check on my pets at 123 Main St. My neighbor has a spare key."
              rows={4}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SaveIcon className="size-4" />
                )}
                Save Message
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>
            Pause or resume your check-in schedule. While paused, no reminders
            or alerts will be sent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {isActive ? "Service is active" : "Service is paused"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? "You'll receive reminders and your contacts will be alerted if you miss a check-in."
                  : "No reminders or alerts will be sent until you resume."}
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={handleToggleActive}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
