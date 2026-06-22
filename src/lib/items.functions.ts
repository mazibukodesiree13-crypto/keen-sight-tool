import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const KindFilter = z.enum(["email", "summary", "plan", "all"]).default("all");

export const listItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ kind: KindFilter, limit: z.number().min(1).max(100).default(50) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("items")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.kind !== "all") q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const statsItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("items")
      .select("kind, created_at")
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      total: rows.length,
      emails: rows.filter((r) => r.kind === "email").length,
      summaries: rows.filter((r) => r.kind === "summary").length,
      plans: rows.filter((r) => r.kind === "plan").length,
      thisWeek: rows.filter((r) => new Date(r.created_at).getTime() >= since).length,
    };
  });

export const updateItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().max(200).optional(),
        output: z.record(z.string(), z.unknown()).optional(),
        starred: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { id, ...rest } = data;
    const patch: Record<string, unknown> = { ...rest };
    const { data: row, error } = await context.supabase
      .from("items")
      .update(patch as never)
      .eq("id", id)
      .eq("user_id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
