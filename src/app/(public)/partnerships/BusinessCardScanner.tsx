"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Camera, Loader2, CheckCircle2, ShieldAlert, VideoOff,
  MonitorOff, UploadCloud, ScanLine, RotateCcw, AlertCircle,
} from "lucide-react";
import { CameraService } from "@/lib/camera-service";
import { type ScannedCard } from "./scanner-types";
import { parseCardText } from "./parse-card";
export type { ScannedCard };

type Phase =
  | "preflight" | "idle" | "requesting" | "live" | "denied"
  | "not_found" | "not_readable" | "security_err" | "type_err"
  | "cam_error" | "insecure" | "success" | "error";

function checkEnvironment(): "insecure" | "type_err" | null {
  if (typeof window !== "undefined" && !window.isSecureContext) return "insecure";
  if (!navigator?.mediaDevices?.getUserMedia) return "type_err";
  return null;
}

async function queryCameraPermission(): Promise<PermissionStatus | null> {
  try { return await navigator.permissions.query({ name: "camera" as PermissionName }); }
  catch { return null; }
}

function classifyError(err: unknown): Phase {
  if (err instanceof TypeError) return "type_err";
  if (!(err instanceof DOMException)) return "cam_error";
  switch (err.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":  return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":   return "not_found";
    case "NotReadableError":
    case "TrackStartError":        return "not_readable";
    case "SecurityError":          return "security_err";
    default:                       return "cam_error";
  }
}

export default function BusinessCardScanner({
  onClose,
  onScan,
}: {
  onClose: () => void;
  onScan: (card: ScannedCard) => void;
}) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const stoppedRef  = useRef(false);
  const ocrWorkerRef    = useRef<Worker | null>(null);
  const ocrReadyRef     = useRef(false);
  const ocrResolveRef   = useRef<((result: string | null) => void) | null>(null);

  const [phase, setPhase]           = useState<Phase>("preflight");
  const [lastCardName, setLastCardName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  // ── Pre-flight ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const envErr = checkEnvironment();
      if (envErr) { if (!cancelled) setPhase(envErr); return; }

      const live = CameraService.getLiveStream();
      if (live && videoRef.current) {
        videoRef.current.srcObject = live;
        if (!cancelled) setPhase("live");
        return;
      }

      const perm = await queryCameraPermission();
      if (perm?.state === "denied") { if (!cancelled) setPhase("denied"); return; }
      if (!cancelled) setPhase("idle");
    })();
    return () => { cancelled = true; };
  }, []);

  // ── OCR worker warmup ─────────────────────────────────────────────────────
  useEffect(() => {
    setOcrLoading(true);
    const worker = new Worker("/ocr-worker.js");
    ocrWorkerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === "ready") {
        ocrReadyRef.current = true;
        setOcrLoading(false);
      } else if (msg.type === "result") {
        ocrResolveRef.current?.(msg.text || null);
        ocrResolveRef.current = null;
      } else if (msg.type === "error") {
        console.warn("OCR worker error:", msg.message);
        ocrResolveRef.current?.(null);
        ocrResolveRef.current = null;
      }
    };

    worker.postMessage({ type: "init" });

    return () => {
      worker.terminate();
      ocrWorkerRef.current = null;
      ocrReadyRef.current = false;
    };
  }, []);

  // ── Camera start ───────────────────────────────────────────────────────────
  const handleStartCamera = async () => {
    const live = CameraService.getLiveStream();
    if (live && videoRef.current) { videoRef.current.srcObject = live; setPhase("live"); return; }
    setPhase("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      CameraService.setStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setPhase("live");
    } catch (err) {
      const ep = classifyError(err);
      if (ep !== "denied" && ep !== "security_err" && ep !== "type_err") {
        try {
          const fb = await navigator.mediaDevices.getUserMedia({ video: true });
          CameraService.setStream(fb);
          if (videoRef.current) videoRef.current.srcObject = fb;
          setPhase("live"); return;
        } catch (fe) { setPhase(classifyError(fe)); return; }
      }
      setPhase(ep);
    }
  };

  // ── Client-side OCR via Web Worker ────────────────────────────────────────
  const scanWithWorker = useCallback(async (imageData: ImageData): Promise<Partial<ScannedCard> | null> => {
    const worker = ocrWorkerRef.current;
    if (!worker || !ocrReadyRef.current) return null;

    return new Promise((resolve) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const timeout = setTimeout(() => {
        if (ocrResolveRef.current === resolve) ocrResolveRef.current = null;
        resolve(null);
      }, 30000);

      ocrResolveRef.current = (text) => {
        clearTimeout(timeout);
        if (!text || text.length < 2) { resolve(null); return; }
        const parsed = parseCardText(text);
        resolve({ ...parsed, confidence: 70 });
      };

      worker.postMessage({
        type: "scan",
        imageData,
        id,
        variants: ["original", "contrast", "sharpen"],
      });
    });
  }, []);

  // ── Grab frame and scan ────────────────────────────────────────────────────
  const doScan = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    setErrorMsg(null);
    setScanning(true);

    if (!ocrReadyRef.current) {
      setScanning(false);
      setErrorMsg("OCR engine not ready yet. Try again in a moment.");
      return null;
    }

    const result = await scanWithWorker(imageData);

    setScanning(false);
    return result;
  }, [scanWithWorker]);

  // ── Manual scan button handler ─────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    if (scanning) return;
    const card = await doScan();
    if (card && !stoppedRef.current) {
      const scanned: ScannedCard = {
        id: card.id ?? crypto.randomUUID(),
        name: card.name ?? "Unknown",
        email: card.email ?? null,
        phone: card.phone ?? null,
        company: card.company ?? null,
        title: card.title ?? null,
        website: card.website ?? null,
        address: card.address ?? null,
        phones: card.phones ?? [],
        emails: card.emails ?? [],
        socials: card.socials ?? [],
        rawText: card.rawText ?? "",
        confidence: card.confidence ?? 50,
      };
      onScan(scanned);
      setLastCardName(scanned.name);
      setPhase("success");
      fetch("/api/scan-card", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scanned),
      }).catch(() => {});
    } else {
      setErrorMsg("Could not read card. Try better lighting or upload a photo.");
    }
  }, [doScan, onScan, scanning]);

  // ── Upload fallback ──────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const max = 1200;
      const s = Math.min(1, max / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * s);
      canvas.height = Math.round(img.height * s);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      setScanning(true);
      setErrorMsg(null);

      if (!ocrReadyRef.current) {
        setScanning(false);
        setErrorMsg("OCR engine still loading. Try again in a moment.");
        return;
      }

      const card = await scanWithWorker(imageData);

      setScanning(false);

      if (card && (card.name || card.email || card.phone)) {
        const scanned: ScannedCard = {
          id: card.id ?? crypto.randomUUID(), name: card.name ?? "Unknown",
          email: card.email ?? null, phone: card.phone ?? null,
          company: card.company ?? null, title: card.title ?? null,
          website: card.website ?? null, address: card.address ?? null,
          phones: card.phones ?? [], emails: card.emails ?? [],
          socials: card.socials ?? [], rawText: card.rawText ?? "",
          confidence: card.confidence ?? 50,
        };
        onScan(scanned);
        setLastCardName(scanned.name);
        setPhase("success");
        fetch("/api/scan-card", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scanned),
        }).catch(() => {});
      } else {
        setErrorMsg("Could not read text from this image.");
      }
    };
    img.src = URL.createObjectURL(file);
  };

  // ── Re-scan ──────────────────────────────────────────────────────────────
  const handleRescan = () => {
    setPhase("live");
    setLastCardName(null);
    setErrorMsg(null);
    stoppedRef.current = false;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const renderViewport = () => {
    switch (phase) {
      case "preflight":
      case "idle":
        return (
          <Centered>
            <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
              <Camera size={30} className="text-[var(--accent)]" />
            </div>
            <p className="font-semibold text-[var(--text-primary)]">Allow camera access</p>
            <p className="max-w-xs text-sm text-[var(--text-secondary)]">
              Point your camera at a business card — press the scan button.
            </p>
            <button onClick={handleStartCamera}
              className="flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-[var(--accent-on)]"
              style={{ background: "var(--accent)" }}>
              <Camera size={17} /> Enable Camera
            </button>
          </Centered>
        );

      case "requesting":
        return (
          <Centered dark>
            <Loader2 size={36} className="animate-spin text-[var(--accent)]" />
            <p className="font-medium text-white">Requesting camera…</p>
          </Centered>
        );

      case "live":
        return (
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-6">
              <span className="absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] border-white/90" />
              <span className="absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] border-white/90" />
              <span className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-white/90" />
              <span className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-white/90" />
            </div>

            {scanning && (
              <div className="absolute inset-x-6" style={{ top: "1.5rem", bottom: "1.5rem", overflow: "hidden" }}>
                <div className="absolute inset-x-0 h-[2px] bg-[var(--accent)]"
                  style={{ boxShadow: "0 0 10px 3px var(--accent)", animation: "scanline 1.4s ease-in-out infinite alternate" }} />
              </div>
            )}

            {ocrLoading && !scanning && (
              <div className="absolute left-3 right-3 flex justify-center" style={{ top: "4rem" }}>
                <span className="rounded-full bg-amber-600/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <Loader2 size={11} className="mr-1 inline animate-spin" />
                  Loading OCR engine…
                </span>
              </div>
            )}

            {errorMsg && (
              <div className="absolute left-3 right-3 flex justify-center" style={{ top: "6rem" }}>
                <span className="rounded-full bg-red-600/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  {errorMsg}
                </span>
              </div>
            )}

            {!scanning && (
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white/70 backdrop-blur-sm">
                  <ScanLine size={11} />
                  Press scan below
                </span>
              </div>
            )}
          </div>
        );

      case "success":
        return (
          <Centered dark>
            <CheckCircle2 size={52} className="text-green-400" />
            <p className="font-semibold text-white">Card captured!</p>
            {lastCardName && lastCardName !== "Unknown" && (
              <p className="text-sm text-white/70">{lastCardName}</p>
            )}
            <p className="text-xs text-white/50">Added below ↓</p>
          </Centered>
        );

      case "denied":
        return (
          <Centered bg>
            <ShieldAlert size={32} className="text-amber-400" />
            <p className="font-semibold text-[var(--text-primary)]">Camera is blocked</p>
            <p className="max-w-xs text-sm text-[var(--text-secondary)]">
              Click the lock icon in your address bar → set Camera → Allow → reload.
            </p>
          </Centered>
        );

      case "not_found":
        return (
          <Centered bg>
            <VideoOff size={32} className="text-[var(--text-tertiary)]" />
            <p className="font-semibold text-[var(--text-primary)]">No camera found</p>
            <p className="text-sm text-[var(--text-secondary)]">Upload a photo instead.</p>
          </Centered>
        );

      default:
        return (
          <Centered bg>
            <VideoOff size={32} className="text-[var(--text-tertiary)]" />
            <p className="font-semibold text-[var(--text-primary)]">Camera unavailable</p>
            <p className="text-sm text-[var(--text-secondary)]">Upload a photo instead.</p>
          </Centered>
        );
    }
  };

  return (
    <>
      <style>{`
        @keyframes scanline {
          from { top: 0; }
          to   { top: calc(100% - 2px); }
        }
      `}</style>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
        <div className="w-full max-w-lg overflow-hidden rounded-[var(--r-xl)] bg-[var(--bg-base)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-6 py-4">
            <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">Scan Business Card</h3>
            <button onClick={onClose} aria-label="Close scanner"
              className="rounded-md p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              <X size={20} />
            </button>
          </div>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline muted
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                phase === "live" || phase === "success" ? "opacity-100" : "opacity-0"
              }`} />
            <canvas ref={canvasRef} className="hidden" />
            {renderViewport()}
          </div>
          <div className="flex items-center gap-3 p-5">
            {phase === "live" && (
              <button
                onClick={handleScan}
                disabled={scanning}
                className="flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: scanning ? "var(--accent-dim, #666)" : "var(--accent)" }}
              >
                {scanning ? <Loader2 size={15} className="animate-spin" /> : <ScanLine size={15} />}
                {scanning ? "Scanning…" : "Scan now"}
              </button>
            )}

            {phase === "success" && (
              <button onClick={handleRescan}
                className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <RotateCcw size={15} /> Scan another
              </button>
            )}

            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <UploadCloud size={15} /> Upload image
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

function Centered({ children, dark, bg }: { children: React.ReactNode; dark?: boolean; bg?: boolean }) {
  return (
    <div className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center ${
      dark ? "bg-black/80" : "bg-[var(--bg-base)]"
    }`}>
      {children}
    </div>
  );
}
