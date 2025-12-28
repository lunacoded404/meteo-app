"use client";

import { useEffect, useState } from "react";

export function useRainviewerPath() {
  const [path, setPath] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // bạn đang có /api/rainviewer proxy ở Next
        const res = await fetch("/api/rainviewer", { cache: "no-store" });
        if (!res.ok) return;

        const json = await res.json();
        const nowcast = json?.radar?.nowcast;
        const past = json?.radar?.past;

        const frame =
          (Array.isArray(nowcast) && nowcast[0]) ||
          (Array.isArray(past) && past[past.length - 1]) ||
          null;

        if (frame?.path) setPath(String(frame.path));
      } catch (e) {
        console.warn("Rainviewer fetch failed:", e);
      }
    };

    run();
  }, []);

  return path;
}
