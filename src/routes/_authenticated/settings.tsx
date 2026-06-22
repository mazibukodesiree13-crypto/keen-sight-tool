import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, LogOut, Info, Mail } from "lucide-react";
import { PageHeader } from "@/components/output-toolbar";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  return (
    <div>
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        description="Account and preferences."
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <h2 className="text-sm font-semibold mb-1">Account</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Signed in via Lovable Cloud.
          </p>
          <div className="rounded-lg border border-border p-4 flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{email ?? "—"}</span>
          </div>
          <Button variant="outline" className="mt-4" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold mb-1">Responsible AI</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Transparency about AI-generated outputs.
          </p>
          <div className="rounded-lg border border-border bg-accent/30 p-4 text-sm text-muted-foreground space-y-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <p>
                AI-generated content is intended to assist users and may contain
                inaccuracies. Always review, verify, and edit all outputs
                before using them for professional, legal, financial, medical,
                or business purposes.
              </p>
            </div>
            <p className="text-xs">
              Your inputs are stored privately in your Lovable Cloud workspace
              and used only to generate and display your own outputs.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
