"use client";

import { MotionConfig } from "framer-motion";

// Makes ALL framer-motion animations respect the user's OS "Reduce Motion"
// setting — transforms become instant. Pairs with the CSS reduced-motion
// rules so the two animation systems agree.
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
