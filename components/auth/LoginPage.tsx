"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const nextUrl = useMemo(() => sp.get("next") ?? "/discover/overview", [sp]);

  const [message, setMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const nextRaw = sp.get("next") || "/discover/overview";
  const nextPath = nextRaw.startsWith("/") ? nextRaw : "/discover/overview";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!username || !password) {
      setMessage("Vui lòng nhập đầy đủ username và password.");
      return;
    }

    try {
      setLoading(true);

    // const res = await fetch(`/api/auth/login`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ username, password }),
    // });

    const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });



      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.detail || "Đăng nhập thất bại.");
        return;
      }
    router.push(nextPath);
    router.refresh();

    } catch (err: any) {
      setMessage(err?.message || "Có lỗi khi đăng nhập.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
      <div className="w-[90%] max-w-[800px]">
        <div className="w-full rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur p-6 shadow-xl">
          <h1 className="mb-4 text-xl font-semibold text-sky-300 text-center">Login Page</h1>

          <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label htmlFor="username" className="text-sm text-gray-200">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Nhập username của bạn..."
                className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="password" className="text-sm text-gray-200">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập password của bạn..."
                className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                required
              />

              <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-3 w-3 accent-sky-500"
                  checked={showPassword}
                  onChange={() => setShowPassword((prev) => !prev)}
                />
                Hiện
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-sm font-semibold py-2 transition-colors"
            >
              {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
            </button>
          </form>

          {message && <p className="mt-3 text-xs text-gray-300">{message}</p>}

          <p className="mt-4 text-xs text-gray-400">
            Bạn chưa có tài khoản?{" "}
            <Link href="/discover/signin" className="text-sky-400 hover:underline">
              Click vào đây!
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
