import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listItems, deleteItem } from "@/lib/items.functions";
import { Mail, FileText, ListChecks, Trash2, History as HistoryIcon, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { OutputToolbar, PageHeader, AiNotice } from "@/components/output-toolbar";
import { outputToText } from "@/lib/format-output";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — AI Productivity Suite" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    open: typeof s.open === "string" ? s.open : undefined,
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const list = useServerFn(listItems);
  const del = useServerFn(deleteItem);
  const qc = useQueryClient();
  const search = Route.useSearch();

  const [tab, setTab] = useState<"all" | "email" | "summary" | "plan">("all");
  const [query, setQuery] = useState("");

  const itemsQ = useQuery({
    queryKey: ["items", tab, 50],
    queryFn: () => list({ data: { kind: tab, limit: 50 } }),
  });

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (itemsQ.data ?? []).filter((r) =>
      !q ? true : r.title.toLowerCase().includes(q),
    );
  }, [itemsQ.data, query]);

  const [open, setOpen] = useState<string | null>(search.open ?? null);
  const openItem = useMemo(
    () => (open ? (itemsQ.data ?? []).find((r) => r.id === open) : null),
    [open, itemsQ.data],
  );

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Deleted");
    },
  });

  return (
    <div>
      <PageHeader
        icon={HistoryIcon}
        title="History"
        description="Browse, edit, and export everything you've created."
      />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="email">Emails</TabsTrigger>
              <TabsTrigger value="summary">Summaries</TabsTrigger>
              <TabsTrigger value="plan">Plans</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} />
          </Tabs>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by title..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {itemsQ.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          Nothing here yet.
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <Card
              key={r.id}
              className="p-4 hover:bg-accent/40 transition-colors cursor-pointer"
              onClick={() => setOpen(r.id)}
            >
              <div className="flex items-center gap-3">
                <KindIcon kind={r.kind as any} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {kindLabel(r.kind as any)} ·{" "}
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this item?")) delMut.mutate(r.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!openItem} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {openItem && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{openItem.title}</DialogTitle>
              </DialogHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {kindLabel(openItem.kind as any)} ·{" "}
                  {new Date(openItem.created_at).toLocaleString()}
                </span>
                <OutputToolbar
                  kind={openItem.kind as any}
                  title={openItem.title}
                  output={openItem.output}
                />
              </div>
              <pre className="whitespace-pre-wrap text-sm bg-muted/40 rounded-lg p-4 mt-2 font-sans">
                {outputToText(openItem.kind as any, openItem.output)}
              </pre>
              <AiNotice />
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
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
