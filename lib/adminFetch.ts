// src/lib/adminFetch.ts
async function tryRefresh() {
  const r = await fetch("/api/auth/refresh", {
    method: "POST",
    cache: "no-store",
    credentials: "include",
  });
  return r.ok;
}

export async function adminFetch(input: string, init: RequestInit = {}) {
  const first = await fetch(input, {
    ...init,
    cache: "no-store",
    credentials: "include",
  });

  if (first.status !== 401) return first;

  // ✅ thử refresh
  const ok = await tryRefresh();
  if (!ok) return first;

  // ✅ retry request sau refresh
  return fetch(input, {
    ...init,
    cache: "no-store",
    credentials: "include",
  });
}
