
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") || 
    pathname.includes(".") ||     
    pathname === "/robots.txt"
  ) {
    return NextResponse.next();
  }

  const PUBLIC_PATHS = ["/", "/home", "/discover/login", "/discover/signin"];
  const isPublicPage = PUBLIC_PATHS.some((p) => pathname === p);
  const accessToken = req.cookies.get("access_token")?.value;

  if (accessToken && (pathname === "/discover/login" || pathname === "/discover/signin")) {
    return NextResponse.redirect(new URL("/discover/overview", req.url));
  }

  if (!accessToken && !isPublicPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/discover/login";
    url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  if (req.method === "GET" && !pathname.startsWith("/api")) {
    const accept = req.headers.get("accept") || "";
    if (accept.includes("text/html")) {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      const logUrl = new URL("/api/_log/access", req.url);

      fetch(logUrl, {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          "x-log-secret": process.env.LOG_SECRET || "" 
        },
        body: JSON.stringify({
          path: pathname,
          ip: ip,
          ua: req.headers.get("user-agent"),
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [

    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

