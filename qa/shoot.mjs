import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:3100";
const OUT = "qa/shots";
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900, dpr: 1 },
  { name: "mobile", width: 390, height: 844, dpr: 2 },
];

const PAGES = [
  { name: "landing", path: "/" },
  { name: "admin-login", path: "/admin/login" },
  { name: "admin-dashboard", path: "/admin" },
];

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    reducedMotion: "reduce", // stable frames; also exercises the a11y fallback
  });
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto(BASE + p.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const file = `${OUT}/${p.name}-${vp.name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log("shot", file);
  }
  await ctx.close();
}
await browser.close();
console.log("done");
