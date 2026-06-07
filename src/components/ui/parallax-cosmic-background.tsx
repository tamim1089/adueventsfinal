"use client";

import React, { useEffect, useState } from "react";

interface CosmicParallaxBgProps {
  head: string;
  text: string;
  loop?: boolean;
  className?: string;
}

// Cosmic parallax scene (animated starfield + red horizon) recolored to ADU
// black + red. Used as a full-bleed background. Stars: small white, medium red.
const CosmicParallaxBg: React.FC<CosmicParallaxBgProps> = ({ head, text, loop = true, className = "" }) => {
  const [smallStars, setSmallStars] = useState("");
  const [mediumStars, setMediumStars] = useState("");
  const [bigStars, setBigStars] = useState("");

  const textParts = text.split(",").map((p) => p.trim());

  const stars = (count: number, color: string) => {
    const out: string[] = [];
    for (let i = 0; i < count; i++) {
      const x = Math.floor(Math.random() * 2000);
      const y = Math.floor(Math.random() * 2000);
      out.push(`${x}px ${y}px ${color}`);
    }
    return out.join(", ");
  };

  useEffect(() => {
    setSmallStars(stars(700, "#FFFFFF"));
    setMediumStars(stars(200, "#FF2D3F")); // ADU red mid-layer stars
    setBigStars(stars(100, "#FFFFFF"));
    document.documentElement.style.setProperty("--animation-iteration", loop ? "infinite" : "1");
  }, [loop]);

  return (
    <div className={`cosmic-parallax-container ${className}`}>
      <div id="stars" style={{ boxShadow: smallStars }} className="cosmic-stars"></div>
      <div id="stars2" style={{ boxShadow: mediumStars }} className="cosmic-stars-medium"></div>
      <div id="stars3" style={{ boxShadow: bigStars }} className="cosmic-stars-large"></div>

      <div id="horizon">
        <div className="glow"></div>
      </div>
      <div id="earth"></div>

      {head ? <div id="title">{head.toUpperCase()}</div> : null}
      {text ? (
        <div id="subtitle">
          {textParts.map((part, index) => (
            <React.Fragment key={index}>
              <span className={`subtitle-part-${index + 1}`}>{part.toUpperCase()}</span>
              {index < textParts.length - 1 && " "}
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export { CosmicParallaxBg };
