"use client";

import { useEffect, useState } from "react";
import type { CurrentWeather } from "./current.types";
import { fetchCurrentWeather } from "./current.api";

export function useCurrentWeather(args: { apiBase: string; regionCode?: string | null }) {
  const { apiBase, regionCode } = args;

  const [data, setData] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!regionCode) return;

    const ctrl = new AbortController();
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const d = await fetchCurrentWeather({
          apiBase,
          regionCode,
          signal: ctrl.signal,
        });
        setData(d);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErr(e?.message || "Fetch failed");
        setData(null);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [apiBase, regionCode]);

  return { data, loading, err };
}
