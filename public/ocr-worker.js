/**
 * ocr-worker.js — Multi-variant OCR worker using Tesseract.js
 *
 * Protocol:
 *   main → worker: { type: 'init' }
 *   main → worker: { type: 'scan', imageData: ImageData, id: string, variants: string[] }
 *   worker → main: { type: 'ready' }
 *   worker → main: { type: 'result', id: string, variant: string, text: string, confidence: number }
 *   worker → main: { type: 'error', id: string, variant: string, message: string }
 */

importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

let worker = null;
let busy = false;

async function initWorker() {
  worker = await Tesseract.createWorker('eng', 1, {
    logger: () => {},
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    cacheMethod: 'none',
  });
  self.postMessage({ type: 'ready' });
}

self.onmessage = async (e) => {
  const { type, imageData, id, variants } = e.data;

  if (type === 'init') {
    await initWorker();
    return;
  }

  if (type === 'scan') {
    if (busy || !worker) {
      self.postMessage({ type: 'result', id, variant: 'all', text: '' });
      return;
    }
    busy = true;

    try {
      const variantsList = variants && variants.length > 0 ? variants : ['original'];

      for (const variant of variantsList) {
        const processed = preprocess(imageData, variant);
        const oc = new OffscreenCanvas(processed.width, processed.height);
        const ctx = oc.getContext('2d');
        ctx.putImageData(processed, 0, 0);
        const blob = await oc.convertToBlob({ type: 'image/png' });

        const result = await worker.recognize(blob);
        const text = (result.data.text ?? '').trim();

        let confidence = 0;
        if (result.data.confidence !== undefined) {
          confidence = result.data.confidence / 100;
        }

        self.postMessage({
          type: 'result',
          id,
          variant,
          text,
          confidence,
        });
      }
    } catch (err) {
      self.postMessage({
        type: 'error',
        id,
        variant: 'all',
        message: String(err),
      });
    } finally {
      busy = false;
    }
  }
};

function preprocess(imageData, variant) {
  const { data, width, height } = imageData;

  switch (variant) {
    case 'original':
      return toGrayscale(imageData);

    case 'contrast':
      return contrastNormalized(imageData);

    case 'sharpen':
      return sharpened(imageData);

    case 'threshold':
      return otsuThreshold(imageData);

    case 'inverted':
      return invertedThreshold(imageData);

    case 'denoised':
      return denoised(imageData);

    default:
      return toGrayscale(imageData);
  }
}

// ── Variant: grayscale only ────────────────────────────────────────────────

function toGrayscale(imageData) {
  const { data, width, height } = imageData;
  const out = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    const v = (0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2] + 0.5) | 0;
    out.data[off] = v;
    out.data[off + 1] = v;
    out.data[off + 2] = v;
    out.data[off + 3] = 255;
  }
  return out;
}

// ── Variant: contrast normalization (histogram stretching) ─────────────────

function contrastNormalized(imageData) {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  let min = 255, max = 0;
  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    const v = (0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2] + 0.5) | 0;
    gray[i] = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const range = max - min;
  const out = new ImageData(width, height);
  if (range < 10) return toGrayscale(imageData);

  for (let i = 0; i < width * height; i++) {
    const v = ((gray[i] - min) / range * 255 + 0.5) | 0;
    const clamped = Math.min(255, Math.max(0, v));
    out.data[i * 4] = clamped;
    out.data[i * 4 + 1] = clamped;
    out.data[i * 4 + 2] = clamped;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

// ── Variant: sharpened (unsharp mask on grayscale) ─────────────────────────

function sharpened(imageData) {
  const { data, width, height } = imageData;
  const gray = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    gray[i] = 0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2];
  }

  const blurred = new Float64Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const tl = y > 0 && x > 0           ? gray[(y - 1) * width + (x - 1)] : gray[i];
      const tc = y > 0                     ? gray[(y - 1) * width + x]       : gray[i];
      const tr = y > 0 && x < width - 1    ? gray[(y - 1) * width + (x + 1)] : gray[i];
      const ml = x > 0                     ? gray[y * width + (x - 1)]       : gray[i];
      const mr = x < width - 1             ? gray[y * width + (x + 1)]       : gray[i];
      const bl = y < height - 1 && x > 0   ? gray[(y + 1) * width + (x - 1)] : gray[i];
      const bc = y < height - 1            ? gray[(y + 1) * width + x]       : gray[i];
      const br = y < height - 1 && x < width - 1 ? gray[(y + 1) * width + (x + 1)] : gray[i];
      blurred[i] = (tl + tc + tr + ml + mr + bl + bc + br) / 8;
    }
  }

  const strength = 1.5;
  const out = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const v = Math.min(255, Math.max(0, gray[i] + strength * (gray[i] - blurred[i])));
    out.data[i * 4] = v;
    out.data[i * 4 + 1] = v;
    out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

// ── Variant: Otsu binary threshold ─────────────────────────────────────────

function otsuThreshold(imageData) {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    gray[i] = (0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2] + 0.5) | 0;
  }

  const hist = new Int32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

  const total = width * height;
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

  const out = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const v = gray[i] > thresh ? 255 : 0;
    out.data[i * 4] = v;
    out.data[i * 4 + 1] = v;
    out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

// ── Variant: inverted Otsu (for dark-on-light cards) ───────────────────────

function invertedThreshold(imageData) {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    gray[i] = (0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2] + 0.5) | 0;
  }

  const hist = new Int32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;

  const total = width * height;
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

  const out = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const v = gray[i] > thresh ? 0 : 255;
    out.data[i * 4] = v;
    out.data[i * 4 + 1] = v;
    out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}

// ── Variant: denoised (median filter + grayscale) ──────────────────────────

function denoised(imageData) {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    gray[i] = (0.299 * data[off] + 0.587 * data[off + 1] + 0.114 * data[off + 2] + 0.5) | 0;
  }

  const median = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const neighbours = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = Math.min(Math.max(y + dy, 0), height - 1);
          const nx = Math.min(Math.max(x + dx, 0), width - 1);
          neighbours.push(gray[ny * width + nx]);
        }
      }
      neighbours.sort((a, b) => a - b);
      median[y * width + x] = neighbours[4];
    }
  }

  const out = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const v = median[i];
    out.data[i * 4] = v;
    out.data[i * 4 + 1] = v;
    out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}
