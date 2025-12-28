import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

import ClickSpark from "@/components/ClickSpark";
import Header from "@/components/Header";
import AccountMenu from "@/components/auth/AccountMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WebGIS Meteorology",
  description: "Vietnam WebGIS using Next.js, Django, Supabase + PostGIS",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white`}>
        <ClickSpark sparkColor="#fff" sparkSize={10} sparkRadius={15} sparkCount={8} duration={400}>
          {/* ✅ TOP BAR CHUNG */}
          <div className="fixed top-4 left-0 right-0 z-50">
            <div className="relative mx-auto w-full max-w-[1200px] px-4">
              {/* Header ở giữa, đúng kích thước cũ */}
              <div className="flex justify-center">
                <div className="w-full max-w-[800px]">
                  <Header />
                </div>
              </div>
            </div>
          </div>

          {/* ✅ đẩy nội dung xuống dưới header */}
          <main className="min-h-[100vh] pt-[100px]">{children}</main>
        </ClickSpark>
      </body>
    </html>
  );
}
