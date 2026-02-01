

// proxy.ts (root)
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

const PUBLIC_PATHS = ["/home", "/discover/login", "/discover/signin", "/"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function shouldSkip(pathname: string) {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/api") || // ✅ tránh vòng lặp, tránh spam log
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".map") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".pbf")
  );
}

// ✅ Next 16: proxy.ts export default function proxy(...) hoặc export function proxy(...)
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  const { pathname, searchParams } = req.nextUrl;

  if (shouldSkip(pathname)) return NextResponse.next();

  // ✅ log page view (best-effort)
  if (req.method === "GET") {
    const accept = req.headers.get("accept") || "";
    if (accept.includes("text/html")) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        null;

      const ua = req.headers.get("user-agent") ?? null;

      const payload = {
        path: pathname,
        region_code: searchParams.get("region"),
        layer_key: searchParams.get("layer"),
        ip,
        ua,
      };

      const logUrl = new URL("/api/_log/access", req.url);

      event.waitUntil(
        fetch(logUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-log-secret": process.env.LOG_SECRET || "",
          },
          body: JSON.stringify(payload),
        }).catch(() => {})
      );
    }
  }

  // ✅ public routes
  if (isPublic(pathname)) return NextResponse.next();

  // ✅ private routes: yêu cầu access_token
  const access = req.cookies.get("access_token")?.value;
  if (!access) {
    const url = req.nextUrl.clone();
    url.pathname = "/discover/login";
    url.search = `?next=${encodeURIComponent(pathname + (req.nextUrl.search || ""))}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /* Loại trừ các đường dẫn sau khỏi Middleware */
    '/((?!api|_next/static|_next/image|favicon.ico|login|signin).*)',
  ],
};
