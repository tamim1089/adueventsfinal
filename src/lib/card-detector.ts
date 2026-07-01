export type CardRegion = {
  x: number;
  y: number;
  w: number;
  h: number;
  angle: number;
  confidence: number;
};

export type DetectedCard = {
  region: CardRegion;
  crop: ImageData;
};

let _offCanvas: HTMLCanvasElement | null = null;
let _tmpCanvas: HTMLCanvasElement | null = null;
let _dstCanvas: HTMLCanvasElement | null = null;

function getCanvas(id: "off" | "tmp" | "dst"): HTMLCanvasElement {
  if (id === "off") { if (!_offCanvas) _offCanvas = document.createElement("canvas"); return _offCanvas; }
  if (id === "tmp") { if (!_tmpCanvas) _tmpCanvas = document.createElement("canvas"); return _tmpCanvas; }
  if (!_dstCanvas) _dstCanvas = document.createElement("canvas"); return _dstCanvas;
}

export function detectCard(imageData: ImageData): CardRegion | null {
  const { width, height } = imageData;

  const W = 320;
  const scale = W / width;
  const H = Math.round(height * scale);

  const gray = downscaleGray(imageData, W, H);

  const blurRadius = Math.max(1, Math.round(Math.min(W, H) / 200));
  const blurred = gaussianBlur(gray, W, H, blurRadius);

  const edges = sobelEdges(blurred, W, H);

  const bbox = findCentralBbox(edges, W, H);
  if (!bbox) return null;

  const margin = 0.05;
  const marginX = Math.round(bbox.w * margin);
  const marginY = Math.round(bbox.h * margin);

  const cardX = Math.max(0, bbox.x - marginX);
  const cardY = Math.max(0, bbox.y - marginY);
  const cardW = Math.min(W - cardX, bbox.w + 2 * marginX);
  const cardH = Math.min(H - cardY, bbox.h + 2 * marginY);

  const coverage = (cardW * cardH) / (W * H);
  if (coverage < 0.03 || coverage > 0.95) return null;
  if (cardW < W * 0.08 || cardH < H * 0.08) return null;

  const aspect = cardW / cardH;
  if (aspect < 0.3 || aspect > 3.5) return null;

  const angle = estimateSkewAngle(edges, bbox, W);

  const confidence = computeConfidence(edges, bbox, W, H, coverage, angle);

  const srcX = Math.round(cardX / scale);
  const srcY = Math.round(cardY / scale);
  const srcW = Math.round(cardW / scale);
  const srcH = Math.round(cardH / scale);

  return {
    x: Math.max(0, srcX),
    y: Math.max(0, srcY),
    w: Math.min(imageData.width - srcX, srcW),
    h: Math.min(imageData.height - srcY, srcH),
    angle,
    confidence,
  };
}

export function cropAndDeskew(
  source: ImageData,
  region: CardRegion,
  targetWidth: number,
  targetHeight: number,
): ImageData {
  const offCanvas = getCanvas("off");
  offCanvas.width = source.width;
  offCanvas.height = source.height;
  const srcCtx = offCanvas.getContext("2d")!;
  srcCtx.putImageData(source, 0, 0);

  const absAngle = Math.abs(region.angle);
  const needsDeskew = absAngle > 0.5;

  let sourceEl: HTMLCanvasElement = offCanvas;

  if (needsDeskew) {
    const tmpCanvas = getCanvas("tmp");
    tmpCanvas.width = source.width;
    tmpCanvas.height = source.height;
    const tmpCtx = tmpCanvas.getContext("2d")!;
    const cx = region.x + region.w / 2;
    const cy = region.y + region.h / 2;
    tmpCtx.translate(cx, cy);
    tmpCtx.rotate((-region.angle * Math.PI) / 180);
    tmpCtx.translate(-cx, -cy);
    tmpCtx.drawImage(offCanvas, 0, 0);
    tmpCtx.setTransform(1, 0, 0, 1, 0, 0);
    sourceEl = tmpCanvas;
  }

  const dstCanvas = getCanvas("dst");
  dstCanvas.width = targetWidth;
  dstCanvas.height = targetHeight;
  const dstCtx = dstCanvas.getContext("2d")!;
  dstCtx.drawImage(
    sourceEl,
    region.x,
    region.y,
    region.w,
    region.h,
    0,
    0,
    targetWidth,
    targetHeight,
  );

  return dstCtx.getImageData(0, 0, targetWidth, targetHeight);
}

function computeConfidence(
  edges: Float64Array,
  bbox: { x: number; y: number; w: number; h: number },
  frameW: number,
  frameH: number,
  coverage: number,
  angle: number,
): number {
  let edgeDensity = 0;
  const sampleStep = 2;
  let count = 0;
  for (let y = bbox.y; y < bbox.y + bbox.h; y += sampleStep) {
    for (let x = bbox.x; x < bbox.x + bbox.w; x += sampleStep) {
      const i = y * frameW + x;
      if (i < edges.length && edges[i] > 0) {
        edgeDensity++;
      }
      count++;
    }
  }
  edgeDensity = count > 0 ? edgeDensity / count : 0;
  const sizeScore = Math.min(1, coverage / 0.3);
  const edgeScore = Math.min(1, edgeDensity * 3);
  const aspectScore = 1 - Math.min(1, Math.abs(angle) / 30);
  return 0.4 * sizeScore + 0.3 * edgeScore + 0.3 * aspectScore;
}

function downscaleGray(
  imageData: ImageData,
  targetW: number,
  targetH: number,
): Float64Array {
  const offscreen = document.createElement("canvas");
  offscreen.width = targetW;
  offscreen.height = targetH;
  const ctx = offscreen.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = imageData.width;
  tmpCanvas.height = imageData.height;
  const tmpCtx = tmpCanvas.getContext("2d")!;
  tmpCtx.putImageData(imageData, 0, 0);

  ctx.drawImage(tmpCanvas, 0, 0, targetW, targetH);
  const pixels = ctx.getImageData(0, 0, targetW, targetH).data;

  const gray = new Float64Array(targetW * targetH);
  for (let i = 0; i < targetW * targetH; i++) {
    const off = i * 4;
    gray[i] = 0.299 * pixels[off] + 0.587 * pixels[off + 1] + 0.114 * pixels[off + 2];
  }
  return gray;
}

function gaussianBlur(
  src: Float64Array,
  w: number,
  h: number,
  radius: number,
): Float64Array {
  const kernelSize = 2 * radius + 1;
  const kernel = new Float64Array(kernelSize);
  let kSum = 0;
  for (let i = 0; i < kernelSize; i++) {
    const x = i - radius;
    kernel[i] = Math.exp(-(x * x) / (2 * radius * radius));
    kSum += kernel[i];
  }
  for (let i = 0; i < kernelSize; i++) kernel[i] /= kSum;

  const tmp = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0;
      for (let k = 0; k < kernelSize; k++) {
        const sx = Math.min(Math.max(x + k - radius, 0), w - 1);
        val += src[y * w + sx] * kernel[k];
      }
      tmp[y * w + x] = val;
    }
  }

  const out = new Float64Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let val = 0;
      for (let k = 0; k < kernelSize; k++) {
        const sy = Math.min(Math.max(y + k - radius, 0), h - 1);
        val += tmp[sy * w + x] * kernel[k];
      }
      out[y * w + x] = val;
    }
  }
  return out;
}

function sobelEdges(
  gray: Float64Array,
  w: number,
  h: number,
): Float64Array {
  const mag = new Float64Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx =
        -gray[(y - 1) * w + (x - 1)] + gray[(y - 1) * w + (x + 1)] +
        -2 * gray[y * w + (x - 1)] + 2 * gray[y * w + (x + 1)] +
        -gray[(y + 1) * w + (x - 1)] + gray[(y + 1) * w + (x + 1)];
      const gy =
        -gray[(y - 1) * w + (x - 1)] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + (x + 1)] +
        gray[(y + 1) * w + (x - 1)] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + (x + 1)];
      mag[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return mag;
}

function findCentralBbox(
  edges: Float64Array,
  w: number,
  h: number,
): { x: number; y: number; w: number; h: number } | null {
  const marginX = Math.round(w * 0.08);
  const marginY = Math.round(h * 0.08);
  const THRESH = 30;

  let minX = w, minY = h, maxX = 0, maxY = 0;

  for (let y = marginY; y < h - marginY; y++) {
    for (let x = marginX; x < w - marginX; x++) {
      if (edges[y * w + x] > THRESH) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX <= minX || maxY <= minY) return null;

  const bW = maxX - minX;
  const bH = maxY - minY;

  if (bW < w * 0.05 || bH < h * 0.05) return null;

  const fillRatio = bW * bH / (w * h);

  if (fillRatio > 0.85) {
    const outerMargin = Math.round(Math.min(w, h) * 0.02);
    return {
      x: outerMargin,
      y: outerMargin,
      w: w - 2 * outerMargin,
      h: h - 2 * outerMargin,
    };
  }

  return { x: minX, y: minY, w: bW, h: bH };
}

function estimateSkewAngle(
  edges: Float64Array,
  bbox: { x: number; y: number; w: number; h: number },
  frameW: number,
): number {
  const THRESH = 30;
  const angles: number[] = [];
  const step = 3;

  for (let y = bbox.y + 2; y < bbox.y + bbox.h - 2; y += step) {
    for (let x = bbox.x + 2; x < bbox.x + bbox.w - 2; x += step) {
      const i = y * frameW + x;
      if (edges[i] <= THRESH) continue;

      const gx =
        -edges[(y - 1) * frameW + (x - 1)] + edges[(y - 1) * frameW + (x + 1)] +
        -2 * edges[y * frameW + (x - 1)] + 2 * edges[y * frameW + (x + 1)] +
        -edges[(y + 1) * frameW + (x - 1)] + edges[(y + 1) * frameW + (x + 1)];
      const gy =
        -edges[(y - 1) * frameW + (x - 1)] - 2 * edges[(y - 1) * frameW + x] - edges[(y - 1) * frameW + (x + 1)] +
        edges[(y + 1) * frameW + (x - 1)] + 2 * edges[(y + 1) * frameW + x] + edges[(y + 1) * frameW + (x + 1)];

      if (Math.abs(gx) < 5 && Math.abs(gy) < 5) continue;

      const angle = (Math.atan2(gy, gx) * 180) / Math.PI;
      angles.push(angle);
    }
  }

  if (angles.length < 20) return 0;

  const BINS = 36;
  const hist = new Int32Array(BINS);
  for (const a of angles) {
    const bin = ((a + 90) / 180 * BINS) | 0;
    hist[Math.min(Math.max(bin, 0), BINS - 1)]++;
  }

  let maxBin = 0, maxCount = 0;
  for (let i = 0; i < BINS; i++) {
    if (hist[i] > maxCount) {
      maxCount = hist[i];
      maxBin = i;
    }
  }

  const dominantAngle = (maxBin / BINS) * 180 - 90;
  const absDom = Math.abs(dominantAngle);
  const mod90 = absDom % 90;
  const skew = mod90 > 45 ? 90 - mod90 : mod90;

  return dominantAngle > 0 ? skew : -skew;
}
