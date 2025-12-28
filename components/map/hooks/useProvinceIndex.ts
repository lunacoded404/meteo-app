"use client";

import { useEffect, useMemo, useState } from "react";

export type ProvinceIndexApiItem = {
  id: number;
  code: string;
  name: string;
  centroid: { lat: number; lon: number };
};

export type ProvinceIndexItemLite = { code: string; name: string };

export function useProvinceIndex(API_BASE: string) {
  const [items, setItems] = useState<ProvinceIndexApiItem[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL("/api/province-index/", API_BASE).toString();
        const res = await fetch(url, { cache: "force-cache" });
        if (!res.ok) throw new Error(`Failed province_index: ${res.status}`);
        const data = await res.json();

        const raw = (data?.items ?? []) as any[];

        const cleaned: ProvinceIndexApiItem[] = raw
          .filter((x) => x?.code && x?.name && x?.centroid?.lat != null && x?.centroid?.lon != null)
          .map((x) => ({
            id: Number(x?.id ?? 0),
            code: String(x.code),
            name: String(x.name),
            centroid: { lat: Number(x.centroid.lat), lon: Number(x.centroid.lon) },
          }));

        setItems(cleaned);
      } catch (e) {
        console.error("Error loading province_index:", e);
      }
    };
    run();
  }, [API_BASE]);

  const lite: ProvinceIndexItemLite[] = useMemo(() => {
    return items
      .map((p) => ({ code: p.code, name: p.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  return { items, lite };
}
