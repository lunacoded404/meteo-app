// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// const PUBLIC_PATHS = ["/home", "/discover/login", "/discover/signin", "/"];

// function isPublic(pathname: string) {
//   return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
// }

// export function middleware(req: NextRequest) {
//   const { pathname, search } = req.nextUrl;

//   // ✅ bỏ qua next internals / assets / api để login hoạt động
//   if (
//     pathname.startsWith("/_next") ||
//     pathname.startsWith("/favicon") ||
//     pathname === "/robots.txt" ||
//     pathname.startsWith("/sitemap") ||
//     pathname.startsWith("/api")
//   ) {
//     return NextResponse.next();
//   }

//   // ✅ public routes
//   if (isPublic(pathname)) return NextResponse.next();

//   // ✅ các trang còn lại: bắt buộc có access_token
//   const access = req.cookies.get("access_token")?.value;

//   if (!access) {
//     const url = req.nextUrl.clone();
//     url.pathname = "/discover/login";
//     url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
//     return NextResponse.redirect(url);
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
// };


import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/home", "/discover/login", "/discover/signin", "/"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ✅ bỏ qua next internals / assets / api để login + api hoạt động
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // ✅ public routes
  if (isPublic(pathname)) return NextResponse.next();

  // ✅ các trang còn lại: bắt buộc có access_token
  const access = req.cookies.get("access_token")?.value;

  if (!access) {
    const url = req.nextUrl.clone();
    url.pathname = "/discover/login";
    url.search = `?next=${encodeURIComponent(pathname + (search || ""))}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
