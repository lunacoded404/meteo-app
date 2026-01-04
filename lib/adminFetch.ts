export async function adminFetch(input: RequestInfo | URL, init?: RequestInit) {
  const doFetch = () =>
    fetch(input, {
      ...init,
      cache: "no-store",
      credentials: "include",
      headers: {
        ...(init?.headers || {}),
      },
    });

  let res = await doFetch();

  // ✅ nếu token hết hạn -> refresh -> retry 1 lần
  if (res.status === 401) {
    const cloned = res.clone();
    const data = await cloned.json().catch(() => null);

    if (data?.code === "token_not_valid") {
      const r = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (r.ok) {
        res = await doFetch();
      }
    }
  }

  return res;
}
