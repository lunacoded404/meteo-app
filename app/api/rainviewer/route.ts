import { NextResponse } from "next/server";

export const runtime = "nodejs"; // tránh edge fetch bị giới hạn

const RAINVIEWER_API = "https://api.rainviewer.com/public/weather-maps.json";

export async function GET() {
  try {
    const res = await fetch(RAINVIEWER_API, {
      // cache nhẹ cho đỡ spam
      next: { revalidate: 60 },
      headers: {
        "User-Agent": "meteo-app/1.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: res.status },
        { status: 502 }
      );
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "fetch_failed" },
      { status: 500 }
    );
  }
}
