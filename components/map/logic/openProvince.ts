"use client";

export async function fetchJsonSafe<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (res.status === 204) throw new Error("No content (204)");
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Response is not valid JSON");
  }
}
