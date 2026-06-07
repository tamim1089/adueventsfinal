import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

// Display serif for headlines (premium/institutional), Inter for everything read.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Al Ain Campus Events — Abu Dhabi University",
    template: "%s · Al Ain Campus Events",
  },
  description:
    "Discover, organize, and document events across Al Ain Campus — colleges, departments, and centers, all in one place.",
};

export const viewport: Viewport = {
  themeColor: "#0a0c16",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
