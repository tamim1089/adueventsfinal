import {
  type QualityScores,
  assessFrameQuality,
  isCardQualityGood,
} from "./frame-quality";
import {
  type CardRegion,
  detectCard,
  cropAndDeskew,
} from "./card-detector";
import { type ScannedCard } from "@/app/(public)/partnerships/scanner-types";
import { parseCardText, fuseScans } from "@/app/(public)/partnerships/parse-card";

const CARD_TARGET_W = 800;
const CARD_TARGET_H = 500;
const QUALITY_DETECT_W = 640;

const VARIANTS_FALLBACK = ["threshold", "denoised"];

export interface PipelineFrame {
  id: number;
  quality: QualityScores;
  cardRegion: CardRegion | null;
  ocrResults: OcrResult[];
  timestamp: number;
}

export interface OcrResult {
  variant: string;
  text: string;
  confidence: number;
}

export type PipelineState =
  | "idle"
  | "warming"
  | "ready"
  | "monitoring"
  | "detecting"
  | "reading"
  | "fusing"
  | "success"
  | "error";

export type PipelineStatus = {
  state: PipelineState;
  message: string;
  frameCount: number;
  lastQuality: QualityScores | null;
  lastCardRegion: CardRegion | null;
};

export class OcrPipeline {
  private worker: Worker | null = null;
  private workerReady = false;
  private workerQueue: Array<{
    resolve: (result: OcrResult) => void;
    reject: (err: Error) => void;
    imageData: ImageData;
    id: string;
    variant: string;
  }> = [];
  private workerPending = 0;
  private _state: PipelineState = "idle";
  private _frameId = 0;
  private _frames: PipelineFrame[] = [];
  private _framesNeeded = 3;
  private _maxFrames = 6;
  private _captureTimeoutMs = 20000;
  private _startTime = 0;
  private onStatusChange: ((status: PipelineStatus) => void) | null = null;
  private prevEdgeMap: Uint8Array | null = null;
  private _aborted = false;

  get state(): PipelineState { return this._state; }
  get frames(): PipelineFrame[] { return this._frames; }

  setStatusCallback(cb: (status: PipelineStatus) => void): void {
    this.onStatusChange = cb;
  }

  private emitStatus(message: string) {
    this.onStatusChange?.({
      state: this._state,
      message,
      frameCount: this._frames.length,
      lastQuality: null,
      lastCardRegion: null,
    });
  }

  async warmup(): Promise<void> {
    if (this.workerReady) return;
    this._state = "warming";
    this.emitStatus("Loading OCR engine...");

    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker("/ocr-worker.js");
        this.worker.onmessage = (e) => {
          const msg = e.data;
          if (msg.type === "ready") {
            this.workerReady = true;
            this._state = "ready";
            this.emitStatus("OCR ready");
            this.processQueue();
            resolve();
          } else if (msg.type === "result") {
            this.workerPending--;
            const item = this.workerQueue.shift();
            if (item) {
              const result: OcrResult = {
                variant: msg.variant,
                text: msg.text,
                confidence: msg.confidence ?? 0,
              };
              item.resolve(result);
            }
            this.processQueue();
          } else if (msg.type === "error") {
            this.workerPending--;
            const item = this.workerQueue.shift();
            if (item) {
              item.reject(new Error(msg.message));
            }
            this.processQueue();
          }
        };
        this.worker.onerror = (err) => {
          reject(new Error(`Worker error: ${err.message}`));
        };
        this.worker.postMessage({ type: "init" });
      } catch (err) {
        reject(err);
      }
    });
  }

  private processQueue() {
    while (this.workerReady && this.workerPending < 1 && this.workerQueue.length > 0 && !this._aborted) {
      const item = this.workerQueue[0];
      this.workerPending++;
      this.worker!.postMessage(
        {
          type: "scan",
          imageData: item.imageData,
          id: item.id,
          variants: [item.variant],
        },
      );
    }
  }

  async ocrVariant(
    imageData: ImageData,
    variant: string,
    timeoutMs = 15000,
  ): Promise<OcrResult> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.workerQueue.findIndex((q) => q.id === id);
        if (idx >= 0) {
          this.workerQueue.splice(idx, 1);
          this.workerPending--;
        }
        reject(new Error(`OCR timeout for variant "${variant}"`));
      }, timeoutMs);

      this.workerQueue.push({
        resolve: (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
        imageData,
        id,
        variant,
      });

      this.processQueue();
    });
  }

  async processFrame(video: HTMLVideoElement): Promise<PipelineFrame | null> {
    if (this._aborted) return null;
    if (video.readyState < 2 || video.videoWidth === 0) return null;

    const frameId = ++this._frameId;
    const timestamp = Date.now();

    const capture = this.captureVideoFrame(video, QUALITY_DETECT_W);
    if (!capture) return null;

    const { full, downsampled } = capture;
    const quality = assessFrameQuality(downsampled, this.prevEdgeMap);

    this.prevEdgeMap = computeEdgeMapForMotion(downsampled);

    if (!isCardQualityGood(quality)) {
      return null;
    }

    this._state = "detecting";
    this.emitStatus("Card detected, analysing...");

    const cardRegion = detectCard(downsampled);

    if (!cardRegion) {
      this._state = "monitoring";
      this.emitStatus("Hold card steady...");
      return null;
    }

    if (cardRegion.confidence < 0.3) {
      this._state = "monitoring";
      this.emitStatus("Card too far or unclear");
      return null;
    }

    this._state = "reading";
    this.emitStatus("Reading card...");

    const crop = cropAndDeskew(full, cardRegion, CARD_TARGET_W, CARD_TARGET_H);

    const mainVariants = ["original", "contrast", "sharpen"];
    const ocrResults: OcrResult[] = [];

    for (const variant of mainVariants) {
      if (this._aborted) return null;
      try {
        const result = await this.ocrVariant(crop, variant);
        if (result.text && result.text.length > 3) {
          ocrResults.push(result);
        }
      } catch {
        // continue with next variant
      }
    }

    if (ocrResults.length === 0) {
      for (const variant of VARIANTS_FALLBACK) {
        if (this._aborted) return null;
        try {
          const result = await this.ocrVariant(crop, variant);
          if (result.text && result.text.length > 3) {
            ocrResults.push(result);
          }
        } catch {
          // continue
        }
      }
    }

    const frame: PipelineFrame = {
      id: frameId,
      quality,
      cardRegion,
      ocrResults,
      timestamp,
    };

    return frame;
  }

  private captureVideoFrame(
    video: HTMLVideoElement,
    maxDim: number,
  ): { full: ImageData; downsampled: ImageData } | null {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (vw === 0 || vh === 0) return null;

    const canvas = document.createElement("canvas");

    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const full = ctx.getImageData(0, 0, vw, vh);

    const scale = Math.min(1, maxDim / Math.max(vw, vh));
    const dw = Math.round(vw * scale);
    const dh = Math.round(vh * scale);
    canvas.width = dw;
    canvas.height = dh;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(video, 0, 0, dw, dh);
    const downsampled = ctx.getImageData(0, 0, dw, dh);

    return { full, downsampled };
  }

  async startCapture(video: HTMLVideoElement): Promise<Partial<ScannedCard> | null> {
    this._aborted = false;
    this._frames = [];
    this._startTime = Date.now();
    this._state = "monitoring";
    this.emitStatus("Hold card steady...");

    const captureInterval = 800;
    let consecutiveFails = 0;

    while (!this._aborted) {
      if (Date.now() - this._startTime > this._captureTimeoutMs) {
        this._state = "error";
        this.emitStatus("Timed out — try uploading a photo");
        break;
      }

      await sleep(captureInterval);

      try {
        const frame = await this.processFrame(video);

        if (frame && frame.ocrResults.length > 0) {
          this._frames.push(frame);
          consecutiveFails = 0;
          this._state = "reading";
          this.emitStatus(`Reading card (${this._frames.length}/${this._framesNeeded})...`);
        } else {
          consecutiveFails++;
          if (consecutiveFails < 5) {
            if (frame && frame.cardRegion) {
              this._state = "reading";
              this.emitStatus("Reading card...");
            } else {
              this._state = "monitoring";
              this.emitStatus("Hold card steady...");
            }
          }
        }

        if (this._frames.length >= this._framesNeeded) break;

        if (consecutiveFails >= 12) {
          if (this._frames.length === 0) {
            this._state = "error";
            this.emitStatus("Could not detect a card");
            break;
          }
          break;
        }
      } catch {
        consecutiveFails++;
        if (consecutiveFails >= 12 && this._frames.length === 0) break;
      }
    }

    return this.finalize();
  }

  private finalize(): Partial<ScannedCard> | null {
    if (this._frames.length === 0) return null;

    this._state = "fusing";
    this.emitStatus("Combining results...");

    const parsedCards: Partial<ScannedCard>[] = [];

    for (const frame of this._frames) {
      const texts = frame.ocrResults.map((r) => r.text);
      const bestText = texts.sort((a, b) => b.length - a.length)[0] ?? "";

      if (bestText.length > 5) {
        const parsed = parseCardText(bestText, texts);
        parsedCards.push(parsed);
      }
    }

    if (parsedCards.length === 0) return null;

    const fused = fuseScans(parsedCards);

    this._state = "success";
    this.emitStatus("Card captured!");

    return fused;
  }

  abort(): void {
    this._aborted = true;
    this._state = "idle";
  }

  reset(): void {
    this._aborted = false;
    this._frames = [];
    this._frameId = 0;
    this._state = "ready";
    this.prevEdgeMap = null;
    this.emitStatus("Ready");
  }

  destroy(): void {
    this.abort();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.workerReady = false;
    this.workerQueue = [];
    this.workerPending = 0;
  }
}

function computeEdgeMapForMotion(imageData: ImageData): Uint8Array {
  const { data, width, height } = imageData;
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    gray[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) | 0;
  }

  const edges = new Uint8Array(width * height);
  const step = 2;
  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const i = y * width + x;
      const gx = gray[i + 1] - gray[i - 1];
      const gy = gray[i + width] - gray[i - width];
      const mag = Math.sqrt(gx * gx + gy * gy);
      edges[i] = mag > 30 ? Math.min(255, mag | 0) : 0;
    }
  }
  return edges;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
