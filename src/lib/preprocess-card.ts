export function grayscale(data: Uint8ClampedArray, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const off = i * 4;
    out[i] = (0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2] + 0.5) | 0;
  }
  return out;
}

export function gaussianBlur(
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

export function medianFilter(
  src: Uint8Array,
  w: number,
  h: number,
  size: number,
): Uint8Array {
  const half = size >> 1;
  const out = new Uint8Array(w * h);
  const buf = new Uint8Array(size * size);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let idx = 0;
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const ny = Math.min(Math.max(y + dy, 0), h - 1);
          const nx = Math.min(Math.max(x + dx, 0), w - 1);
          buf[idx++] = src[ny * w + nx];
        }
      }
      buf.sort();
      out[y * w + x] = buf[buf.length >> 1];
    }
  }
  return out;
}

export function adaptiveThreshold(
  src: Uint8Array,
  w: number,
  h: number,
  blockSize: number,
  c: number,
): Uint8Array {
  const half = blockSize >> 1;
  const out = new Uint8Array(w * h);

  const integral = new Int32Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += src[y * w + x];
      const above = integral[y * (w + 1) + x + 1];
      integral[(y + 1) * (w + 1) + x + 1] = above + rowSum;
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x1 = Math.max(x - half, 0);
      const x2 = Math.min(x + half, w - 1);
      const y1 = Math.max(y - half, 0);
      const y2 = Math.min(y + half, h - 1);
      const count = (x2 - x1) * (y2 - y1);

      const sum =
        integral[(y2 + 1) * (w + 1) + x2 + 1] -
        integral[y1 * (w + 1) + x2 + 1] -
        integral[(y2 + 1) * (w + 1) + x1] +
        integral[y1 * (w + 1) + x1];

      const mean = sum / count;
      out[y * w + x] = src[y * w + x] > mean - c ? 255 : 0;
    }
  }
  return out;
}

export function otsuThreshold(src: Uint8Array, w: number, h: number): Uint8Array {
  const hist = new Int32Array(256);
  for (let i = 0; i < src.length; i++) hist[src[i]]++;

  const total = w * h;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];

  let sumB = 0, wB = 0, maxVar = 0, thresh = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > maxVar) { maxVar = v; thresh = t; }
  }

  const out = new Uint8Array(src.length);
  for (let i = 0; i < src.length; i++) {
    out[i] = src[i] > thresh ? 255 : 0;
  }
  return out;
}

export function sharpenLaplacian(
  src: Uint8Array,
  w: number,
  h: number,
  strength: number,
): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x;
      const lap =
        src[(y - 1) * w + x] +
        src[(y + 1) * w + x] +
        src[y * w + (x - 1)] +
        src[y * w + (x + 1)] -
        4 * src[idx];
      out[idx] = Math.min(255, Math.max(0, src[idx] - strength * lap));
    }
  }
  return out;
}

export function toImageData(src: Uint8Array, w: number, h: number): ImageData {
  const out = new ImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    out.data[i * 4] = src[i];
    out.data[i * 4 + 1] = src[i];
    out.data[i * 4 + 2] = src[i];
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

export function canvasToGrayscale(src: HTMLCanvasElement): {
  gray: Uint8Array;
  w: number;
  h: number;
} {
  const w = src.width;
  const h = src.height;
  const ctx = src.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, w, h);
  return { gray: grayscale(imageData.data, w, h), w, h };
}

export function preprocessForOCR(
  canvas: HTMLCanvasElement,
): HTMLCanvasElement {
  const w = canvas.width;
  const h = canvas.height;
  if (w === 0 || h === 0) return canvas;

  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(0, 0, w, h);
  let gray = grayscale(imageData.data, w, h);

  gray = medianFilter(gray, w, h, 3);

  gray = gaussianBlur(gray, w, h, 3, 0.8);

  const binary = adaptiveThreshold(gray, w, h, 31, 8);

  const sharpened = sharpenLaplacian(binary, w, h, 1);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = w;
  outCanvas.height = h;

  const outCtx = outCanvas.getContext("2d")!;
  const procImg = toImageData(sharpened, w, h);
  outCtx.putImageData(procImg, 0, 0);

  return outCanvas;
}
