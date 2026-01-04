// src/lib/track.ts
export type TrackPayload = {
  province_code: string;
  province_name?: string;
  source: "map" | "search";
  meta?: Record<string, any>;
};

export async function trackRegion(payload: TrackPayload) {
  try {
    await fetch("/api/track/region", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      keepalive: true,
    });
  } catch {
    // bỏ qua lỗi tracking
  }
}
