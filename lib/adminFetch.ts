export async function adminFetch(input: RequestInfo, init: RequestInit = {}) {
  const doFetch = () =>
    fetch(input, {
      ...init,
      credentials: "include", 
      headers: { ...(init.headers || {}) },
      cache: "no-store",
    });

  let res = await doFetch();

  if (res.status === 401) {
    const refreshed = await fetch("/api/auth/refresh/", {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });

    if (refreshed.ok) {
      res = await doFetch();
    }
  }

  return res;
}
