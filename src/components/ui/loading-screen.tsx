"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SpaceBackground } from "./space-background";

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fading,  setFading]  = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true),  3800);
    const t2 = setTimeout(() => setVisible(false), 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#000000",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      transition: "opacity 0.7s ease",
      opacity: fading ? 0 : 1,
      pointerEvents: fading ? "none" : "all",
      overflow: "hidden",
    }}>
      {/* Faster gather: higher move speed, same 3s total */}
      <SpaceBackground
        particleCount={450}
        particleColor="rgba(225,29,46,0.92)"
        backgroundColor="transparent"
        moveSpeed={2.8}
      />

      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 20,
      }}>
        <Image
          src="/brand/ADU_Logo.png"
          alt="Abu Dhabi University"
          width={64} height={64}
          priority
          style={{
            objectFit: "contain", width: 64, height: "auto", display: "block",
            filter: "brightness(0) invert(1)",
          }}
        />

        <p style={{
          color: "#ffffff",
          fontSize: 9,
          fontWeight: 400,
          letterSpacing: "0.20em",
          textTransform: "uppercase",
          fontFamily: "'Inter', system-ui, sans-serif",
          margin: 0,
          opacity: 0.75,
        }}>
          Abu Dhabi University
        </p>
      </div>
    </div>
  );
}
