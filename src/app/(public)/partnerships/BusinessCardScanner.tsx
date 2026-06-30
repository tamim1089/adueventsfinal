"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, Loader2, CheckCircle2, ShieldAlert, Settings } from "lucide-react";
import Tesseract from "tesseract.js";

export type ScannedCard = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  rawText: string;
};

type CamState =
  | "idle"       // not yet requested — show "Allow Camera" button
  | "requesting" // getUserMedia in flight
  | "live"       // stream running
  | "denied"     // hard-blocked by browser (cannot re-prompt)
  | "error";     // device busy / not found / other

export default function BusinessCardScanner({
  onClose,
  onScan,
}: {
  onClose: () => void;
  onScan: (card: ScannedCard) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camState, setCamState] = useState<CamState>("idle");
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /**
   * Check Permissions API first (Chromium-based browsers).
   * Returns: "granted" | "denied" | "prompt" | "unknown"
   * Safari/Firefox don't support camera query — we fall back to "unknown".
   */
  const queryPermission = async (): Promise<"granted" | "denied" | "prompt" | "unknown"> => {
    try {
      const result = await navigator.permissions.query({ name: "camera" as PermissionName });
      return result.state as "granted" | "denied" | "prompt";
    } catch {
      return "unknown";
    }
  };

  /**
   * Called ONLY from a user click — satisfies browser user-gesture requirement.
   * If permission is already "denied", we skip getUserMedia (instant-fail) and
   * show the settings guide instead.
   */
  const handleRequestCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("error");
      setErrorMsg("Camera API not available. Use HTTPS.");
      return;
    }

    setCamState("requesting");

    // Pre-check with Permissions API on supported browsers
    const permState = await queryPermission();
    if (permState === "denied") {
      // Browser will instantly reject getUserMedia — skip calling it
      setCamState("denied");
      return;
    }

    // Permission is "prompt" or "granted" or "unknown" — call getUserMedia.
    // This is inside a click handler, so the browser WILL show the dialog.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamState("live");
    } catch (err: any) {
      // Try any camera as fallback (some devices block rear-cam first)
      try {
        const fallback = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = fallback;
        if (videoRef.current) videoRef.current.srcObject = fallback;
        setCamState("live");
      } catch (fallbackErr: any) {
        console.warn("Camera access failed:", fallbackErr);
        const isDenied =
          fallbackErr?.name === "NotAllowedError" ||
          fallbackErr?.name === "PermissionDeniedError";
        if (isDenied) {
          setCamState("denied");
        } else {
          setCamState("error");
          setErrorMsg(
            fallbackErr?.name === "NotFoundError"
              ? "No camera found on this device."
              : "Could not access camera. Try uploading a photo."
          );
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      if (!canvasRef.current) return;
      setScanning(true);
      setErrorMsg("");

      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);

      processImageData(canvas.toDataURL("image/png"));
    };
    img.src = URL.createObjectURL(file);
  };

  const handleScan = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanning(true);
    setErrorMsg("");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    processImageData(canvas.toDataURL("image/png"));
  };

  const processImageData = async (imageData: string) => {
    try {
      const result = await Tesseract.recognize(imageData, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const text = result.data.text;
      const parsed = parseBusinessCard(text);

      await fetch("/api/scan-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      }).catch(console.error);

      setSuccess(true);
      setTimeout(() => {
        onScan(parsed);
        onClose();
      }, 1000);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to read the card. Please try again.");
      setScanning(false);
    }
  };

  const parseBusinessCard = (text: string): ScannedCard => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const phoneRegex =
      /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?|\+[\d\s-]{8,20}/;

    let email = null;
    let phone = null;
    let name = "Unknown";
    const company = null;
    const title = null;

    for (const line of lines) {
      if (!email && emailRegex.test(line)) {
        email = line.match(emailRegex)?.[0] || null;
      } else if (!phone && phoneRegex.test(line)) {
        phone = line.match(phoneRegex)?.[0] || null;
      }
    }

    const nameLine = lines.find(
      (l) => !emailRegex.test(l) && !phoneRegex.test(l) && l.length > 3
    );
    if (nameLine) name = nameLine;

    return { id: crypto.randomUUID(), name, email, phone, company, title, rawText: text };
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-[var(--r-xl)] bg-[var(--bg-base)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-6 py-4">
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
            Scan Business Card
          </h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>

        {/* Camera / status area */}
        <div className="relative aspect-[4/3] w-full bg-black">
          {/* Video — always rendered so ref is stable */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`h-full w-full object-cover transition-opacity ${
              camState === "live" && !success ? "opacity-100" : "opacity-0"
            }`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* ── IDLE: not yet requested ── */}
          {camState === "idle" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--bg-base)] p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10">
                <Camera size={32} className="text-[var(--accent)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Camera access needed</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Point your camera at a business card to scan its details automatically.
                </p>
              </div>
              <button
                onClick={handleRequestCamera}
                className="flex items-center gap-2 rounded-full px-7 py-3 font-semibold text-[var(--accent-on)] shadow transition-transform hover:scale-105 active:scale-95"
                style={{ background: "var(--accent)" }}
              >
                <Camera size={17} /> Allow Camera Access
              </button>
              <p className="text-xs text-[var(--text-tertiary)]">— or upload a photo below —</p>
            </div>
          )}

          {/* ── REQUESTING: waiting for browser dialog ── */}
          {camState === "requesting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white">
              <Loader2 size={36} className="animate-spin text-[var(--accent)]" />
              <p className="text-sm font-medium">Waiting for camera permission…</p>
              <p className="text-xs text-white/60">Check your browser&apos;s permission dialog</p>
            </div>
          )}

          {/* ── LIVE: guide overlay ── */}
          {camState === "live" && !scanning && !success && (
            <div className="pointer-events-none absolute inset-0 border-[6px] border-black/40">
              <div className="absolute inset-8 rounded-xl border-2 border-dashed border-white/70" />
              <div className="absolute bottom-4 left-0 right-0 text-center text-sm font-medium text-white drop-shadow-md">
                Align card within the frame
              </div>
            </div>
          )}

          {/* ── SCANNING ── */}
          {scanning && !success && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
              <Loader2 size={40} className="animate-spin text-[var(--accent)]" />
              <p className="mt-4 font-medium">Scanning… {progress}%</p>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {success && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <CheckCircle2 size={60} className="mb-2 text-green-500" />
              <p className="font-bold text-white">Card Captured!</p>
            </div>
          )}

          {/* ── DENIED: browser hard-blocked, cannot re-prompt ── */}
          {camState === "denied" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/95 p-6 text-center">
              <ShieldAlert size={36} className="text-amber-400" />
              <p className="font-semibold text-white">Camera blocked by browser</p>
              <p className="max-w-xs text-sm leading-relaxed text-white/70">
                Your browser has denied camera access for this site. To fix it:
              </p>
              <ol className="w-full max-w-xs space-y-1.5 text-left text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">1</span>
                  Click the <strong className="text-white">🔒 lock icon</strong> in your address bar
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">2</span>
                  Find <strong className="text-white">Camera</strong> → set it to <strong className="text-white">Allow</strong>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold">3</span>
                  Reload the page and try again
                </li>
              </ol>
              <div className="mt-1 flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-xs text-white/50">
                <Settings size={13} />
                Or use the upload option below
              </div>
            </div>
          )}

          {/* ── ERROR: other failure ── */}
          {camState === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 p-6 text-center">
              <p className="font-medium text-white">{errorMsg}</p>
              <label className="cursor-pointer rounded-full bg-white px-6 py-2.5 font-bold text-black transition hover:scale-105 active:scale-95">
                Choose Image File
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="p-6">
          {camState === "live" && !errorMsg ? (
            <button
              onClick={handleScan}
              disabled={scanning || success}
              className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-[var(--accent-on)] shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              <Camera size={18} />
              {scanning ? "Processing Image…" : "Capture Card"}
            </button>
          ) : (
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-[var(--accent-on)] shadow-sm transition-transform active:scale-[0.98]" style={{ background: "var(--accent)" }}>
              <Camera size={18} />
              Upload Image Instead
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
