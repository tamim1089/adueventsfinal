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

// SwiftShader gives headless Chromium a working WebGL context for the shader.
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});

// (1) Full-page shots under Reduce Motion: all content is visible (reveals are
// additive, not gating) AND this is the required reduced-motion a11y proof.
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
    reducedMotion: "reduce",
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

// (2) Motion-ON hero shot (viewport only) to prove the live WebGL shader.
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.dpr,
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200); // let the shader render several frames
  const file = `${OUT}/hero-shader-${vp.name}.png`;
  await page.screenshot({ path: file }); // viewport only
  console.log("shot", file);
  await ctx.close();
}

await browser.close();
console.log("done");
