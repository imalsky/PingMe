import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  ActivityIcon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
} from "lucide-react";
import { getAccessToken } from "@/services/api";

type QuickCheckInResult = {
  message: string;
  next_deadline: string;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "full",
  timeStyle: "short",
});

export function QuickCheckInPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [result, setResult] = useState<QuickCheckInResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const isLoggedIn = !!getAccessToken();

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMessage("No check-in token provided.");
      return;
    }

    let cancelled = false;

    const doCheckIn = async () => {
      try {
        const { data } = await api.post<QuickCheckInResult>(
          `/api/check-in/quick?token=${encodeURIComponent(token)}`
        );
        if (!cancelled) {
          setResult(data);
          setState("success");
        }
      } catch {
        if (!cancelled) {
          setState("error");
          setErrorMessage("Invalid or expired check-in link.");
        }
      }
    };

    doCheckIn();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <ActivityIcon className="size-6 text-green-600" />
          <span className="font-heading text-xl font-semibold">PingMe</span>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            {state === "loading" && (
              <>
                <Loader2Icon className="size-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Processing your check-in...
                </p>
              </>
            )}

            {state === "success" && result && (
              <>
                <div className="flex size-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2Icon className="size-8 text-green-600" />
                </div>
                <h2 className="font-heading text-lg font-semibold">
                  You're checked in!
                </h2>
                <p className="text-center text-sm text-muted-foreground">
                  Your next deadline is{" "}
                  <span className="font-medium text-foreground">
                    {dateFormatter.format(new Date(result.next_deadline))}
                  </span>
                </p>
                <Link to={isLoggedIn ? "/dashboard" : "/login"} className="mt-2">
                  <Button variant="outline">
                    {isLoggedIn ? "Go to Dashboard" : "Sign In"}
                  </Button>
                </Link>
              </>
            )}

            {state === "error" && (
              <>
                <div className="flex size-14 items-center justify-center rounded-full bg-red-100">
                  <XCircleIcon className="size-8 text-red-600" />
                </div>
                <h2 className="font-heading text-lg font-semibold">
                  Check-in failed
                </h2>
                <p className="text-center text-sm text-muted-foreground">
                  {errorMessage}
                </p>
                <Link to={isLoggedIn ? "/dashboard" : "/login"} className="mt-2">
                  <Button variant="outline">
                    {isLoggedIn ? "Go to Dashboard" : "Sign In"}
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
