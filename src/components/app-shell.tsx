import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  LayoutDashboard,
  Mail,
  FileText,
  ListChecks,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useQueryClient } from "@tanstack/react-query";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/email", label: "Email Generator", icon: Mail },
  { to: "/summarizer", label: "Meeting Summarizer", icon: FileText },
  { to: "/planner", label: "Task Planner", icon: ListChecks },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  useEffect(() => setMobileOpen(false), [path]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors closeButton position="top-right" />

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <SidebarContent path={path} email={email} onSignOut={signOut} />
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur px-4 h-14">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">AI Suite</span>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? "Close" : "Menu"}
        </Button>
      </header>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute left-0 top-0 h-full w-72 bg-sidebar border-r border-sidebar-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent path={path} email={email} onSignOut={signOut} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
          {children}
          <p className="mt-12 text-center text-xs text-muted-foreground">
            AI-generated content may contain inaccuracies. Review and edit all
            outputs before use for professional, legal, financial, medical, or
            business purposes.
          </p>
        </div>
      </main>
    </div>
  );
}

function SidebarContent({
  path,
  email,
  onSignOut,
}: {
  path: string;
  email: string | null;
  onSignOut: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-2 px-5 h-16 border-b border-sidebar-border">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-sm">AI Productivity</div>
          <div className="text-[11px] text-muted-foreground">Suite</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = path === item.to || path.startsWith(item.to + "/");
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground text-xs font-semibold shrink-0">
            {(email?.[0] ?? "U").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium truncate">{email ?? "Signed in"}</div>
            <div className="text-[10px] text-muted-foreground">Lovable Cloud</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSignOut}
            aria-label="Sign out"
            className="shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
