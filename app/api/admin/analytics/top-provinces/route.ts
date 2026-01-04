import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const base = process.env.NEXT_PUBLIC_API_BASE!;
  const url = new URL(req.url);

  const days = url.searchParams.get("days") || "7";
  const source = url.searchParams.get("source") || "all";

  // Django endpoint bạn đã làm: /api/admin/analytics/top-provinces/
  const upstream = `${base}/api/admin/analytics/top-provinces/?days=${encodeURIComponent(days)}&source=${encodeURIComponent(source)}`;

  const res = await fetch(upstream, {
    method: "GET",
    headers: {
      cookie: req.headers.get("cookie") || "", // ✅ forward cookie để Django biết admin
    },
    cache: "no-store",
  });

  const text = await res.text().catch(() => "");
  return new NextResponse(text || "{}", {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
