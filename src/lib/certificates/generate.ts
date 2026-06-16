import "server-only";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CERT_TEMPLATES, type CertField } from "./templates";

const ROOT = process.cwd();
const FONTS = join(ROOT, "src/lib/certificates/fonts");

// Greedy word-wrap to a max width using the embedded font's metrics.
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && font.widthOfTextAtSize(test, size) > maxWidth) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function renderCertificatePdf(opts: {
  templateKey: string;
  name: string;
  description: string;
}): Promise<Uint8Array> {
  const t = CERT_TEMPLATES[opts.templateKey] ?? CERT_TEMPLATES.udl;
  const pdf = await PDFDocument.load(await readFile(join(ROOT, t.basePdf)));
  pdf.registerFontkit(fontkit);
  const nameFont = await pdf.embedFont(await readFile(join(FONTS, "name.ttf")), { subset: true });
  const bodyFont = await pdf.embedFont(await readFile(join(FONTS, "body.ttf")), { subset: true });

  const page = pdf.getPages()[0];
  const { height } = page.getSize();

  // Hide the template's placeholder name + description.
  page.drawRectangle({
    x: t.cover.x,
    y: t.cover.y,
    width: t.cover.w,
    height: t.cover.h,
    color: rgb(1, 1, 1),
  });

  const drawLeft = (text: string, f: CertField, font: PDFFont) => {
    let y = height - f.yFromTop;
    for (const line of wrap(text, font, f.size, f.maxWidth)) {
      page.drawText(line, { x: f.xLeft, y, size: f.size, font, color: rgb(...f.color) });
      y -= f.lineGap;
    }
  };

  drawLeft(opts.name.trim() || "Recipient", t.name, nameFont);
  drawLeft(opts.description.trim(), t.description, bodyFont);

  return pdf.save();
}

// Build a sensible default description when an event has none set.
export function defaultCertificateDescription(opts: {
  eventTitle: string;
  organizer: string;
  when: string;
  contactHours?: string;
}): string {
  const hours = opts.contactHours ? `, with a total of ${opts.contactHours}` : "";
  return `For attending ${opts.eventTitle}, organized by ${opts.organizer} at Abu Dhabi University – Al Ain Campus on ${opts.when}${hours}.`;
}
