"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  X,
  Camera,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  VideoOff,
  WifiOff,
  UploadCloud,
  MonitorOff,
  ScanLine,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { CameraService } from "@/lib/camera-service";
import { assessFrameSharpness } from "@/lib/frame-quality";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

import { type ScannedCard } from "./scanner-types";
export type { ScannedCard };

type Phase =
  | "preflight"
  | "idle"
  | "requesting"
  | "live"
  | "denied"
  | "not_found"
  | "not_readable"
  | "security_err"
  | "type_err"
  | "cam_error"
  | "insecure"
  | "success";

// ─────────────────────────────────────────────────────────────────────────────
// Card parser
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_RX   = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const PHONE_RX   = /(\+?[\d][\d\s\-().]{5,17}[\d])/;
const TITLE_KW   = /\b(ceo|coo|cto|cfo|vp|vice|director|manager|engineer|consultant|specialist|president|officer|head|lead|senior|analyst|advisor|professor|founder|partner|dr\.?)\b/i;
const COMPANY_KW = /\b(llc|ltd|inc|corp|co\.|group|holdings|university|institute|authority|ministry|department|company|solutions|services|technologies|global|international)\b/i;

function parseCard(rawText: string): Omit<ScannedCard, "id" | "rawText" | "confidence"> {
  const lines = rawText
    .split("\n")
    .map((l) => l.replace(/\|/g, "").trim())
    .filter((l) => l.length > 2);

  const emails: string[]  = [];
  const phones: string[]  = [];
  let title: string | null   = null;
  let company: string | null = null;
  let website: string | null = null;
  let address: string | null = null;
  const socials: string[] = [];
  const rest: string[] = [];

  for (const line of lines) {
    const emailMatch = line.match(EMAIL_RX);
    if (emailMatch) { emails.push(emailMatch[0].toLowerCase()); continue; }

    const phoneMatch = line.match(PHONE_RX);
    if (phoneMatch) {
      const p = phoneMatch[0].trim();
      if (p.replace(/\D/g, "").length >= 7) { phones.push(p); continue; }
    }

    if (/^https?:\/\//i.test(line) || /^www\./i.test(line)) { website = line; continue; }
    if (!title && TITLE_KW.test(line) && line.length < 80) { title = line; continue; }
    if (!company && COMPANY_KW.test(line) && line.length < 80) { company = line; continue; }
    rest.push(line);
  }

  const NAME_RX = /^[A-ZÀ-Ö][a-zA-Zà-ö'-]+([ ][A-ZÀ-Ö][a-zA-Zà-ö'-]+){0,4}$/;
  const name =
    rest.find((l) => NAME_RX.test(l) && l.split(/\s+/).length <= 5)
    ?? rest[0]
    ?? lines[0]
    ?? "Unknown";

  return {
    name: name.trim(),
    email: emails[0] ?? null,
    phone: phones[0] ?? null,
    company, title, website, address,
    emails, phones, socials,
  };
}

function hasSignal(card: Omit<ScannedCard, "id" | "rawText" | "confidence">): boolean {
  return !!(card.email || card.phone);
}

// ─────────────────────────────────────────────────────────────────────────────
// Env helpers
// ─────────────────────────────────────────────────────────────────────────────

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

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function BusinessCardScanner({
  onClose,
  onScan,
}: {
  onClose: () => void;
  onScan: (card: ScannedCard) => void;
}) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const permRef     = useRef<PermissionStatus | null>(null);
  const scanningRef = useRef(false);
  const stoppedRef  = useRef(false);
  const lastKeyRef  = useRef("");

  // Singleton Tesseract worker
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workerRef      = useRef<any>(null);
  const workerReadyRef = useRef(false);

  const [phase, setPhase]           = useState<Phase>("preflight");
  const [workerReady, setWorkerReady] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "focusing" | "reading">("idle");
  const [lastCardName, setLastCardName] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [ocrInitKey, setOcrInitKey] = useState(0);

  // ── Boot Tesseract worker once on mount (retry via ocrInitKey) ────────────
  useEffect(() => {
    let alive = true;
    setOcrError(null);
    setWorkerReady(false);
    workerReadyRef.current = false;

    // Terminate any previous worker before re-initialising
    workerRef.current?.terminate().catch(() => {});
    workerRef.current = null;

    (async () => {
      try {
        const { createWorker } = await import("tesseract.js");
        const w = await createWorker("eng", 1, { logger: () => {} });
        if (!alive) { w.terminate(); return; }
        workerRef.current = w;
        workerReadyRef.current = true;
        setWorkerReady(true);
      } catch (err) {
        if (!alive) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load OCR engine";
        setOcrError(msg);
      }
    })();

    return () => {
      alive = false;
      workerRef.current?.terminate().catch(() => {});
      workerRef.current = null;
      workerReadyRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrInitKey]);

  // ── Loading timeout: show hint after 20s ────────────────────────────────
  useEffect(() => {
    if (workerReady || ocrError) return;
    const id = setTimeout(() => {
      setOcrError(
        "OCR engine is taking longer than expected. Try uploading an image instead, or close and reopen the scanner."
      );
    }, 20000);
    return () => clearTimeout(id);
  }, [workerReady, ocrError]);

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
      permRef.current = perm;
      if (!cancelled) {
        setPhase(perm?.state === "denied" ? "denied" : "idle");
        perm?.addEventListener("change", () => {
          if (!cancelled) setPhase(perm.state === "denied" ? "denied" : "idle");
        });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Camera start ───────────────────────────────────────────────────────────
  const handleStartCamera = async () => {
    if (permRef.current?.state === "denied") { setPhase("denied"); return; }
    const live = CameraService.getLiveStream();
    if (live && videoRef.current) { videoRef.current.srcObject = live; setPhase("live"); return; }
    setPhase("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
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
          setPhase("live");
          return;
        } catch (fe) { setPhase(classifyError(fe)); return; }
      }
      setPhase(ep);
    }
  };

  // ── Grab frame from video → canvas → dataURL ──────────────────────────────
  const grabFrame = useCallback((): string | null => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return null;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, []);

  // ── Auto-scan loop with frame-quality gate ──────────────────────────────────
  useEffect(() => {
    if (phase !== "live" || !workerReady) return;

    stoppedRef.current = false;

    const loop = async () => {
      // Give camera a moment to warm up
      await wait(600);

      // ── Candidate accumulation ───────────────────────────────────────────────
      type Candidate = {
        parsed: Omit<ScannedCard, "id" | "rawText" | "confidence">;
        rawText: string;
        sharpness: number;
        ocrConfidence: number;
      };
      const candidates: Candidate[] = [];

      const WINDOW_MS     = 2500;  // collect good frames for up to this long
      const MAX_WAIT_MS   = 12000; // give up after this if zero candidates
      const MIN_CONFIDENT = 2;     // accept early after this many good scans
      const QUALITY_MIN   = 0.28;  // blur-gate threshold (0-1)

      const startTime = performance.now();

      while (!stoppedRef.current) {
        const elapsed = performance.now() - startTime;

        // ── Exit conditions ─────────────────────────────────────────────
        if (candidates.length >= MIN_CONFIDENT) break;
        if (candidates.length > 0 && elapsed >= WINDOW_MS) break;
        if (elapsed >= MAX_WAIT_MS) break;

        if (scanningRef.current) { await wait(200); continue; }

        const dataUrl = grabFrame();
        if (!dataUrl) { await wait(300); continue; }

        // ── Layer 1: quick sharpness gate (< 5 ms) ──────────────────────
        if (!canvasRef.current) { await wait(300); continue; }
        const sharpness = assessFrameSharpness(canvasRef.current);

        if (sharpness < QUALITY_MIN) {
          setScanStatus("focusing");
          await wait(150);
          continue;
        }

        // ── Layer 2: OCR on the high-quality frame ──────────────────────
        scanningRef.current = true;
        setScanStatus("reading");

        try {
          const { data } = await workerRef.current.recognize(dataUrl);
          const rawText: string = data.text ?? "";
          const ocrConfidence: number = data.confidence ?? 0;

          if (!stoppedRef.current && rawText.trim().length > 8) {
            const parsed = parseCard(rawText);
            const key    = parsed.email ?? parsed.phone ?? "";

            if (hasSignal(parsed) && key) {
              // Dedup against already-collected candidates
              const isDuplicate = candidates.some(
                (c) => (c.parsed.email ?? c.parsed.phone) === key
              );
              if (!isDuplicate) {
                candidates.push({ parsed, rawText, sharpness, ocrConfidence });
              }
            }
          }
        } catch {
          // Swallow — try next frame
        }

        scanningRef.current = false;
        setScanStatus("idle");
        await wait(400);
      }

      // ── Layer 3: pick best candidate & accept ────────────────────────────────
      if (candidates.length > 0) {
        const best = candidates.reduce((a, b) => {
          const scoreA = a.sharpness * 100 + a.ocrConfidence;
          const scoreB = b.sharpness * 100 + b.ocrConfidence;
          return scoreA >= scoreB ? a : b;
        });

        const key = best.parsed.email ?? best.parsed.phone ?? "";
        lastKeyRef.current = key;

        const scanned: ScannedCard = {
          id: crypto.randomUUID(),
          rawText: best.rawText,
          confidence: Math.round(best.ocrConfidence),
          ...best.parsed,
        };

        onScan(scanned);
        setLastCardName(scanned.name);
        setPhase("success");

        // Save to backend (fire-and-forget)
        fetch("/api/scan-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(scanned),
        }).catch(() => {});

        // After 2.5s return to live scanning
        setTimeout(() => {
          lastKeyRef.current = "";
          setLastCardName(null);
          setScanStatus("idle");
          stoppedRef.current = false;
          setPhase("live");
        }, 2500);
      } else {
        // No usable text found yet — restart the loop silently
        await wait(800);
        stoppedRef.current = false;
        loop();
        return;
      }

      scanningRef.current = false;
      setScanStatus("idle");
    };

    loop();

    return () => {
      stoppedRef.current = true;
      scanningRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, workerReady]);

  // ── Manual upload ─────────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!workerRef.current) {
      setOcrError("OCR engine is not ready. Try again or restart the scanner.");
      return;
    }
    const img = new Image();
    img.onload = async () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      setScanStatus("reading");
      try {
        const { data } = await workerRef.current.recognize(dataUrl);
        const rawText = data.text ?? "";
        const ocrConfidence: number = data.confidence ?? 0;
        const card = parseCard(rawText);
        if (hasSignal(card)) {
          const scanned: ScannedCard = { id: crypto.randomUUID(), rawText, confidence: Math.round(ocrConfidence), ...card };
          onScan(scanned);
          setLastCardName(scanned.name);
          setPhase("success");
          fetch("/api/scan-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(scanned),
          }).catch(() => {});
          setTimeout(() => { setPhase("live"); setLastCardName(null); }, 2500);
        }
      } catch { /* ignore */ }
      setScanStatus("idle");
    };
    img.src = URL.createObjectURL(file);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const renderViewport = () => {
    switch (phase) {
      case "preflight":
      case "idle":
        if (ocrError) {
          return (
            <Centered bg>
              <AlertCircle size={32} className="text-amber-400" />
              <p className="font-semibold text-[var(--text-primary)]">OCR unavailable</p>
              <p className="max-w-xs text-sm text-[var(--text-secondary)]">{ocrError}</p>
              <button
                onClick={() => setOcrInitKey((k) => k + 1)}
                className="flex items-center gap-2 rounded-full px-5 py-2 font-semibold text-[var(--accent-on)]"
                style={{ background: "var(--accent)" }}
              >
                <RotateCcw size={15} />
                Retry OCR
              </button>
            </Centered>
          );
        }
        return (
          <Centered>
            {!workerReady
              ? <>
                  <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
                  <Muted>Loading OCR engine…</Muted>
                </>
              : <>
                  <div className="mb-1 flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}>
                    <Camera size={30} className="text-[var(--accent)]" />
                  </div>
                  <p className="font-semibold text-[var(--text-primary)]">Allow camera access</p>
                  <p className="max-w-xs text-sm text-[var(--text-secondary)]">
                    Point your camera at a business card — it reads contact details automatically.
                  </p>
                  <button
                    onClick={handleStartCamera}
                    className="flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-[var(--accent-on)]"
                    style={{ background: "var(--accent)" }}
                  >
                    <Camera size={17} />
                    Enable Camera
                  </button>
                </>
            }
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
            {/* Corner brackets */}
            <div className="absolute inset-6">
              <span className="absolute left-0 top-0 h-8 w-8 border-l-[3px] border-t-[3px] border-white/90" />
              <span className="absolute right-0 top-0 h-8 w-8 border-r-[3px] border-t-[3px] border-white/90" />
              <span className="absolute bottom-0 left-0 h-8 w-8 border-b-[3px] border-l-[3px] border-white/90" />
              <span className="absolute bottom-0 right-0 h-8 w-8 border-b-[3px] border-r-[3px] border-white/90" />
            </div>

            {/* Animated scanline */}
            {scanStatus === "reading" && (
              <div className="absolute inset-x-6" style={{ top: "1.5rem", bottom: "1.5rem", overflow: "hidden" }}>
                <div
                  className="absolute inset-x-0 h-[2px] bg-[var(--accent)]"
                  style={{
                    boxShadow: "0 0 10px 3px var(--accent)",
                    animation: "scanline 1.4s ease-in-out infinite alternate",
                  }}
                />
              </div>
            )}

            {/* Status pill */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm transition-all ${
                scanStatus === "reading"
                  ? "bg-[var(--accent)]/80 text-white"
                  : scanStatus === "focusing"
                    ? "bg-amber-500/60 text-white"
                    : "bg-black/50 text-white/70"
              }`}>
                <ScanLine size={11} />
                {scanStatus === "reading"
                  ? "Reading…"
                  : scanStatus === "focusing"
                    ? "Focusing…"
                    : "Hold card steady"}
              </span>
            </div>
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
              Click the 🔒 lock icon in your address bar → set Camera → Allow → reload.
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

      case "not_readable":
        return (
          <Centered bg>
            <MonitorOff size={32} className="text-orange-400" />
            <p className="font-semibold text-[var(--text-primary)]">Camera in use</p>
            <p className="text-sm text-[var(--text-secondary)]">Close other apps using the camera, then try again.</p>
          </Centered>
        );

      case "insecure":
      case "type_err":
      case "security_err":
        return (
          <Centered bg>
            <WifiOff size={32} className="text-red-400" />
            <p className="font-semibold text-[var(--text-primary)]">Camera not available</p>
            <p className="text-sm text-[var(--text-secondary)]">Requires HTTPS or a modern browser.</p>
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

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-6 py-4">
            <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
              Scan Business Card
            </h3>
            <button onClick={onClose} aria-label="Close scanner"
              className="rounded-md p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
              <X size={20} />
            </button>
          </div>

          {/* Viewport */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                phase === "live" || phase === "success" ? "opacity-100" : "opacity-0"
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />
            {renderViewport()}
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3 p-5">
            {/* Rescan button when in success phase */}
            {phase === "success" && (
              <button
                onClick={() => { setPhase("live"); setLastCardName(null); lastKeyRef.current = ""; }}
                className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <RotateCcw size={15} />
                Scan another
              </button>
            )}

            {/* Upload fallback */}
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-[var(--glass-border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <UploadCloud size={15} />
              Upload image
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

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[var(--text-tertiary)]">{children}</p>;
}
