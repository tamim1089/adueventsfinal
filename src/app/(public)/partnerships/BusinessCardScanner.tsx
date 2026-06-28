"use client";

import { useEffect, useRef, useState } from "react";
import { X, Camera, Loader2, CheckCircle2 } from "lucide-react";
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

export default function BusinessCardScanner({
  onClose,
  onScan,
}: {
  onClose: () => void;
  onScan: (card: ScannedCard) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("Camera access requires HTTPS or localhost.");
      return;
    }

    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err: any) {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream = fallbackStream;
          if (videoRef.current) videoRef.current.srcObject = fallbackStream;
        } catch (fallbackErr) {
          // Use console.warn instead of console.error so Next.js doesn't show a full-screen error overlay in dev mode
          console.warn("Camera fallback also failed:", fallbackErr);
          setErrorMsg("Camera blocked. Please upload a photo instead.");
        }
      }
    };
    
    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

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

  const handleScan = async () => {
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
      
      // We will skip sending to DB for now and just log it if they only wanted it written locally, 
      // wait, the prompt says "puts it into the website and stores it into the db". 
      // I'll create a Route Handler for it.
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
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?|\+[\d\s-]{8,20}/;
    
    let email = null;
    let phone = null;
    let name = "Unknown";
    let company = null;
    let title = null;

    for (const line of lines) {
      if (!email && emailRegex.test(line)) {
        email = line.match(emailRegex)?.[0] || null;
      } else if (!phone && phoneRegex.test(line)) {
        phone = line.match(phoneRegex)?.[0] || null;
      }
    }
    
    const nameLine = lines.find(l => !emailRegex.test(l) && !phoneRegex.test(l) && l.length > 3);
    if (nameLine) name = nameLine;

    return {
      id: crypto.randomUUID(),
      name,
      email,
      phone,
      company,
      title,
      rawText: text
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-[var(--r-xl)] bg-[var(--bg-base)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-6 py-4">
          <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">Scan Business Card</h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
            <X size={20} />
          </button>
        </div>

        <div className="relative aspect-[4/3] w-full bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={`h-full w-full object-cover ${success ? "opacity-30 grayscale" : ""}`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Guide Overlay */}
          {!scanning && !success && !errorMsg && (
            <div className="pointer-events-none absolute inset-0 border-[6px] border-black/40">
              <div className="absolute inset-8 rounded-xl border-2 border-dashed border-white/70" />
              <div className="absolute bottom-4 left-0 right-0 text-center text-sm font-medium text-white drop-shadow-md">
                Align card within the frame
              </div>
            </div>
          )}

          {scanning && !success && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white">
              <Loader2 size={40} className="animate-spin text-[var(--accent)]" />
              <p className="mt-4 font-medium">Scanning... {progress}%</p>
            </div>
          )}

          {success && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--success,green)]">
              <CheckCircle2 size={60} className="mb-2 text-green-500" />
              <p className="font-bold text-white">Card Captured!</p>
            </div>
          )}
          
          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
              <p className="mb-4 font-medium text-white">{errorMsg}</p>
              <label className="cursor-pointer rounded-full bg-white px-6 py-2.5 font-bold text-black transition hover:scale-105 active:scale-95">
                Choose Image File
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </div>

        <div className="p-6">
          {!errorMsg ? (
            <button
              onClick={handleScan}
              disabled={scanning || success}
              className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-[var(--accent-on)] shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              <Camera size={18} />
              {scanning ? "Processing Image..." : "Capture Card"}
            </button>
          ) : (
            <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3.5 font-semibold text-[var(--accent-on)] shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50" style={{ background: "var(--accent)" }}>
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
