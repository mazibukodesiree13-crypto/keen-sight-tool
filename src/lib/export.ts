// Client-only export helpers. Import dynamically to keep SSR safe.
import { saveAs } from "file-saver";

export async function exportTxt(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${filename}.txt`);
}

export async function exportPdf(filename: string, text: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 56;
  const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;
  const lineHeight = 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  let y = margin;
  const pageHeight = doc.internal.pageSize.getHeight();
  for (const line of lines) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  }
  doc.save(`${filename}.pdf`);
}

export async function exportDocx(filename: string, text: string) {
  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const paragraphs = text.split("\n").map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line || " ", font: "Arial", size: 22 })],
      }),
  );
  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [{ children: paragraphs }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function safeFilename(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9-_ ]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "ai-output"
  );
}
