import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  UserIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
  ActivityIcon,
} from "lucide-react";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/contacts", label: "Contacts" },
  { to: "/settings", label: "Settings" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar */}
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-heading text-lg font-semibold"
          >
            <ActivityIcon className="size-5 text-green-600" />
            PingMe
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}>
                <Button
                  variant={
                    location.pathname === link.to ? "secondary" : "ghost"
                  }
                  size="sm"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Right side: user menu (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-2">
            {/* Desktop user dropdown */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="sm" />}
                >
                  <UserIcon className="size-4" />
                  <span className="max-w-[120px] truncate">
                    {user?.name ?? "Account"}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8}>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOutIcon className="size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="sm:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XIcon className="size-5" />
              ) : (
                <MenuIcon className="size-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t px-4 pb-4 pt-2 sm:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={
                      location.pathname === link.to ? "secondary" : "ghost"
                    }
                    className="w-full justify-start"
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              <div className="my-2 h-px bg-border" />
              <div className="px-2.5 py-1 text-xs text-muted-foreground">
                {user?.email}
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                <LogOutIcon className="size-4" />
                Log out
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
