import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import MotionProvider from "@/components/MotionProvider";
import { LoadingScreen } from "@/components/ui/loading-screen";

// Serif display face — optical-sizing, editorial, "expensive". The single
// biggest lever away from a generic sans-only look. Variable font → full
// weight range available, no explicit weights needed.
const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Monospace for eyebrows / metadata — the "curated dossier" register.
const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ADU Events — Abu Dhabi University",
    template: "%s · ADU Events",
  },
  description:
    "Discover, organize, and document events across ADU — colleges, departments, and centers, all in one place.",
};

export const viewport: Viewport = {
  themeColor: "#faf8f4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LoadingScreen />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
