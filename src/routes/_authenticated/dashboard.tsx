import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listItems, statsItems } from "@/lib/items.functions";
import {
  Mail,
  FileText,
  ListChecks,
  TrendingUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AI Productivity Suite" }] }),
  component: Dashboard,
});

function Dashboard() {
  const stats = useServerFn(statsItems);
  const list = useServerFn(listItems);

  const statsQ = useQuery({
    queryKey: ["stats"],
    queryFn: () => stats(),
  });
  const recentQ = useQuery({
    queryKey: ["items", "all", 6],
    queryFn: () => list({ data: { kind: "all", limit: 6 } }),
  });

  const s = statsQ.data;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI-powered workspace at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/email">
              <Mail className="h-4 w-4 mr-2" />
              New email
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/summarizer">
              <FileText className="h-4 w-4 mr-2" />
              New summary
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/planner">
              <ListChecks className="h-4 w-4 mr-2" />
              New plan
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Emails generated"
          value={s?.emails ?? 0}
          icon={Mail}
          tint="from-violet-500/20 to-violet-500/0"
        />
        <StatCard
          label="Meetings summarized"
          value={s?.summaries ?? 0}
          icon={FileText}
          tint="from-cyan-500/20 to-cyan-500/0"
        />
        <StatCard
          label="Plans created"
          value={s?.plans ?? 0}
          icon={ListChecks}
          tint="from-emerald-500/20 to-emerald-500/0"
        />
        <StatCard
          label="This week"
          value={s?.thisWeek ?? 0}
          icon={TrendingUp}
          tint="from-amber-500/20 to-amber-500/0"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Recent activity</h2>
            <Link
              to="/history"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center"
            >
              View all <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>

          {recentQ.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          ) : (recentQ.data ?? []).length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-border">
              {(recentQ.data ?? []).map((item) => (
                <li key={item.id} className="py-3 flex items-center gap-3">
                  <KindIcon kind={item.kind as any} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {kindLabel(item.kind as any)} ·{" "}
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      to="/history"
                      search={{ open: item.id }}
                      className="text-xs"
                    >
                      Open
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold">Quick start</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Jump into a workflow.
          </p>
          <div className="mt-5 space-y-2">
            <QuickAction
              to="/email"
              icon={Mail}
              title="Draft a professional email"
              desc="Formal, friendly, or persuasive."
            />
            <QuickAction
              to="/summarizer"
              icon={FileText}
              title="Summarize meeting notes"
              desc="Action items, decisions, deadlines."
            />
            <QuickAction
              to="/planner"
              icon={ListChecks}
              title="Plan your week"
              desc="Prioritize and time-block tasks."
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tint: string;
}) {
  return (
    <Card className="p-5 relative overflow-hidden">
      <div
        className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${tint} blur-2xl pointer-events-none`}
      />
      <div className="flex items-center justify-between relative">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold mt-1 tabular-nums">{value}</div>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
    </Card>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  desc,
}: {
  to: "/email" | "/summarizer" | "/planner";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-accent/60 transition-colors group"
    >
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{desc}</div>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

function KindIcon({ kind }: { kind: "email" | "summary" | "plan" }) {
  const map = { email: Mail, summary: FileText, plan: ListChecks } as const;
  const I = map[kind];
  return (
    <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground shrink-0">
      <I className="h-4 w-4" />
    </div>
  );
}

function kindLabel(k: "email" | "summary" | "plan") {
  return k === "email" ? "Email" : k === "summary" ? "Summary" : "Plan";
}

function EmptyState() {
  return (
    <div className="text-center py-10">
      <Sparkles className="h-6 w-6 mx-auto text-muted-foreground" />
      <p className="text-sm text-muted-foreground mt-3">
        Nothing here yet. Generate your first email, summary, or plan.
      </p>
    </div>
  );
}
