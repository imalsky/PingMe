import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ActivityIcon } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <ActivityIcon className="size-10 text-muted-foreground" />
      <div>
        <h1 className="font-heading text-4xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
      </div>
      <Link to="/">
        <Button variant="outline">Back to home</Button>
      </Link>
    </div>
  );
}
