// Convert AI output JSON to a plain-text representation for copy/export.
export type ItemKind = "email" | "summary" | "plan";

export function outputToText(kind: ItemKind, output: any): string {
  if (!output) return "";
  if (kind === "email") {
    return [
      `Subject: ${output.subject ?? ""}`,
      "",
      output.greeting ?? "",
      "",
      output.body ?? "",
      "",
      output.closing ?? "",
      output.signature ?? "",
    ].join("\n");
  }
  if (kind === "summary") {
    const ai = (output.actionItems ?? [])
      .map(
        (a: any) =>
          `- ${a.task} — Owner: ${a.owner || "Unassigned"} — Due: ${a.deadline || "TBD"}`,
      )
      .join("\n");
    return [
      "EXECUTIVE SUMMARY",
      output.executiveSummary ?? "",
      "",
      "KEY DISCUSSION POINTS",
      ...(output.keyPoints ?? []).map((p: string) => `- ${p}`),
      "",
      "DECISIONS MADE",
      ...(output.decisions ?? []).map((p: string) => `- ${p}`),
      "",
      "ACTION ITEMS",
      ai,
      "",
      "OUTSTANDING ISSUES",
      ...(output.outstandingIssues ?? []).map((p: string) => `- ${p}`),
    ].join("\n");
  }
  if (kind === "plan") {
    const pr = (output.priorityRanking ?? [])
      .map(
        (p: any) =>
          `- [${(p.priority ?? "").toUpperCase()}] ${p.task} — ${p.reason}`,
      )
      .join("\n");
    const daily = (output.dailySchedule ?? [])
      .map((d: any) => `- ${d.time}: ${d.task}`)
      .join("\n");
    const weekly = (output.weeklySchedule ?? [])
      .map(
        (w: any) =>
          `${w.day} — ${w.focus}\n${(w.tasks ?? [])
            .map((t: string) => `  • ${t}`)
            .join("\n")}`,
      )
      .join("\n\n");
    const dl = (output.upcomingDeadlines ?? [])
      .map((d: any) => `- ${d.task} (due ${d.due})`)
      .join("\n");
    return [
      "PRIORITY RANKING",
      pr,
      "",
      "DAILY SCHEDULE",
      daily,
      "",
      "WEEKLY SCHEDULE",
      weekly,
      "",
      "UPCOMING DEADLINES",
      dl,
      "",
      "PRODUCTIVITY RECOMMENDATIONS",
      ...(output.recommendations ?? []).map((r: string) => `- ${r}`),
    ].join("\n");
  }
  return JSON.stringify(output, null, 2);
}
