"use client";

import { useEffect, useRef, useState } from "react";

// Full-bleed background video. Content is a SIBLING drawn on top (never blurred).
// Honors Reduce Motion + Save-Data: shows the poster still instead of playing.
// A dark gradient scrim guarantees text contrast over any frame (worst-case AA).
export default function VideoBackground() {
  const ref = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData =
      (navigator as Navigator & { connection?: { saveData?: boolean } })
        .connection?.saveData ?? false;
    if (reduce || saveData) {
      setStill(true);
      return;
    }
    // Autoplay can still be blocked; fall back to the poster gracefully.
    ref.current?.play().catch(() => setStill(true));
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-bg">
      {!still && (
        <video
          ref={ref}
          className="h-full w-full object-cover"
          poster="/media/hero-poster.jpg"
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        >
          <source src="/media/hero.webm" type="video/webm" />
          <source src="/media/hero.mp4" type="video/mp4" />
        </video>
      )}
      {still && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/media/hero-poster.jpg"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
      )}
      {/* contrast scrim — owns legibility so text never depends on the frame */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0c16]/55 via-[#0a0c16]/35 to-[#0a0c16]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c16]/70 to-transparent" />
    </div>
  );
}
