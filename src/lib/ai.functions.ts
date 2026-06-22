import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const MODEL = "google/gemini-3-flash-preview";

// ---------- Schemas ----------
const EmailInput = z.object({
  purpose: z.string().min(1).max(2000),
  recipient: z.string().max(200).optional().default(""),
  context: z.string().max(4000).optional().default(""),
  tone: z.enum(["formal", "friendly", "persuasive"]).default("formal"),
  callToAction: z.string().max(500).optional().default(""),
});

const EmailOutput = z.object({
  subject: z.string(),
  greeting: z.string(),
  body: z.string(),
  closing: z.string(),
  signature: z.string(),
});

const SummaryInput = z.object({
  notes: z.string().min(10).max(50000),
  meetingType: z.string().max(120).optional().default(""),
  participants: z.string().max(500).optional().default(""),
  detail: z.enum(["brief", "standard", "detailed"]).default("standard"),
});

const SummaryOutput = z.object({
  executiveSummary: z.string(),
  keyPoints: z.array(z.string()),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({
      task: z.string(),
      owner: z.string(),
      deadline: z.string(),
    }),
  ),
  outstandingIssues: z.array(z.string()),
});

const PlanInput = z.object({
  tasks: z.string().min(3).max(8000),
  deadlines: z.string().max(2000).optional().default(""),
  availableTime: z.string().max(500).optional().default(""),
  priorityPreferences: z.string().max(500).optional().default(""),
  schedulingPreferences: z.string().max(500).optional().default(""),
});

const PlanOutput = z.object({
  priorityRanking: z.array(
    z.object({
      task: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      reason: z.string(),
    }),
  ),
  dailySchedule: z.array(z.object({ time: z.string(), task: z.string() })),
  weeklySchedule: z.array(
    z.object({ day: z.string(), focus: z.string(), tasks: z.array(z.string()) }),
  ),
  upcomingDeadlines: z.array(
    z.object({ task: z.string(), due: z.string() }),
  ),
  recommendations: z.array(z.string()),
});

// ---------- Helper ----------
async function callJson<T>(
  apiKey: string,
  system: string,
  user: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const { generateText } = await import("ai");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(apiKey);

  const { text } = await generateText({
    model: gateway(MODEL),
    system:
      system +
      "\n\nRespond ONLY with valid minified JSON matching the requested shape. No markdown, no code fences, no commentary.",
    prompt: user,
  });

  // Strip potential code fences
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // try to extract first JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI did not return JSON");
    parsed = JSON.parse(match[0]);
  }
  return schema.parse(parsed);
}

function getApiKey() {
  const k = process.env.LOVABLE_API_KEY;
  if (!k) throw new Error("AI is not configured (missing LOVABLE_API_KEY)");
  return k;
}

function gatewayErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("429")) return "AI rate limit reached. Please retry shortly.";
  if (msg.includes("402"))
    return "AI credits exhausted. Add credits in your workspace to continue.";
  return msg || "AI generation failed";
}

// ---------- Server functions ----------
export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are an expert email writer. Produce a complete professional email in JSON with fields: subject, greeting, body, closing, signature. The tone must be ${data.tone}. Body should be 2-5 short paragraphs separated by \\n\\n. Use the recipient's name in the greeting when available. Signature should be a placeholder like "[Your Name]" unless context provides one.`;
    const user = [
      `Purpose: ${data.purpose}`,
      data.recipient ? `Recipient: ${data.recipient}` : "",
      data.context ? `Context: ${data.context}` : "",
      data.callToAction ? `Call to action: ${data.callToAction}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    let result;
    try {
      result = await callJson(getApiKey(), system, user, EmailOutput);
    } catch (e) {
      throw new Error(gatewayErrorMessage(e));
    }

    const title = result.subject.slice(0, 120) || "Email";
    const { data: saved, error } = await context.supabase
      .from("items")
      .insert({
        user_id: context.userId,
        kind: "email",
        title,
        input: data,
        output: result,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const generateSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SummaryInput.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are an expert meeting analyst. Extract a structured summary as JSON with fields: executiveSummary (string, 2-4 sentences), keyPoints (string[]), decisions (string[]), actionItems (array of {task, owner, deadline} — use "Unassigned" or "TBD" when missing), outstandingIssues (string[]). Detail level: ${data.detail}.`;
    const user = [
      data.meetingType ? `Meeting type: ${data.meetingType}` : "",
      data.participants ? `Participants: ${data.participants}` : "",
      `Notes:\n${data.notes}`,
    ]
      .filter(Boolean)
      .join("\n");

    let result;
    try {
      result = await callJson(getApiKey(), system, user, SummaryOutput);
    } catch (e) {
      throw new Error(gatewayErrorMessage(e));
    }
    const title =
      result.executiveSummary.slice(0, 80) || data.meetingType || "Meeting summary";
    const { data: saved, error } = await context.supabase
      .from("items")
      .insert({
        user_id: context.userId,
        kind: "summary",
        title,
        input: data,
        output: result,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PlanInput.parse(d))
  .handler(async ({ data, context }) => {
    const system = `You are an expert productivity coach. Build a realistic, balanced plan as JSON with fields: priorityRanking (array of {task, priority: "high"|"medium"|"low", reason}), dailySchedule (array of {time, task} covering one focused workday in time blocks), weeklySchedule (array of 5-7 {day, focus, tasks[]}), upcomingDeadlines (array of {task, due}), recommendations (string[] with 3-6 concrete productivity tips). Honor the user's preferences.`;
    const user = [
      `Tasks:\n${data.tasks}`,
      data.deadlines ? `Deadlines: ${data.deadlines}` : "",
      data.availableTime ? `Available time: ${data.availableTime}` : "",
      data.priorityPreferences ? `Priority preferences: ${data.priorityPreferences}` : "",
      data.schedulingPreferences
        ? `Scheduling preferences: ${data.schedulingPreferences}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    let result;
    try {
      result = await callJson(getApiKey(), system, user, PlanOutput);
    } catch (e) {
      throw new Error(gatewayErrorMessage(e));
    }
    const title =
      result.priorityRanking[0]?.task?.slice(0, 80) || "Task plan";
    const { data: saved, error } = await context.supabase
      .from("items")
      .insert({
        user_id: context.userId,
        kind: "plan",
        title,
        input: data,
        output: result,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return saved;
  });
