import { Link, useRouterState } from "@tanstack/react-router";
import { Home, History, BarChart3, Settings as SettingsIcon } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/history", label: "History", icon: History },
  { to: "/stats", label: "Stats", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="sticky bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon }) => {
          const active = path === to;
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={
                  "flex flex-col items-center gap-1 py-2.5 text-xs transition-colors " +
                  (active ? "text-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                <Icon className={"h-5 w-5 " + (active ? "opacity-100" : "opacity-70")} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-6 pt-5">{children}</main>
      <BottomNav />
    </div>
  );
}