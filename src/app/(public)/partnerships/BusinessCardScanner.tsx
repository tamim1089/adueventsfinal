"use client";

import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
// Ollama local vision endpoint
const OLLAMA_ENDPOINT = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = "moondream";

const SYSTEM_PROMPT =
  'You are a business card OCR engine. Look at the image and extract contact info. ' +
  'Respond with ONLY a raw JSON object — no markdown, no code fences, no explanation. ' +
  'Schema: {"name":string|null,"email":string|null,"phone":string|null,"company":string|null,"title":string|null}. ' +
  'If a field is not visible, use null.';

async function callOllama(base64Image: string): Promise<{
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
}> {
  // Strip data URL prefix if present
  const imageData = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

  const res = await fetch(OLLAMA_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      system: SYSTEM_PROMPT,
      prompt: "Extract all contact information from this business card image.",
      images: [imageData],
      stream: false,
      options: { temperature: 0 },
    }),
  });

  if (!res.ok) throw new Error(`Ollama ${res.status}`);

  const data = await res.json();
  const raw: string = data.response ?? "";

  // Strip any accidental markdown code fences
  const cleaned = raw.trim().replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}
import { CameraService } from "@/lib/camera-service";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type ScannedCard = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  rawText: string;
};

/**
 * Every possible UI state. The component is a pure function of this value.
 *
 * Lifecycle (happy path):
 *   preflight → idle → requesting → live → scanning → success
 *
 * Error branches:
 *   preflight → insecure      (rules 5–6)
 *   requesting → denied       (rule 12: NotAllowedError)
 *   requesting → not_found    (rule 12: NotFoundError)
 *   requesting → not_readable (rule 12: NotReadableError)
 *   requesting → security_err (rule 12: SecurityError)
 *   requesting → type_err     (rule 12: TypeError)
 *   requesting → cam_error    (rule 12: any other)
 *   scanning   → ocr_error
 */
type Phase =
  | "preflight"    // checking secure context + querying Permissions API
  | "idle"         // permission is "prompt" or "granted" — show Allow button
  | "requesting"   // getUserMedia in-flight (ONLY reachable via button click)
  | "live"         // stream active — show viewfinder
  | "denied"       // browser hard-blocked (NotAllowedError or state "denied")
  | "not_found"    // NotFoundError — no camera device
  | "not_readable" // NotReadableError — camera already in use
  | "security_err" // SecurityError — permissions policy blocked
  | "type_err"     // TypeError — mediaDevices API missing
  | "cam_error"    // any other getUserMedia failure
  | "insecure"     // rules 5–6: !isSecureContext or !getUserMedia
  | "scanning"     // Tesseract OCR running
  | "ocr_error"    // OCR failed
  | "success";     // card captured ✓

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rules 5–6: Verify secure context and API availability before anything else.
 * Returns an error phase string, or null if environment is safe.
 */
function checkEnvironment(): "insecure" | "type_err" | null {
  // Rule 5
  if (typeof window !== "undefined" && !window.isSecureContext) return "insecure";
  // Rule 6
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== "function"
  ) {
    return "type_err";
  }
  return null;
}

/**
 * Rule 3: Query permission state without touching getUserMedia.
 * Returns the PermissionStatus object so the caller can attach
 * a "change" listener, or null if the Permissions API is unsupported.
 */
async function queryCameraPermission(): Promise<PermissionStatus | null> {
  try {
    return await navigator.permissions.query({ name: "camera" as PermissionName });
  } catch {
    // Firefox / older Safari do not support querying "camera"
    return null;
  }
}

/**
 * Rule 12: Map a DOMException from getUserMedia to a Phase.
 */
function classifyError(err: unknown): Phase {
  if (!(err instanceof DOMException) && !(err instanceof TypeError)) {
    return "cam_error";
  }
  if (err instanceof TypeError) return "type_err";

  switch (err.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "not_found";
    case "NotReadableError":
    case "TrackStartError":
      return "not_readable";
    case "SecurityError":
      return "security_err";
    default:
      return "cam_error";
  }
}

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const permStatusRef = useRef<PermissionStatus | null>(null);
  const autoScanRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scanningRef = useRef(false); // prevent overlapping OCR calls

  const [phase, setPhase] = useState<Phase>("preflight");
  const [lastCardName, setLastCardName] = useState<string | null>(null); // for flash feedback

  // ── On mount: run pre-flight checks (rules 3, 5, 6) ─────────────────────
  // getUserMedia is NEVER called here — only environment + permission checks.
  useEffect(() => {
    let cancelled = false;

    const runPreflight = async () => {
      // ── Rules 5–6: secure context + API availability ──────────────────────
      const envError = checkEnvironment();
      if (envError) {
        if (!cancelled) setPhase(envError);
        return;
      }

      // ── Rule 9: reuse existing live stream — no new request needed ─────────
      const liveStream = CameraService.getLiveStream();
      if (liveStream && videoRef.current) {
        videoRef.current.srcObject = liveStream;
        if (!cancelled) setPhase("live");
        return;
      }

      // ── Rule 3: query permission state ─────────────────────────────────────
      const permStatus = await queryCameraPermission();
      permStatusRef.current = permStatus;

      if (!cancelled) {
        if (permStatus === null) {
          // Permissions API unsupported — default to idle (treat as "prompt")
          setPhase("idle");
        } else {
          // Rule 4: handle the three states
          applyPermissionState(permStatus.state);

          // Live-watch: if user unblocks from browser settings while modal is open,
          // automatically recover without closing/reopening the modal.
          permStatus.addEventListener("change", () => {
            if (!cancelled) applyPermissionState(permStatus.state);
          });
        }
      }
    };

    runPreflight();

    return () => {
      cancelled = true;
      permStatusRef.current?.removeEventListener("change", () => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-scan loop: fires every 2.5 s while live ──────────────────────────
  useEffect(() => {
    if (phase !== "live") {
      if (autoScanRef.current) clearTimeout(autoScanRef.current);
      return;
    }

    const scheduleNext = () => {
      autoScanRef.current = setTimeout(async () => {
        if (scanningRef.current) { scheduleNext(); return; }
        if (!videoRef.current || !canvasRef.current) { scheduleNext(); return; }
        const video = videoRef.current;
        if (video.readyState < 2) { scheduleNext(); return; }

        scanningRef.current = true;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          await runOCR(canvas.toDataURL("image/jpeg", 0.85), true); // silent: never flickers
        }
        scanningRef.current = false;
      }, 2500);
    };

    scheduleNext();

    return () => {
      if (autoScanRef.current) clearTimeout(autoScanRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  /**
   * Rule 4: translate PermissionState → Phase.
   * "denied"  → show blocked UI, STOP (rule 4 / rule 13).
   * "prompt"  → show Allow button (user must click to proceed).
   * "granted" → show Allow button (camera can start on first click).
   */
  const applyPermissionState = (state: PermissionStatus["state"]) => {
    setPhase(state === "denied" ? "denied" : "idle");
  };

  // ── Camera start — ONLY called from a direct button click (rules 1–2) ────
  const handleStartCamera = async () => {
    // Safety guard: bail if somehow called when denied
    if (phase === "denied") return;

    // ── Re-check permission state right before calling getUserMedia (rule 3) ──
    if (permStatusRef.current?.state === "denied") {
      setPhase("denied");
      return; // Rule 4 / Rule 13: NEVER call getUserMedia when denied
    }

    // ── Rule 9: skip getUserMedia if stream is already live ───────────────────
    const liveStream = CameraService.getLiveStream();
    if (liveStream && videoRef.current) {
      videoRef.current.srcObject = liveStream;
      setPhase("live");
      return;
    }

    // ── Rules 1–2: getUserMedia called ONLY here, from the click handler ──────
    setPhase("requesting");

    try {
      // Rules 2, 7 (via CameraService.setStream), 8, 10
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // prefer rear camera
      });

      // Rule 7 + 8: stop old tracks, store new stream
      CameraService.setStream(stream);

      // Rule 10: attach stream to video element, transition to live
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPhase("live");
    } catch (err) {
      console.warn("[BusinessCardScanner] getUserMedia failed:", err);

      const errorPhase = classifyError(err);

      // If the environment camera constraint failed, try without it (non-permission errors only)
      if (errorPhase !== "denied" && errorPhase !== "security_err" && errorPhase !== "type_err") {
        try {
          const fallback = await navigator.mediaDevices.getUserMedia({ video: true });
          CameraService.setStream(fallback);
          if (videoRef.current) videoRef.current.srcObject = fallback;
          setPhase("live");
          return;
        } catch (fallbackErr) {
          console.warn("[BusinessCardScanner] fallback also failed:", fallbackErr);
          setPhase(classifyError(fallbackErr));
          return;
        }
      }

      setPhase(errorPhase);
    }
  };

  // ── Manual capture (still available as fallback) ─────────────────────────
  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || scanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    scanningRef.current = true;
    runOCR(canvas.toDataURL("image/jpeg", 0.85)).finally(() => { scanningRef.current = false; });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      scanningRef.current = true;
      runOCR(canvas.toDataURL("image/jpeg", 0.85)).finally(() => { scanningRef.current = false; });
    };
    img.src = URL.createObjectURL(file);
  };

  /**
   * Vision pipeline — calls local Ollama moondream model.
   *
   * silent=true  → auto-scan: NEVER changes phase. Camera stays live the whole
   *                time. Fires onScan only when model returns meaningful data.
   *
   * silent=false → user pressed "Snap Now": shows scanning spinner.
   */
  const runOCR = async (imageData: string, silent = false): Promise<void> => {
    if (!silent) setPhase("scanning");

    try {
      const result = await callOllama(imageData);

      // Model returned nothing useful — all fields null
      const hasContent = result.name || result.email || result.phone || result.company;
      if (!hasContent) {
        if (!silent) setPhase("live");
        return;
      }

      const card: ScannedCard = {
        id: crypto.randomUUID(),
        name: result.name ?? "Unknown",
        email: result.email ?? null,
        phone: result.phone ?? null,
        company: result.company ?? null,
        title: result.title ?? null,
        rawText: JSON.stringify(result),
      };

      // Fire immediately — card appears on page straight away
      onScan(card);
      setLastCardName(card.name);

      // Save to backend (fire-and-forget)
      fetch("/api/scan-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(card),
      }).catch(console.error);

      // Flash success 1.5 s then back to live — ready to scan another
      setPhase("success");
      setTimeout(() => {
        setPhase("live");
        setLastCardName(null);
      }, 1500);

    } catch {
      if (!silent) {
        setPhase("ocr_error");
        setTimeout(() => setPhase("live"), 2000);
      }
      // Silent: swallow — camera stays on
    }
  };

  const parseCard = (text: string): ScannedCard => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const emailRx = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/;
    const phoneRx = /(?:\+|00)[\d\s().-]{7,20}|\b\d{3}[\s.-]\d{3}[\s.-]\d{4}\b|\b\d{7,12}\b/;
    const titleKw = /\b(ceo|coo|cto|cfo|director|manager|engineer|consultant|specialist|coordinator|president|officer|head|vp|vice|lead|senior|analyst|advisor|professor|dr\.|phd)\b/i;
    const companyKw = /\b(llc|ltd|inc|corp|co\.|group|holdings|university|institute|authority|ministry|department|academy|school|company|solutions|services|technologies)\b/i;

    let email: string | null = null;
    let phone: string | null = null;
    let title: string | null = null;
    let company: string | null = null;

    for (const line of lines) {
      if (!email && emailRx.test(line)) { email = line.match(emailRx)?.[0] ?? null; continue; }
      if (!phone && phoneRx.test(line)) { phone = line.match(phoneRx)?.[0]?.trim() ?? null; continue; }
      if (!title && titleKw.test(line) && line.length < 80) { title = line; continue; }
      if (!company && companyKw.test(line) && line.length < 80) { company = line; continue; }
    }

    // Name heuristic: first line that isn't email/phone/title/company and looks like a name
    const nameRx = /^[A-Z][a-z]+(\s[A-Z][a-z]+){0,3}$/;
    const name =
      lines.find((l) =>
        !emailRx.test(l) &&
        !phoneRx.test(l) &&
        !titleKw.test(l) &&
        !companyKw.test(l) &&
        (nameRx.test(l) || l.split(" ").length <= 4) &&
        l.length > 2 &&
        l.length < 50
      ) ?? lines[0] ?? "Unknown";

    return { id: crypto.randomUUID(), name, email, phone, company, title, rawText: text };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  /** Content rendered inside the camera viewport area */
  const renderViewport = () => {
    switch (phase) {
      // ── Checking environment + permissions ──────────────────────────────
      case "preflight":
        return (
          <Centered>
            <Loader2 size={28} className="animate-spin text-[var(--accent)]" />
            <Muted>Checking camera access…</Muted>
          </Centered>
        );

      // ── Ready: show Enable Camera button ────────────────────────────────
      case "idle":
        return (
          <Centered>
            <div
              className="mb-1 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "color-mix(in srgb, var(--accent) 12%, transparent)" }}
            >
              <Camera size={30} className="text-[var(--accent)]" />
            </div>
            <Title>Allow camera access</Title>
            <Body>
              Point your camera at a business card — we&apos;ll read the
              contact details automatically.
            </Body>
            {/* ── Rules 1–2: ONLY trigger getUserMedia from this click ── */}
            <PrimaryBtn onClick={handleStartCamera}>
              <Camera size={17} />
              Enable Camera
            </PrimaryBtn>
            <Muted>Your browser will prompt once.</Muted>
          </Centered>
        );

      // ── getUserMedia in-flight ───────────────────────────────────────────
      case "requesting":
        return (
          <Centered dark>
            <Loader2 size={36} className="animate-spin text-[var(--accent)]" />
            <WhiteText>Requesting camera access…</WhiteText>
            <Muted light>Check the browser prompt above ↑</Muted>
          </Centered>
        );

      // ── Viewfinder overlay when live ─────────────────────────────────────
      case "live":
        return (
          <div className="pointer-events-none absolute inset-0 border-[6px] border-black/40">
            {/* Corner brackets */}
            <div className="absolute inset-8">
              <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-white" />
              <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-white" />
              <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-white" />
              <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-white" />
            </div>
            <p className="absolute bottom-4 left-0 right-0 text-center text-xs font-semibold tracking-widest uppercase text-white/80 drop-shadow-md">
              Auto-detecting · Hold card steady
            </p>
          </div>
        );

      // ── AI reading card ───────────────────────────────────────────────────
      case "scanning":
        return (
          <Centered dark>
            <Loader2 size={40} className="animate-spin text-[var(--accent)]" />
            <WhiteText>AI reading card…</WhiteText>
            <Muted light>moondream is processing</Muted>
          </Centered>
        );

      // ── Done ─────────────────────────────────────────────────────────────
      case "success":
        return (
          <Centered dark>
            <CheckCircle2 size={56} className="text-green-400" />
            <WhiteText>Card captured!</WhiteText>
            {lastCardName && lastCardName !== "Unknown" && (
              <p className="text-sm text-white/70">{lastCardName}</p>
            )}
            <p className="text-xs text-white/50">Added to Scanned Cards ↓</p>
          </Centered>
        );

      // ── Rule 4 + 15: permission denied — NO retry, show fix guide ────────
      case "denied":
        return (
          <Centered bg>
            <ShieldAlert size={32} className="text-amber-400" />
            <Title>Camera is blocked</Title>
            <Body>
              Enable it from your browser settings (lock icon in the address
              bar).
            </Body>
            <StepList
              steps={[
                <>Click the <strong className="text-[var(--text-primary)]">🔒 lock</strong> icon in your address bar</>,
                <>Set <strong className="text-[var(--text-primary)]">Camera</strong> → <strong className="text-[var(--text-primary)]">Allow</strong></>,
                <>Reload the page and try again</>,
              ]}
              accent="amber"
            />
          </Centered>
        );

      // ── No camera device ─────────────────────────────────────────────────
      case "not_found":
        return (
          <Centered bg>
            <VideoOff size={32} className="text-[var(--text-tertiary)]" />
            <Title>No camera detected</Title>
            <Body>This device has no accessible camera. Upload a photo instead.</Body>
          </Centered>
        );

      // ── Camera in use by another app ─────────────────────────────────────
      case "not_readable":
        return (
          <Centered bg>
            <MonitorOff size={32} className="text-orange-400" />
            <Title>Camera in use</Title>
            <Body>
              Another app is using your camera. Close it and try again, or
              upload a photo.
            </Body>
          </Centered>
        );

      // ── SecurityError ────────────────────────────────────────────────────
      case "security_err":
        return (
          <Centered bg>
            <ShieldAlert size={32} className="text-red-400" />
            <Title>Blocked by permissions policy</Title>
            <Body>
              Your browser&apos;s permissions policy is blocking camera access.
              Contact the site admin or upload a photo.
            </Body>
          </Centered>
        );

      // ── Rules 5–6: insecure origin / missing API ──────────────────────────
      case "insecure":
        return (
          <Centered bg>
            <WifiOff size={32} className="text-red-400" />
            <Title>Insecure origin</Title>
            <Body>
              Camera not supported or insecure origin. This feature requires
              HTTPS.
            </Body>
          </Centered>
        );

      // ── TypeError (missing API) ───────────────────────────────────────────
      case "type_err":
        return (
          <Centered bg>
            <WifiOff size={32} className="text-red-400" />
            <Title>Camera not supported</Title>
            <Body>
              Camera not supported or insecure origin. Try a modern browser
              over HTTPS.
            </Body>
          </Centered>
        );

      // ── Generic camera failure ────────────────────────────────────────────
      case "cam_error":
        return (
          <Centered bg>
            <VideoOff size={32} className="text-[var(--text-tertiary)]" />
            <Title>Camera unavailable</Title>
            <Body>Could not start the camera. Upload a photo instead.</Body>
          </Centered>
        );

      // ── OCR failure ───────────────────────────────────────────────────────
      case "ocr_error":
        return (
          <Centered bg>
            <VideoOff size={32} className="text-[var(--text-tertiary)]" />
            <Title>Couldn&apos;t read the card</Title>
            <Body>OCR failed. Try again or upload a clearer photo.</Body>
          </Centered>
        );

      default:
        return null;
    }
  };

  /** Bottom action bar */
  const renderActionBar = () => {
    if (phase === "live") {
      return (
        <div className="flex flex-col items-center gap-3 w-full">
          <PrimaryBtn onClick={handleCapture} full>
            <Camera size={18} />
            Snap Now
          </PrimaryBtn>
          <p className="text-xs text-[var(--text-tertiary)]">
            Or hold the card still — auto-detects every 2.5 s
          </p>
        </div>
      );
    }

    // All other phases: upload fallback
    return (
      <label
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-[var(--accent-on)] shadow-sm transition-transform active:scale-[0.98]"
        style={{ background: "var(--accent)" }}
      >
        <UploadCloud size={18} />
        Upload Image Instead
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileUpload}
        />
      </label>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-[var(--r-xl)] bg-[var(--bg-base)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-6 py-4">
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">
            Scan Business Card
          </h3>
          <button
            onClick={onClose}
            aria-label="Close scanner"
            className="rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
          {/* Video element always in DOM so ref is stable for srcObject (rule 10) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              phase === "live" || phase === "scanning" || phase === "success"
                ? "opacity-100"
                : "opacity-0"
            }`}
          />
          <canvas ref={canvasRef} className="hidden" />
          {renderViewport()}
        </div>

        {/* Action bar */}
        <div className="p-6">{renderActionBar()}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small layout primitives (avoid repeating long className strings)
// ─────────────────────────────────────────────────────────────────────────────

function Centered({
  children,
  dark,
  bg,
}: {
  children: React.ReactNode;
  dark?: boolean;
  bg?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center ${
        dark ? "bg-black/80" : bg ? "bg-[var(--bg-base)]" : "bg-[var(--bg-base)]"
      }`}
    >
      {children}
    </div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <p className="font-semibold text-[var(--text-primary)]">{children}</p>;
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-xs text-sm leading-relaxed text-[var(--text-secondary)]">
      {children}
    </p>
  );
}

function Muted({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`text-xs ${light ? "text-white/50" : "text-[var(--text-tertiary)]"}`}>
      {children}
    </p>
  );
}

function WhiteText({ children }: { children: React.ReactNode }) {
  return <p className="font-medium text-white">{children}</p>;
}

function PrimaryBtn({
  children,
  onClick,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-full px-7 py-3 font-semibold text-[var(--accent-on)] shadow-md transition-transform hover:scale-105 active:scale-95 ${
        full ? "w-full" : ""
      }`}
      style={{ background: "var(--accent)" }}
    >
      {children}
    </button>
  );
}

function StepList({
  steps,
  accent,
}: {
  steps: React.ReactNode[];
  accent?: "amber" | "blue";
}) {
  const accentClass =
    accent === "amber"
      ? "bg-amber-400/15 text-amber-400"
      : "bg-[var(--accent)]/15 text-[var(--accent)]";

  return (
    <ol className="w-full max-w-xs space-y-2 text-left text-sm text-[var(--text-secondary)]">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-2">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${accentClass}`}
          >
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}
