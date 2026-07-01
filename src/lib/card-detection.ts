export type Point = { x: number; y: number };

function sobel(
  src: Uint8Array,
  w: number,
  h: number,
): { magnitude: Float32Array; direction: Float32Array } {
  const magnitude = new Float32Array(w * h);
  const direction = new Float32Array(w * h);

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const gx =
        -src[(y - 1) * w + (x - 1)] + src[(y - 1) * w + (x + 1)] +
        -2 * src[y * w + (x - 1)] + 2 * src[y * w + (x + 1)] +
        -src[(y + 1) * w + (x - 1)] + src[(y + 1) * w + (x + 1)];

      const gy =
        -src[(y - 1) * w + (x - 1)] - 2 * src[(y - 1) * w + x] - src[(y - 1) * w + (x + 1)] +
        src[(y + 1) * w + (x - 1)] + 2 * src[(y + 1) * w + x] + src[(y + 1) * w + (x + 1)];

      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      direction[idx] = Math.atan2(gy, gx);
    }
  }
  return { magnitude, direction };
}

function nonMaxSuppression(
  mag: Float32Array,
  dir: Float32Array,
  w: number,
  h: number,
): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const angle = ((dir[idx] * 180) / Math.PI + 180) % 180;
      let q = 0, r = 0;

      if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle < 180)) {
        q = mag[y * w + (x + 1)];
        r = mag[y * w + (x - 1)];
      } else if (angle >= 22.5 && angle < 67.5) {
        q = mag[(y + 1) * w + (x - 1)];
        r = mag[(y - 1) * w + (x + 1)];
      } else if (angle >= 67.5 && angle < 112.5) {
        q = mag[(y + 1) * w + x];
        r = mag[(y - 1) * w + x];
      } else {
        q = mag[(y - 1) * w + (x - 1)];
        r = mag[(y + 1) * w + (x + 1)];
      }

      out[idx] = mag[idx] >= q && mag[idx] >= r ? (mag[idx] > 0 ? 255 : 0) : 0;
    }
  }
  return out;
}

function doubleThreshold(
  edge: Uint8Array,
  w: number,
  h: number,
  low: number,
  high: number,
): { strong: Uint8Array; weak: Uint8Array } {
  const strong = new Uint8Array(w * h);
  const weak = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (edge[i] >= high) strong[i] = 255;
    else if (edge[i] >= low) weak[i] = 255;
  }
  return { strong, weak };
}

function hysteresis(
  strong: Uint8Array,
  weak: Uint8Array,
  w: number,
  h: number,
): Uint8Array {
  const out = new Uint8Array(strong);
  const visited = new Uint8Array(w * h);

  function dfs(y: number, x: number) {
    const idx = y * w + x;
    if (visited[idx] || !weak[idx]) return;
    visited[idx] = 1;
    out[idx] = 255;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dy === 0 && dx === 0) continue;
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < h && nx >= 0 && nx < w && weak[ny * w + nx]) {
          dfs(ny, nx);
        }
      }
    }
  }

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (strong[y * w + x]) {
        dfs(y, x);
      }
    }
  }
  return out;
}

export function cannyEdgeDetection(
  src: Uint8Array,
  w: number,
  h: number,
  low = 40,
  high = 120,
): Uint8Array {
  const blurred = gaussianBlurFast(src, w, h, 3, 0.8);
  const { magnitude, direction } = sobel(blurred, w, h);
  const nms = nonMaxSuppression(magnitude, direction, w, h);
  const { strong, weak } = doubleThreshold(nms, w, h, low, high);
  return hysteresis(strong, weak, w, h);
}

function gaussianBlurFast(
  src: Uint8Array,
  w: number,
  h: number,
  size: number,
  sigma: number,
): Uint8Array {
  const half = size >> 1;
  const kernel = new Float32Array(size);
  let sum = 0;
  for (let i = 0; i < size; i++) {
    const x = i - half;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }
  for (let i = 0; i < size; i++) kernel[i] /= sum;

  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0;
      for (let k = 0; k < size; k++) {
        const sx = Math.min(Math.max(x + k - half, 0), w - 1);
        v += kernel[k] * src[y * w + sx];
      }
      tmp[y * w + x] = v | 0;
    }
  }

  const out = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let v = 0;
      for (let k = 0; k < size; k++) {
        const sy = Math.min(Math.max(y + k - half, 0), h - 1);
        v += kernel[k] * tmp[sy * w + x];
      }
      out[y * w + x] = v | 0;
    }
  }
  return out;
}

function traceContour(
  edge: Uint8Array,
  w: number,
  h: number,
  startX: number,
  startY: number,
  visited: Uint8Array,
): Point[] {
  const contour: Point[] = [];
  const dirs = [
    [1, 0], [1, -1], [0, -1], [-1, -1],
    [-1, 0], [-1, 1], [0, 1], [1, 1],
  ];

  const stack: [number, number][] = [[startX, startY]];
  visited[startY * w + startX] = 1;

  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    contour.push({ x: cx, y: cy });
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const nidx = ny * w + nx;
      if (edge[nidx] && !visited[nidx]) {
        visited[nidx] = 1;
        stack.push([nx, ny]);
      }
    }
  }
  return contour;
}

export function findContours(edge: Uint8Array, w: number, h: number): Point[][] {
  const visited = new Uint8Array(w * h);
  const contours: Point[][] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (edge[y * w + x] && !visited[y * w + x]) {
        const contour = traceContour(edge, w, h, x, y, visited);
        if (contour.length > 50) {
          contours.push(contour);
        }
      }
    }
  }

  contours.sort((a, b) => b.length - a.length);
  return contours;
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

export function convexHull(points: Point[]): Point[] {
  const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  if (sorted.length <= 1) return sorted;

  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function pointDistSq(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function approxPolyDP(contour: Point[], epsilon: number): Point[] {
  if (contour.length <= 2) return contour;

  let dmax = 0;
  let idx = 0;
  const end = contour.length - 1;
  for (let i = 1; i < end; i++) {
    const d = pointToSegmentDist(contour[i], contour[0], contour[end]);
    if (d > dmax) { dmax = d; idx = i; }
  }

  const result: Point[] = [];
  if (dmax > epsilon) {
    const left = approxPolyDP(contour.slice(0, idx + 1), epsilon);
    const right = approxPolyDP(contour.slice(idx), epsilon);
    result.push(...left.slice(0, -1), ...right);
  } else {
    result.push(contour[0], contour[end]);
  }
  return result;
}

function pointToSegmentDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt(pointDistSq(p, a));
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.sqrt(pointDistSq(p, { x: projX, y: projY }));
}

export function sortCorners(corners: Point[]): [Point, Point, Point, Point] {
  const center = {
    x: corners.reduce((s, c) => s + c.x, 0) / corners.length,
    y: corners.reduce((s, c) => s + c.y, 0) / corners.length,
  };

  const sorted = corners.slice().sort((a, b) => {
    const angleA = Math.atan2(a.y - center.y, a.x - center.x);
    const angleB = Math.atan2(b.y - center.y, b.x - center.x);
    return angleA - angleB;
  });

  return [
    sorted[0], sorted[1], sorted[2], sorted[3],
  ] as [Point, Point, Point, Point];
}

export function findCardCorners(
  edge: Uint8Array,
  w: number,
  h: number,
): [Point, Point, Point, Point] | null {
  const contours = findContours(edge, w, h);
  if (contours.length === 0) return null;

  for (const contour of contours) {
    const hull = convexHull(contour);
    const perimeter = hull.reduce((sum, p, i) => {
      const next = hull[(i + 1) % hull.length];
      return sum + Math.sqrt(pointDistSq(p, next));
    }, 0);
    const epsilon = perimeter * 0.02;
    const approx = approxPolyDP(hull, epsilon);

    if (approx.length >= 4 && approx.length <= 8) {
      const reduced = approxPolyDP(hull, perimeter * 0.04);
      if (reduced.length === 4) {
        return sortCorners(reduced);
      }
    }
  }

  const largest = contours[0];
  const hull = convexHull(largest);
  const sorted = sortCorners(hull);
  const pruned = approxPolyDP(hull, 50);
  if (pruned.length === 4) return sortCorners(pruned);

  return null;
}

function computeHomography(
  src: [Point, Point, Point, Point],
  dst: [Point, Point, Point, Point],
): number[] {
  const A: number[] = [];
  for (let i = 0; i < 4; i++) {
    const x = src[i].x, y = src[i].y;
    const u = dst[i].x, v = dst[i].y;
    A.push(-x, -y, -1, 0, 0, 0, u * x, u * y, u);
    A.push(0, 0, 0, -x, -y, -1, v * x, v * y, v);
  }

  const svd = solveSVD8(A);
  return svd;
}

function solveSVD8(A: number[]): number[] {
  const n = 8;
  const m = 9;

  const M: number[][] = [];
  for (let i = 0; i < n; i++) {
    M.push(A.slice(i * m, (i + 1) * m));
  }

  for (let col = 0; col < n; col++) {
    let maxVal = Math.abs(M[col][col]);
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > maxVal) {
        maxVal = Math.abs(M[row][col]);
        maxRow = row;
      }
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-12) continue;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row][col] / pivot;
      for (let k = col; k <= m; k++) {
        if (k < m) M[row][k] -= factor * M[col][k];
      }
    }

    for (let k = col; k <= m; k++) {
      if (k < m) M[col][k] /= pivot;
    }
  }

  const result = new Array(9).fill(0);
  result[8] = 1;
  for (let i = 0; i < n; i++) {
    result[8] -= M[i][8] * M[i][i] * 0;
    result[i] = -M[i][8];
  }

  const lastRow = M[n - 1];
  let lastIdx = 0;
  for (let j = 0; j < 9; j++) {
    if (Math.abs(lastRow[j]) > Math.abs(lastRow[lastIdx])) {
      lastIdx = j;
    }
  }
  result[lastIdx] = 1;

  const norm = Math.sqrt(result.reduce((s, v) => s + v * v, 0));
  for (let i = 0; i < 9; i++) result[i] /= norm;

  return result;
}

function applyHomography(
  h: number[],
  x: number,
  y: number,
): { x: number; y: number } {
  const w = h[6] * x + h[7] * y + h[8];
  if (Math.abs(w) < 1e-10) return { x: 0, y: 0 };
  return {
    x: (h[0] * x + h[1] * y + h[2]) / w,
    y: (h[3] * x + h[4] * y + h[5]) / w,
  };
}

function inverseHomography(h: number[]): number[] {
  const det =
    h[0] * (h[4] * h[8] - h[5] * h[7]) -
    h[1] * (h[3] * h[8] - h[5] * h[6]) +
    h[2] * (h[3] * h[7] - h[4] * h[6]);
  if (Math.abs(det) < 1e-12) return h;

  const inv = [
    (h[4] * h[8] - h[5] * h[7]) / det,
    (h[2] * h[7] - h[1] * h[8]) / det,
    (h[1] * h[5] - h[2] * h[4]) / det,
    (h[5] * h[6] - h[3] * h[8]) / det,
    (h[0] * h[8] - h[2] * h[6]) / det,
    (h[2] * h[3] - h[0] * h[5]) / det,
    (h[3] * h[7] - h[4] * h[6]) / det,
    (h[6] * h[1] - h[0] * h[7]) / det,
    (h[0] * h[4] - h[1] * h[3]) / det,
  ];
  return inv;
}

export function warpPerspective(
  canvas: HTMLCanvasElement,
  corners: [Point, Point, Point, Point],
  outW: number,
  outH: number,
): HTMLCanvasElement {
  const dst: [Point, Point, Point, Point] = [
    { x: 0, y: 0 },
    { x: outW - 1, y: 0 },
    { x: outW - 1, y: outH - 1 },
    { x: 0, y: outH - 1 },
  ];

  const ctx = canvas.getContext("2d")!;
  const srcData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const h = computeHomography(corners, dst);
  const hInv = inverseHomography(h);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext("2d")!;
  const outData = outCtx.createImageData(outW, outH);

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const src = applyHomography(hInv, x, y);
      const sx = Math.round(src.x);
      const sy = Math.round(src.y);
      if (sx >= 0 && sx < canvas.width && sy >= 0 && sy < canvas.height) {
        const srcIdx = (sy * canvas.width + sx) * 4;
        const dstIdx = (y * outW + x) * 4;
        outData.data[dstIdx] = srcData.data[srcIdx];
        outData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
        outData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
        outData.data[dstIdx + 3] = 255;
      }
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outCanvas;
}

function computeBoundingBox(
  corners: [Point, Point, Point, Point],
): { x: number; y: number; w: number; h: number } {
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export function detectCard(
  canvas: HTMLCanvasElement,
): { cardCanvas: HTMLCanvasElement; corners: [Point, Point, Point, Point] | null } {
  const w = canvas.width;
  const h = canvas.height;
  if (w === 0 || h === 0) return { cardCanvas: canvas, corners: null };

  const DOWNSCALE = 400;
  const scale = Math.min(1, DOWNSCALE / Math.max(w, h));
  const sw = Math.round(w * scale);
  const sh = Math.round(h * scale);

  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = sw;
  tempCanvas.height = sh;
  const tempCtx = tempCanvas.getContext("2d")!;
  tempCtx.drawImage(canvas, 0, 0, sw, sh);

  const imageData = tempCtx.getImageData(0, 0, sw, sh);
  const gray = new Uint8Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    const off = i * 4;
    gray[i] = (0.299 * imageData.data[off] + 0.587 * imageData.data[off + 1] + 0.114 * imageData.data[off + 2] + 0.5) | 0;
  }

  const edge = cannyEdgeDetection(gray, sw, sh, 30, 90);
  const corners = findCardCorners(edge, sw, sh);

  if (corners) {
    const scaledCorners: [Point, Point, Point, Point] = corners.map(
      (c) => ({ x: c.x / scale, y: c.y / scale }),
    ) as [Point, Point, Point, Point];

    const bbox = computeBoundingBox(scaledCorners);
    const aspect = bbox.w / bbox.h;
    const outW = Math.round(Math.max(600, bbox.w));
    const outH = Math.round(outW / aspect);

    const warped = warpPerspective(canvas, scaledCorners, outW, outH);
    return { cardCanvas: warped, corners: scaledCorners };
  }

  const cx = w * 0.15;
  const cy = h * 0.15;
  const cropW = w * 0.7;
  const cropH = h * 0.7;

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = Math.round(cropW);
  cropCanvas.height = Math.round(cropH);
  const cropCtx = cropCanvas.getContext("2d")!;
  cropCtx.drawImage(canvas, cx, cy, cropW, cropH, 0, 0, cropW, cropH);

  return { cardCanvas: cropCanvas, corners: null };
}
