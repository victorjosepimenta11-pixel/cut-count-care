import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Users, LogOut, Scissors } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  const nav = [
    { to: "/", label: "Início", icon: LayoutDashboard },
    { to: "/clientes", label: "Clientes", icon: Users },
  ] as const;

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-0">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center shadow-lg shadow-primary/20">
              <Scissors className="h-5 w-5" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">BarberPro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((n) => {
              const active = loc.pathname === n.to || (n.to === "/clientes" && loc.pathname.startsWith("/clientes"));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
              title={user?.email ?? ""}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={async () => {
              await signOut();
              navigate({ to: "/login" });
            }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-10">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 backdrop-blur-xl bg-background/85 border-t border-border">
        <div className="grid grid-cols-2 max-w-md mx-auto">
          {nav.map((n) => {
            const Icon = n.icon;
            const active = loc.pathname === n.to || (n.to === "/clientes" && loc.pathname.startsWith("/clientes"));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-xs ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
