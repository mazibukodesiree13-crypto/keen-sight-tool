import { useState } from "react";
import { Copy, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  copyToClipboard,
  exportDocx,
  exportPdf,
  exportTxt,
  safeFilename,
} from "@/lib/export";
import { outputToText, type ItemKind } from "@/lib/format-output";

export function OutputToolbar({
  kind,
  title,
  output,
  onRegenerate,
  regenerating,
}: {
  kind: ItemKind;
  title: string;
  output: any;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(name: string, fn: () => Promise<void>) {
    setBusy(name);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const text = outputToText(kind, output);
  const filename = safeFilename(title);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          run("copy", async () => {
            await copyToClipboard(text);
            toast.success("Copied to clipboard");
          })
        }
        disabled={busy !== null}
      >
        <Copy className="h-4 w-4 mr-2" />
        Copy
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={busy !== null}>
            {busy && busy !== "copy" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => run("pdf", () => exportPdf(filename, text))}
          >
            Download as PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => run("docx", () => exportDocx(filename, text))}
          >
            Download as DOCX
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => run("txt", () => exportTxt(filename, text))}
          >
            Download as TXT
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {onRegenerate && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRegenerate}
          disabled={regenerating}
        >
          {regenerating ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Regenerate
        </Button>
      )}
    </div>
  );
}

export function AiNotice() {
  return (
    <Card className="mt-6 p-4 bg-accent/40 border-accent text-sm text-muted-foreground">
      <div className="flex items-start gap-3">
        <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p>
          <strong className="text-foreground">AI-generated.</strong> Outputs may
          contain inaccuracies. Review and edit before sending or sharing
          professionally.
        </p>
      </div>
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-4 mb-8">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-primary shadow-glow shrink-0">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  );
}
