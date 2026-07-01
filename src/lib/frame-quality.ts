export type QualityScores = {
  sharpness: number;
  brightness: number;
  contrast: number;
  motionStability: number;
  edgeCoverage: number;
  exposureClipping: number;
  noiseEstimate: number;
  composite: number;
  detail: {
    mean: number;
    stdDev: number;
    tenengrad: number;
    darkPixels: number;
    brightPixels: number;
    clippedLow: number;
    clippedHigh: number;
    edgeRatio: number;
    lowFreqRatio: number;
  };
};

export function assessFrameQuality(
  imageData: ImageData,
  prevEdgeMap?: Uint8Array | null,
): QualityScores {
  const { data, width, height } = imageData;
  const total = width * height;

  const gray = new Uint8Array(total);
  let sum = 0, sumSq = 0;
  let minV = 255, maxV = 0;

  for (let i = 0; i < total; i++) {
    const off = i * 4;
    const v = (0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2]) | 0;
    gray[i] = v;
    sum += v;
    sumSq += v * v;
    if (v < minV) minV = v;
    if (v > maxV) maxV = v;
  }

  const mean = sum / total;
  const variance = sumSq / total - mean * mean;
  const stdDev = Math.sqrt(variance);

  let darkPixels = 0, brightPixels = 0;
  let clippedLow = 0, clippedHigh = 0;
  for (let i = 0; i < total; i++) {
    if (gray[i] < 30) darkPixels++;
    if (gray[i] > 225) brightPixels++;
    if (gray[i] === 0) clippedLow++;
    if (gray[i] === 255) clippedHigh++;
  }

  const BINS = 64;
  const hist = new Int32Array(BINS);
  for (let i = 0; i < total; i++) {
    const bin = (gray[i] * BINS / 256) | 0;
    hist[Math.min(bin, BINS - 1)]++;
  }

  const midLow = hist.slice(0, BINS / 3).reduce((a, b) => a + b, 0);
  const clippedRegion = hist[BINS - 1] + hist[0];

  const tenengrad = computeTenengrad(gray, width, height);

  const edgeMap = computeSobelEdges(gray, width, height);
  const edgePixels = edgeMap.reduce((a, v) => a + (v > 0 ? 1 : 0), 0);
  const edgeRatio = edgePixels / total;

  const lowFreqRatio = (midLow + clippedRegion) / total;

  const noiseEstimate = estimateNoise(gray, width, height);

  let motion = 0.5;
  if (prevEdgeMap && prevEdgeMap.length === total) {
    let diff = 0;
    for (let i = 0; i < total; i++) {
      diff += Math.abs(edgeMap[i] - prevEdgeMap[i]);
    }
    const maxDiff = total * 255;
    motion = 1 - Math.min(1, diff / (maxDiff * 0.15));
  }

  const sharpnessScore = smoothstep(tenengrad, 30, 300);
  const brightnessScore = 1 - Math.abs(mean - 128) / 128;
  const contrastScore = Math.min(1, stdDev / 60);
  const motionScore = motion;
  const coverageScore = Math.min(1, edgeRatio * 5);
  const exposureScore = 1 - Math.min(1, (clippedLow + clippedHigh) / (total * 0.02));
  const noiseScore = 1 - Math.min(1, noiseEstimate / 30);

  const clipped = (clippedLow + clippedHigh) / total;

  const composite =
    0.30 * sharpnessScore +
    0.10 * brightnessScore +
    0.10 * contrastScore +
    0.20 * motionScore +
    0.10 * coverageScore +
    0.10 * exposureScore +
    0.10 * noiseScore;

  return {
    sharpness: Math.round(sharpnessScore * 100) / 100,
    brightness: Math.round(brightnessScore * 100) / 100,
    contrast: Math.round(contrastScore * 100) / 100,
    motionStability: Math.round(motionScore * 100) / 100,
    edgeCoverage: Math.round(coverageScore * 100) / 100,
    exposureClipping: Math.round(clipped * 100) / 100,
    noiseEstimate: Math.round(noiseScore * 100) / 100,
    composite: Math.round(composite * 100) / 100,
    detail: {
      mean: Math.round(mean),
      stdDev: Math.round(stdDev),
      tenengrad: Math.round(tenengrad),
      darkPixels: darkPixels,
      brightPixels: brightPixels,
      clippedLow: clippedLow,
      clippedHigh: clippedHigh,
      edgeRatio: Math.round(edgeRatio * 1000) / 1000,
      lowFreqRatio: Math.round(lowFreqRatio * 1000) / 1000,
    },
  };
}

export function isCardQualityGood(
  scores: QualityScores,
  options: { minSharpness?: number; minComposite?: number; maxClipping?: number; minCoverage?: number } = {},
): boolean {
  const o = {
    minSharpness: 0.35,
    minComposite: 0.40,
    maxClipping: 0.15,
    minCoverage: 0.05,
    ...options,
  };

  if (scores.sharpness < o.minSharpness) return false;
  if (scores.composite < o.minComposite) return false;
  if (scores.exposureClipping > o.maxClipping) return false;
  if (scores.edgeCoverage < o.minCoverage) return false;
  if (scores.motionStability < 0.3) return false;
  if (scores.brightness < 0.2) return false;

  return true;
}

function computeTenengrad(gray: Uint8Array, w: number, h: number): number {
  let sumSq = 0, count = 0;
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const i = y * w + x;
      const gx = gray[i + 1] - gray[i - 1];
      const gy = gray[i + w] - gray[i - w];
      const mag = gx * gx + gy * gy;
      sumSq += mag;
      count++;
    }
  }
  return count > 0 ? sumSq / count : 0;
}

function computeSobelEdges(gray: Uint8Array, w: number, h: number): Uint8Array {
  const edges = new Uint8Array(w * h);
  const THRESH = 40;
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
      const mag = Math.sqrt(gx * gx + gy * gy);
      edges[i] = mag > THRESH ? Math.min(255, mag | 0) : 0;
    }
  }
  return edges;
}

function estimateNoise(gray: Uint8Array, w: number, h: number): number {
  let sum = 0, count = 0;
  for (let y = 2; y < h - 2; y += 3) {
    for (let x = 2; x < w - 2; x += 3) {
      const i = y * w + x;
      const lap = Math.abs(4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w]);
      sum += lap;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

function smoothstep(x: number, lo: number, hi: number): number {
  const t = Math.max(0, Math.min(1, (x - lo) / (hi - lo)));
  return t * t * (3 - 2 * t);
}
