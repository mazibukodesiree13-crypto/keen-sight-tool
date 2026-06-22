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
import { Mail, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateEmail } from "@/lib/ai.functions";
import { updateItem } from "@/lib/items.functions";
import { AiNotice, OutputToolbar, PageHeader } from "@/components/output-toolbar";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "Smart Email Generator" }] }),
  component: EmailPage,
});

type EmailOutput = {
  subject: string;
  greeting: string;
  body: string;
  closing: string;
  signature: string;
};

function EmailPage() {
  const gen = useServerFn(generateEmail);
  const upd = useServerFn(updateItem);
  const qc = useQueryClient();

  const [purpose, setPurpose] = useState("");
  const [recipient, setRecipient] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<"formal" | "friendly" | "persuasive">("formal");
  const [cta, setCta] = useState("");

  const [item, setItem] = useState<{ id: string; output: EmailOutput; title: string } | null>(
    null,
  );

  const mut = useMutation({
    mutationFn: () =>
      gen({
        data: {
          purpose,
          recipient,
          context,
          tone,
          callToAction: cta,
        },
      }),
    onSuccess: (row: any) => {
      setItem({ id: row.id, output: row.output, title: row.title });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Email drafted");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Generation failed"),
  });

  function patch(field: keyof EmailOutput, value: string) {
    if (!item) return;
    const next = { ...item.output, [field]: value };
    setItem({ ...item, output: next });
    upd({ data: { id: item.id, output: next as any } }).catch(() => {});
  }

  return (
    <div>
      <PageHeader
        icon={Mail}
        title="Smart Email Generator"
        description="Generate professional emails in any tone — edit freely before exporting."
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-sm font-semibold mb-4">Brief</h2>
          <div className="space-y-4">
            <Field label="Purpose *">
              <Textarea
                rows={3}
                placeholder="What is this email about? e.g. Follow up on yesterday's design review."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Recipient">
                <Input
                  placeholder="e.g. Alex Chen, Product Lead"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </Field>
              <Field label="Tone">
                <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="persuasive">Persuasive</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Context (optional)">
              <Textarea
                rows={3}
                placeholder="Background, prior conversation, constraints..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
            </Field>
            <Field label="Call to action (optional)">
              <Input
                placeholder="e.g. Confirm by Friday"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
              />
            </Field>
            <Button
              className="w-full"
              onClick={() => mut.mutate()}
              disabled={!purpose.trim() || mut.isPending}
            >
              {mut.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate email
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-semibold">Draft</h2>
            {item && (
              <OutputToolbar
                kind="email"
                title={item.title}
                output={item.output}
                onRegenerate={() => mut.mutate()}
                regenerating={mut.isPending}
              />
            )}
          </div>

          {!item ? (
            <div className="text-sm text-muted-foreground text-center py-16">
              Your generated email will appear here.
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Subject">
                <Input
                  value={item.output.subject}
                  onChange={(e) => patch("subject", e.target.value)}
                />
              </Field>
              <Field label="Greeting">
                <Input
                  value={item.output.greeting}
                  onChange={(e) => patch("greeting", e.target.value)}
                />
              </Field>
              <Field label="Body">
                <Textarea
                  rows={10}
                  value={item.output.body}
                  onChange={(e) => patch("body", e.target.value)}
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Closing">
                  <Input
                    value={item.output.closing}
                    onChange={(e) => patch("closing", e.target.value)}
                  />
                </Field>
                <Field label="Signature">
                  <Input
                    value={item.output.signature}
                    onChange={(e) => patch("signature", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          )}
        </Card>
      </div>

      <AiNotice />
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
