// Calibration harness — renders a sample certificate to /tmp/cert-sample.pdf.
// Keep coords in sync with src/lib/certificates/templates.ts.
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile, writeFile } from "node:fs/promises";

const T = {
  basePdf: "public/cert-templates/udl-base.pdf",
  cover: { x: 34, y: 222, w: 686, h: 152 },
  name: { xLeft: 50, yFromTop: 250, size: 28, color: [0.949, 0.149, 0.212], maxWidth: 660, lineGap: 32 },
  description: { xLeft: 41, yFromTop: 292, size: 15, color: [0.1, 0.1, 0.12], maxWidth: 660, lineGap: 21 },
};

function wrap(text, font, size, maxWidth) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (cur && font.widthOfTextAtSize(test, size) > maxWidth) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

const pdf = await PDFDocument.load(await readFile(T.basePdf));
pdf.registerFontkit(fontkit);
const nameFont = await pdf.embedFont(await readFile("src/lib/certificates/fonts/name.ttf"), { subset: true });
const bodyFont = await pdf.embedFont(await readFile("src/lib/certificates/fonts/body.ttf"), { subset: true });
const page = pdf.getPages()[0];
const { height } = page.getSize();

page.drawRectangle({ x: T.cover.x, y: T.cover.y, width: T.cover.w, height: T.cover.h, color: rgb(1, 1, 1) });

const draw = (text, f, font) => {
  let y = height - f.yFromTop;
  for (const line of wrap(text, font, f.size, f.maxWidth)) {
    page.drawText(line, { x: f.xLeft, y, size: f.size, font, color: rgb(...f.color) });
    y -= f.lineGap;
  }
};
draw("Mohammed Al Mansoori", T.name, nameFont);
draw(
  "For attending Module 1: Introduction to Universal Design for Learning (UDL), as part of the Universal Design for Learning (UDL) Certification Program, delivered by Dr. Mohamed Fteiha, Ms. Deenaz Kanji, and Dr. Areej Ahmed, held at Abu Dhabi University – Al Ain Campus on May 6, 2026, with a total of 2 contact hours.",
  T.description,
  bodyFont
);

await writeFile("/tmp/cert-sample.pdf", await pdf.save());
console.log("wrote /tmp/cert-sample.pdf");
