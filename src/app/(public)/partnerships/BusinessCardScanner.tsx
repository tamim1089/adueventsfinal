"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X, Camera, Loader2, CheckCircle2, ShieldAlert, VideoOff,
  UploadCloud, ScanLine, RotateCcw,
} from "lucide-react";
import { CameraService } from "@/lib/camera-service";
import { type ScannedCard } from "./scanner-types";

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

async function scanWithVisionApi(canvas: HTMLCanvasElement): Promise<ScannedCard | null> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.8)
  );
  if (!blob) return null;

  const buffer = await blob.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const res = await fetch("/api/scan-card-vision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64, mimeType: "image/jpeg" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Vision API error");
  }

  return res.json();
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

  const [phase, setPhase]           = useState<Phase>("preflight");
  const [lastCardName, setLastCardName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

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

  // ── Grab frame and scan via Vision API ──────────────────────────────────────
  const doScan = useCallback(async (): Promise<ScannedCard | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);

    setErrorMsg(null);
    setScanning(true);

    try {
      const card = await scanWithVisionApi(canvas);
      return card;
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Vision API error");
      return null;
    } finally {
      setScanning(false);
    }
  }, []);

  // ── Manual scan button handler ─────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    if (scanning) return;
    const card = await doScan();
    if (card && !stoppedRef.current) {
      onScan(card);
      setLastCardName(card.name);
      setPhase("success");
    } else if (!errorMsg) {
      setErrorMsg("Could not read card. Try better lighting or upload a photo.");
    }
  }, [doScan, onScan, scanning, errorMsg]);

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

      setScanning(true);
      setErrorMsg(null);

      try {
        const card = await scanWithVisionApi(canvas);
        if (card && !stoppedRef.current) {
          onScan(card);
          setLastCardName(card.name);
          setPhase("success");
        } else {
          setErrorMsg("Could not read card from this image.");
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Vision API error");
      } finally {
        setScanning(false);
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

            {errorMsg && (
              <div className="absolute left-3 right-3 flex justify-center" style={{ top: "4rem" }}>
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
