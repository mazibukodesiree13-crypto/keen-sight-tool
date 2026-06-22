import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateSummary } from "@/lib/ai.functions";
import { updateItem } from "@/lib/items.functions";
import { AiNotice, OutputToolbar, PageHeader } from "@/components/output-toolbar";

export const Route = createFileRoute("/_authenticated/summarizer")({
  head: () => ({ meta: [{ title: "Meeting Note Summarizer" }] }),
  component: SummarizerPage,
});

type SummaryOut = {
  executiveSummary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: { task: string; owner: string; deadline: string }[];
  outstandingIssues: string[];
};

function SummarizerPage() {
  const gen = useServerFn(generateSummary);
  const upd = useServerFn(updateItem);
  const qc = useQueryClient();

  const [notes, setNotes] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [participants, setParticipants] = useState("");
  const [detail, setDetail] = useState<"brief" | "standard" | "detailed">("standard");
  const [item, setItem] = useState<{ id: string; output: SummaryOut; title: string } | null>(
    null,
  );

  const mut = useMutation({
    mutationFn: () =>
      gen({ data: { notes, meetingType, participants, detail } }),
    onSuccess: (row: any) => {
      setItem({ id: row.id, output: row.output, title: row.title });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Summary ready");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Generation failed"),
  });

  function save(next: SummaryOut) {
    if (!item) return;
    setItem({ ...item, output: next });
    upd({ data: { id: item.id, output: next as any } }).catch(() => {});
  }

  async function handleFile(file: File) {
    if (file.size > 1_500_000) {
      toast.error("File too large (max 1.5 MB).");
      return;
    }
    const txt = await file.text();
    setNotes(txt.slice(0, 50000));
    toast.success("File loaded");
  }

  return (
    <div>
      <PageHeader
        icon={FileText}
        title="Meeting Note Summarizer"
        description="Paste raw notes or upload a transcript — get structured outcomes."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-sm font-semibold mb-4">Input</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Meeting type">
                <Input
                  placeholder="e.g. Sprint planning"
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                />
              </Field>
              <Field label="Detail level">
                <Select value={detail} onValueChange={(v: any) => setDetail(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Participants">
              <Input
                placeholder="e.g. Alex, Priya, Sam"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
              />
            </Field>
            <Field label="Notes / transcript *">
              <Textarea
                rows={12}
                placeholder="Paste meeting notes or transcript..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                <input
                  type="file"
                  accept=".txt,.md,.vtt,.srt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                Or upload a .txt / .md / .vtt file
              </label>
              <Button
                onClick={() => mut.mutate()}
                disabled={notes.trim().length < 10 || mut.isPending}
              >
                {mut.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Summarize
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-semibold">Summary</h2>
            {item && (
              <OutputToolbar
                kind="summary"
                title={item.title}
                output={item.output}
                onRegenerate={() => mut.mutate()}
                regenerating={mut.isPending}
              />
            )}
          </div>

          {!item ? (
            <div className="text-sm text-muted-foreground text-center py-16">
              Your structured summary will appear here.
            </div>
          ) : (
            <SummaryEditor value={item.output} onChange={save} />
          )}
        </Card>
      </div>

      <AiNotice />
    </div>
  );
}

function SummaryEditor({
  value,
  onChange,
}: {
  value: SummaryOut;
  onChange: (v: SummaryOut) => void;
}) {
  return (
    <div className="space-y-5">
      <Field label="Executive summary">
        <Textarea
          rows={3}
          value={value.executiveSummary}
          onChange={(e) =>
            onChange({ ...value, executiveSummary: e.target.value })
          }
        />
      </Field>

      <StringList
        label="Key discussion points"
        items={value.keyPoints}
        onChange={(items) => onChange({ ...value, keyPoints: items })}
      />

      <StringList
        label="Decisions made"
        items={value.decisions}
        onChange={(items) => onChange({ ...value, decisions: items })}
      />

      <div className="space-y-2">
        <Label className="text-xs">Action items</Label>
        <div className="space-y-2">
          {value.actionItems.map((a, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 rounded-lg border border-border p-2"
            >
              <Input
                className="col-span-12 sm:col-span-6"
                placeholder="Task"
                value={a.task}
                onChange={(e) => {
                  const next = [...value.actionItems];
                  next[i] = { ...a, task: e.target.value };
                  onChange({ ...value, actionItems: next });
                }}
              />
              <Input
                className="col-span-6 sm:col-span-3"
                placeholder="Owner"
                value={a.owner}
                onChange={(e) => {
                  const next = [...value.actionItems];
                  next[i] = { ...a, owner: e.target.value };
                  onChange({ ...value, actionItems: next });
                }}
              />
              <Input
                className="col-span-6 sm:col-span-3"
                placeholder="Deadline"
                value={a.deadline}
                onChange={(e) => {
                  const next = [...value.actionItems];
                  next[i] = { ...a, deadline: e.target.value };
                  onChange({ ...value, actionItems: next });
                }}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...value,
                actionItems: [
                  ...value.actionItems,
                  { task: "", owner: "", deadline: "" },
                ],
              })
            }
          >
            + Add action item
          </Button>
        </div>
      </div>

      <StringList
        label="Outstanding issues"
        items={value.outstandingIssues}
        onChange={(items) => onChange({ ...value, outstandingIssues: items })}
      />
    </div>
  );
}

function StringList({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="space-y-2">
        {items.map((s, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={s}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, ""])}
        >
          + Add
        </Button>
      </div>
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
