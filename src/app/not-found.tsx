"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FlowButton } from "@/components/ui/flow-button";

const container = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.43, 0.13, 0.23, 0.96] as const, delayChildren: 0.1, staggerChildren: 0.1 },
  },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] as const } },
};
const numberV = {
  hidden: (d: number) => ({ opacity: 0, x: d * 40, y: 15, rotate: d * 5 }),
  visible: { opacity: 0.85, x: 0, y: 0, rotate: 0, transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] as const } },
};
const logoV = {
  hidden: { scale: 0.8, opacity: 0, y: 15 },
  visible: { scale: 1, opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] as const } },
  floating: { y: [-6, 6], transition: { y: { duration: 2.4, ease: "easeInOut" as const, repeat: Infinity, repeatType: "reverse" as const } } },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <motion.div className="text-center" variants={container} initial="hidden" animate="visible">
        <div className="mb-8 flex items-center justify-center gap-4 md:mb-12 md:gap-6">
          <motion.span className="select-none font-display text-[80px] font-bold text-[#111] opacity-80 md:text-[120px]" variants={numberV} custom={-1}>
            4
          </motion.span>
          {/* ADU logo in place of the ghost / the "0" */}
          <motion.div variants={logoV} animate={["visible", "floating"]}>
            <Image
              src="/brand/adu-logo.png"
              alt="Abu Dhabi University"
              width={150}
              height={113}
              priority
              className="h-[80px] w-auto select-none object-contain md:h-[120px]"
              draggable={false}
            />
          </motion.div>
          <motion.span className="select-none font-display text-[80px] font-bold text-[#111] opacity-80 md:text-[120px]" variants={numberV} custom={1}>
            4
          </motion.span>
        </div>

        <motion.h1 className="mb-4 select-none font-display text-3xl font-bold text-[#111] md:mb-6 md:text-5xl" variants={item}>
          This page wandered off campus.
        </motion.h1>
        <motion.p className="mb-8 select-none text-lg text-[var(--text-secondary)] md:mb-12 md:text-xl" variants={item}>
          The page you&apos;re looking for isn&apos;t here. Let&apos;s get you back.
        </motion.p>

        <motion.div variants={item} className="flex justify-center">
          <Link href="/">
            <FlowButton text="Back to events" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
