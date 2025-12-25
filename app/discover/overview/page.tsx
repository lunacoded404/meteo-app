"use client";

import React, { useState } from "react";
import OverviewFloatingPanel from "@/components/discover/overview/OverviewFloatingPanel";
import CurrentSection from "@/components/discover/overview/CurrentSection";
import HourlySection from "@/components/discover/overview/HourlySection";
import DetailsSection from "@/components/discover/overview/DetailsSection";
import MapsSection from "@/components/discover/overview/MapsSection";
import DaysSection from "@/components/discover/overview/DaysSection";
import TrendsSection from "@/components/discover/overview/TrendsSection";
import RegionSearch, { ProvinceIndexItem} from "@/components/discover/overview/RegionSearch";


function Placeholder({ title }: { title: string }) {
  return (
    <div className="rounded-[28px] bg-white/6 border border-white/10 backdrop-blur-xl p-5 text-white/80">
      {title} ...
    </div>
  );
}

export default function OverviewPage() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const [selectedRegion, setSelectedRegion] = useState<ProvinceIndexItem | null>(null);

  return (
    <div className="relative min-h-screen">
      <div className="h-[108px]" />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0614] via-gray-900 to-black/90" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute top-48 left-10 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-[360px] w-[360px] rounded-full bg-amber-400/10 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-3 md:px-6 pb-10">
        <div className="relative min-h-[calc(100vh-108px)]">
          <OverviewFloatingPanel />

          <main className="relative z-10 md:pl-[220px] py-6 space-y-6">
            <section id="current" className="scroll-mt-28">
              <CurrentSection />
            </section>

            <section id="hourly" className="scroll-mt-28">
              <HourlySection />
            </section>

            <section id="details" className="scroll-mt-28">
              <DetailsSection />
            </section>
            <section id="maps" className="scroll-mt-28">
              <MapsSection />
            </section>
            <section id="monthly" className="scroll-mt-28">
              <DaysSection />
            </section>
            <section id="trends" className="scroll-mt-28">
              <TrendsSection />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
