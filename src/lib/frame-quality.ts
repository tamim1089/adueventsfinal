/**
 * Client-side frame quality assessment for business-card scanning.
 *
 * Uses gradient-magnitude variance (Tenengrad) on a downsampled canvas
 * to estimate sharpness without running expensive OCR on blurry frames.
 *
 * Architecture layers:
 *   Layer 1 — Downsample         (200 px wide, <1 ms)
 *   Layer 2 — Grayscale convert  (<1 ms)
 *   Layer 3 — Gradient mag. var. (2–5 ms, every-2-pixel sampling)
 *   Layer 4 — Score normalisation → 0 (blurry) … 1 (sharp)
 */

export function assessFrameSharpness(canvas: HTMLCanvasElement): number {
  const scale = 200 / canvas.width;
  const tw = 200;
  const th = Math.round(canvas.height * scale);

  const offscreen = document.createElement("canvas");
  offscreen.width = tw;
  offscreen.height = th;
  const ctx = offscreen.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "low";
  ctx.drawImage(canvas, 0, 0, tw, th);

  const { data, width: w, height: h } = ctx.getImageData(0, 0, tw, th);

  // Layer 2: luma
  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const off = i * 4;
    gray[i] = 0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2];
  }

  // Layer 3: sample every-2nd pixel → gradient magnitude → variance
  let sum = 0, sumSq = 0, count = 0;
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const i = y * w + x;
      const gx = gray[i + 1] - gray[i - 1];
      const gy = gray[i + w] - gray[i - w];
      const mag = Math.sqrt(gx * gx + gy * gy);
      sum += mag;
      sumSq += mag * mag;
      count++;
    }
  }

  if (count === 0) return 0;
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;

  // Layer 4: map to 0–1
  const FLOOR = 20;  // below this = pure noise / blur
  const CEIL  = 200; // above this = very sharp
  const clamped = Math.max(0, (variance - FLOOR) / (CEIL - FLOOR));
  return Math.min(1, clamped);
}
