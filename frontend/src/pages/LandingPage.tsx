import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  ActivityIcon,
  CalendarCheckIcon,
  BellRingIcon,
  ShieldCheckIcon,
  HeartPulseIcon,
  UsersIcon,
} from "lucide-react";

const steps = [
  {
    icon: CalendarCheckIcon,
    title: "Set your schedule",
    description:
      "Choose how often you'd like to check in - daily, every few days, or weekly. You're in full control.",
  },
  {
    icon: HeartPulseIcon,
    title: "Check in regularly",
    description:
      "A simple tap lets us know you're doing well. It takes less than a second, from any device.",
  },
  {
    icon: BellRingIcon,
    title: "Your contacts are notified",
    description:
      "If you miss a check-in, we'll reach out to the people you trust to make sure you're OK.",
  },
];

const features = [
  {
    icon: ShieldCheckIcon,
    title: "Private & Secure",
    description: "Your data is encrypted and never shared. We only reach out when you need us to.",
  },
  {
    icon: UsersIcon,
    title: "Multiple Contacts",
    description: "Add family, friends, or neighbors. Everyone who matters can be in the loop.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Flexible Schedule",
    description: "Check in daily, weekly, or anything in between. Adjust anytime as your routine changes.",
  },
];

export function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 font-heading text-lg font-semibold">
            <ActivityIcon className="size-5 text-green-600" />
            PingMe
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
            <HeartPulseIcon className="size-4" />
            Wellness check-ins for peace of mind
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Never leave your loved ones wondering
          </h1>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            PingMe is a simple wellness check that keeps the people who care
            about you informed. Just check in regularly, and we'll handle the
            rest.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="w-full px-8 sm:w-auto">
                Create your free account
              </Button>
            </Link>
            <Link to="/login">
              <Button
                variant="outline"
                size="lg"
                className="w-full px-8 sm:w-auto"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center font-heading text-2xl font-bold sm:text-3xl">
            How it works
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Three simple steps to keep your loved ones at ease.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <step.icon className="size-7" />
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Step {i + 1}
                </div>
                <h3 className="font-heading text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center font-heading text-2xl font-bold sm:text-3xl">
            Built with care
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6"
              >
                <feature.icon className="mb-3 size-6 text-green-600" />
                <h3 className="font-heading text-base font-semibold">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ActivityIcon className="size-4 text-green-600" />
              PingMe
            </div>
            <p className="text-xs text-muted-foreground">
              Your wellness, their peace of mind.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
