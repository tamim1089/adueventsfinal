/**
 * ocr-worker.js — served from /public, runs in a Web Worker.
 * Completely outside Turbopack / Next.js bundler.
 *
 * Protocol:
 *   main → worker: { type: 'init' }
 *   main → worker: { type: 'scan', imageData: ImageData, id: string }
 *   worker → main: { type: 'ready' }
 *   worker → main: { type: 'result', id: string, text: string }
 *   worker → main: { type: 'error', id: string, message: string }
 */

/* global importScripts, Tesseract */

// Load Tesseract from CDN into the worker scope
importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

let worker = null;
let busy = false;

async function initWorker() {
  worker = await Tesseract.createWorker('eng', 1, {
    logger: () => {},
    // Use CDN for training data — avoids filesystem issues in worker
    langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    cacheMethod: 'none',
  });
  self.postMessage({ type: 'ready' });
}

self.onmessage = async (e) => {
  const { type, imageData, id } = e.data;

  if (type === 'init') {
    await initWorker();
    return;
  }

  if (type === 'scan') {
    if (busy || !worker) {
      self.postMessage({ type: 'result', id, text: '' });
      return;
    }
    busy = true;
    try {
      // Full preprocessing pipeline: grayscale → denoise → Otsu threshold → sharpen
      const enhanced = preprocessImageData(imageData);

      // Create an OffscreenCanvas from the enhanced ImageData
      const oc = new OffscreenCanvas(enhanced.width, enhanced.height);
      const ctx = oc.getContext('2d');
      ctx.putImageData(enhanced, 0, 0);
      const blob = await oc.convertToBlob({ type: 'image/jpeg', quality: 0.92 });

      const result = await worker.recognize(blob);
      self.postMessage({ type: 'result', id, text: result.data.text ?? '' });
    } catch (err) {
      self.postMessage({ type: 'error', id, message: String(err) });
    } finally {
      busy = false;
    }
  }
};

/**
 * Full preprocessing pipeline:
 *   1. Grayscale
 *   2. 3×3 median denoise (removes salt-and-pepper noise from camera)
 *   3. Otsu's adaptive threshold → binary image (far better than histogram eq for text)
 *   4. Light unsharp-mask sharpening pass
 */
function preprocessImageData(imageData) {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);

  // ── Step 1: Grayscale ──────────────────────────────────────────────────────
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = (0.299 * r + 0.587 * g + 0.114 * b + 0.5) | 0;
  }

  // ── Step 2: 3×3 Median filter ─────────────────────────────────────────────
  const denoised = new Uint8Array(width * height);
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
      denoised[y * width + x] = neighbours[4]; // median of 9
    }
  }

  // ── Step 3: Otsu's threshold ──────────────────────────────────────────────
  const hist = new Int32Array(256);
  for (let i = 0; i < denoised.length; i++) hist[denoised[i]]++;

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

  const binary = new Uint8Array(width * height);
  for (let i = 0; i < denoised.length; i++) {
    binary[i] = denoised[i] > thresh ? 255 : 0;
  }

  // ── Step 4: Unsharp-mask sharpening (3×3 Laplacian) ──────────────────────
  const sharpened = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const t  = y > 0           ? binary[(y-1)*width+x] : binary[idx];
      const b2 = y < height - 1  ? binary[(y+1)*width+x] : binary[idx];
      const l  = x > 0           ? binary[y*width+(x-1)] : binary[idx];
      const r  = x < width - 1   ? binary[y*width+(x+1)] : binary[idx];
      const v  = Math.min(255, Math.max(0, 2 * binary[idx] - (t + b2 + l + r) / 4));
      sharpened[idx] = v < 128 ? 0 : 255; // keep binary
    }
  }

  // ── Write back as RGBA ─────────────────────────────────────────────────────
  const out = new ImageData(width, height);
  for (let i = 0; i < width * height; i++) {
    const v = sharpened[i];
    out.data[i * 4]     = v;
    out.data[i * 4 + 1] = v;
    out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  return out;
}
