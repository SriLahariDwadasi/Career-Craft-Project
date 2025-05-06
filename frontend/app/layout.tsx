// layout.tsx
"use client";

import { useEffect } from "react";
import "aos/dist/aos.css";
import "./css/style.css";
import { usePathname } from "next/navigation";

import { Inter } from "next/font/google";
import localFont from "next/font/local";

// Load Google Font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Load Local Font
const nacelle = localFont({
  src: [
    { path: "../public/fonts/nacelle-regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/nacelle-italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/nacelle-semibold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/nacelle-semibolditalic.woff2", weight: "600", style: "italic" },
  ],
  variable: "--font-nacelle",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${nacelle.variable}`}>
      <body className="relative bg-black text-white">
        {/* Background image for all pages */}
        <div className="fixed inset-0 -z-10 bg-black">
          <img
            src="/images/background.jpg" // Make sure it's in public/images/
            alt="Background"
            className="w-full h-full object-cover opacity-80"
          />
        </div>
        <div className="absolute inset-0 bg-black/20 z-10" />

        {/* Page Content */}
        <main className="relative z-10 flex flex-col min-h-screen overflow-hidden supports-[overflow:clip]:overflow-clip">
          {children}
        </main>
      </body>
    </html>
  );
}
