// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

import ClickSpark from "@/components/ClickSpark";
import Header from "@/components/Header";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WebGIS Meteorology",
  description: "Vietnam WebGIS using Next.js, Django, Supabase + PostGIS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}>
        <ClickSpark sparkColor="#fff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
          {/* ✅ TOP BAR CHUNG (fixed) */}
          <div className="fixed inset-x-0 z-[5000] top-2 sm:top-4 pointer-events-none">
            <div className="mx-auto w-full max-w-[1200px] px-2 sm:px-4">
              <div className="pointer-events-auto">
                <Header />
              </div>
            </div>
          </div>

          {/* ✅ đẩy nội dung xuống dưới header (responsive + safe area) */}
          <main className="min-h-[100vh] pt-[88px] sm:pt-[100px]">
            {children}
          </main>
        </ClickSpark>
      </body>
    </html>
  );
}
