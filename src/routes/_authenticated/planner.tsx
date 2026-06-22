import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ListChecks, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generatePlan } from "@/lib/ai.functions";
import { updateItem } from "@/lib/items.functions";
import { AiNotice, OutputToolbar, PageHeader } from "@/components/output-toolbar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "AI Task Planner" }] }),
  component: PlannerPage,
});

type PlanOut = {
  priorityRanking: { task: string; priority: "high" | "medium" | "low"; reason: string }[];
  dailySchedule: { time: string; task: string }[];
  weeklySchedule: { day: string; focus: string; tasks: string[] }[];
  upcomingDeadlines: { task: string; due: string }[];
  recommendations: string[];
};

function PlannerPage() {
  const gen = useServerFn(generatePlan);
  const upd = useServerFn(updateItem);
  const qc = useQueryClient();

  const [tasks, setTasks] = useState("");
  const [deadlines, setDeadlines] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [priorityPreferences, setPriorityPreferences] = useState("");
  const [schedulingPreferences, setSchedulingPreferences] = useState("");
  const [item, setItem] = useState<{ id: string; output: PlanOut; title: string } | null>(
    null,
  );

  const mut = useMutation({
    mutationFn: () =>
      gen({
        data: {
          tasks,
          deadlines,
          availableTime,
          priorityPreferences,
          schedulingPreferences,
        },
      }),
    onSuccess: (row: any) => {
      setItem({ id: row.id, output: row.output, title: row.title });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Plan ready");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Generation failed"),
  });

  function save(next: PlanOut) {
    if (!item) return;
    setItem({ ...item, output: next });
    upd({ data: { id: item.id, output: next as any } }).catch(() => {});
  }

  return (
    <div>
      <PageHeader
        icon={ListChecks}
        title="AI Task Planner"
        description="Prioritize tasks and build a balanced daily and weekly schedule."
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold mb-4">Inputs</h2>
          <div className="space-y-4">
            <Field label="Tasks * (one per line)">
              <Textarea
                rows={6}
                placeholder={`Ship marketing site v2\nReview PR #421\nPrep Q3 board update`}
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
              />
            </Field>
            <Field label="Deadlines">
              <Textarea
                rows={2}
                placeholder="e.g. Board update due Fri, PR #421 by EOD."
                value={deadlines}
                onChange={(e) => setDeadlines(e.target.value)}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Available time / day">
                <Input
                  placeholder="e.g. 6 focused hours"
                  value={availableTime}
                  onChange={(e) => setAvailableTime(e.target.value)}
                />
              </Field>
              <Field label="Priority preferences">
                <Input
                  placeholder="e.g. Deep work mornings"
                  value={priorityPreferences}
                  onChange={(e) => setPriorityPreferences(e.target.value)}
                />
              </Field>
            </div>
            <Field label="Scheduling preferences">
              <Input
                placeholder="e.g. No meetings on Wed"
                value={schedulingPreferences}
                onChange={(e) => setSchedulingPreferences(e.target.value)}
              />
            </Field>
            <Button
              className="w-full"
              onClick={() => mut.mutate()}
              disabled={tasks.trim().length < 3 || mut.isPending}
            >
              {mut.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Build my plan
            </Button>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-semibold">Plan</h2>
            {item && (
              <OutputToolbar
                kind="plan"
                title={item.title}
                output={item.output}
                onRegenerate={() => mut.mutate()}
                regenerating={mut.isPending}
              />
            )}
          </div>

          {!item ? (
            <div className="text-sm text-muted-foreground text-center py-16">
              Your prioritized schedule will appear here.
            </div>
          ) : (
            <PlanEditor value={item.output} onChange={save} />
          )}
        </Card>
      </div>

      <AiNotice />
    </div>
  );
}

function PlanEditor({
  value,
  onChange,
}: {
  value: PlanOut;
  onChange: (v: PlanOut) => void;
}) {
  return (
    <div className="space-y-6">
      <Section title="Priority ranking">
        <div className="space-y-2">
          {value.priorityRanking.map((p, i) => (
            <div
              key={i}
              className="rounded-lg border border-border p-3 flex items-start gap-3"
            >
              <PriorityBadge p={p.priority} />
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  value={p.task}
                  onChange={(e) => {
                    const next = [...value.priorityRanking];
                    next[i] = { ...p, task: e.target.value };
                    onChange({ ...value, priorityRanking: next });
                  }}
                />
                <Textarea
                  rows={2}
                  value={p.reason}
                  onChange={(e) => {
                    const next = [...value.priorityRanking];
                    next[i] = { ...p, reason: e.target.value };
                    onChange({ ...value, priorityRanking: next });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Daily schedule">
        <div className="space-y-2">
          {value.dailySchedule.map((d, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input
                className="col-span-4 sm:col-span-3"
                value={d.time}
                onChange={(e) => {
                  const next = [...value.dailySchedule];
                  next[i] = { ...d, time: e.target.value };
                  onChange({ ...value, dailySchedule: next });
                }}
              />
              <Input
                className="col-span-8 sm:col-span-9"
                value={d.task}
                onChange={(e) => {
                  const next = [...value.dailySchedule];
                  next[i] = { ...d, task: e.target.value };
                  onChange({ ...value, dailySchedule: next });
                }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Weekly schedule">
        <div className="grid sm:grid-cols-2 gap-3">
          {value.weeklySchedule.map((w, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <Input
                  className="font-medium"
                  value={w.day}
                  onChange={(e) => {
                    const next = [...value.weeklySchedule];
                    next[i] = { ...w, day: e.target.value };
                    onChange({ ...value, weeklySchedule: next });
                  }}
                />
              </div>
              <Input
                placeholder="Focus"
                className="mb-2 text-xs"
                value={w.focus}
                onChange={(e) => {
                  const next = [...value.weeklySchedule];
                  next[i] = { ...w, focus: e.target.value };
                  onChange({ ...value, weeklySchedule: next });
                }}
              />
              <Textarea
                rows={4}
                value={(w.tasks ?? []).join("\n")}
                onChange={(e) => {
                  const next = [...value.weeklySchedule];
                  next[i] = {
                    ...w,
                    tasks: e.target.value.split("\n").filter(Boolean),
                  };
                  onChange({ ...value, weeklySchedule: next });
                }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Upcoming deadlines">
        <div className="space-y-2">
          {value.upcomingDeadlines.map((d, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input
                className="col-span-8"
                value={d.task}
                onChange={(e) => {
                  const next = [...value.upcomingDeadlines];
                  next[i] = { ...d, task: e.target.value };
                  onChange({ ...value, upcomingDeadlines: next });
                }}
              />
              <Input
                className="col-span-4"
                value={d.due}
                onChange={(e) => {
                  const next = [...value.upcomingDeadlines];
                  next[i] = { ...d, due: e.target.value };
                  onChange({ ...value, upcomingDeadlines: next });
                }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Productivity recommendations">
        <div className="space-y-2">
          {value.recommendations.map((r, i) => (
            <div key={i} className="flex gap-2">
              <Textarea
                rows={2}
                value={r}
                onChange={(e) => {
                  const next = [...value.recommendations];
                  next[i] = e.target.value;
                  onChange({ ...value, recommendations: next });
                }}
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function PriorityBadge({ p }: { p: "high" | "medium" | "low" }) {
  const variant =
    p === "high"
      ? "bg-destructive/15 text-destructive border-destructive/30"
      : p === "medium"
      ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  return (
    <Badge variant="outline" className={`${variant} uppercase text-[10px] shrink-0`}>
      {p}
    </Badge>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
