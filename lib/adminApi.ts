// import "server-only";
// import { cookies } from "next/headers";

// const BASE = process.env.NEXT_PUBLIC_API_BASE;

// export async function api<T>(path: string, init?: RequestInit): Promise<T> {
//   if (!BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE");

//   const store = await cookies();
//   const access = store.get("access_token")?.value; // ✅ tên cookie của bạn

//   const url = new URL(path, BASE).toString();

//   const res = await fetch(url, {
//     ...init,
//     headers: {
//       ...(init?.headers || {}),
//       ...(access ? { Authorization: `Bearer ${access}` } : {}),
//     },
//     cache: "no-store",
//   });

//   if (!res.ok) {
//     const text = await res.text().catch(() => "");
//     throw new Error(`${res.status} ${res.statusText} - ${url}${text ? ` - ${text}` : ""}`);
//   }
//   return res.json();
// }

import "server-only";
import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_API_BASE;

async function refreshAccessOrThrow() {
  if (!BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE");
  const store = await cookies();
  const refresh = store.get("refresh_token")?.value;
  if (!refresh) throw new Error("Missing refresh_token");

  const r = await fetch(new URL("/api/token/refresh/", BASE).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
  });

  const text = await r.text().catch(() => "");
  if (!r.ok) throw new Error(`Refresh failed: ${r.status} ${text}`);

  const data = JSON.parse(text);
  const access = data?.access;
  if (!access) throw new Error("Refresh response missing access");

  // ✅ set lại cookie access_token trên server
  store.set("access_token", access, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE");

  const store = await cookies();
  const access = store.get("access_token")?.value;

  const url = new URL(path, BASE).toString();

  const doFetch = async () =>
    fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        ...(store.get("access_token")?.value
          ? { Authorization: `Bearer ${store.get("access_token")!.value}` }
          : {}),
      },
      cache: "no-store",
    });

  let res = await doFetch();

  // ✅ access hết hạn -> refresh -> retry 1 lần
  if (res.status === 401) {
    await refreshAccessOrThrow();
    res = await doFetch();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} - ${url}${text ? ` - ${text}` : ""}`);
  }

  return res.json();
}
