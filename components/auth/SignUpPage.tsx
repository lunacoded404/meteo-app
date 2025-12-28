"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);

    if (!API_BASE) {
      setMsg("Thiếu NEXT_PUBLIC_API_BASE trong .env.local");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "").trim();
    const confirm = String(formData.get("confirm") || "").trim();

    if (!username || !email || !password) {
      setMsg("Vui lòng nhập đủ username, email và password.");
      return;
    }
    if (password.length < 6) {
      setMsg("Password tối thiểu 6 ký tự.");
      return;
    }
    if (password !== confirm) {
      setMsg("Confirm password không khớp.");
      return;
    }

    try {
      setLoading(true);

    const res = await fetch(`/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });


      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.detail || "Đăng ký thất bại.");
        return;   
      }

      setMsg("Đăng ký thành công! Chuyển về trang đăng nhập...");
      setTimeout(() => {
        router.push("/discover/login");
      }, 700);
    } catch (err: any) {
      setMsg(err?.message || "Có lỗi khi đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
      <div className="w-[90%] max-w-[800px]">
        <div className="w-full rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur p-6 shadow-xl">
          <h1 className="mb-4 text-xl font-semibold text-sky-300 text-center">
            Sign up
          </h1>

          <form className="w-full flex flex-col gap-4" onSubmit={handleSignUp}>
            <div className="flex flex-col gap-1">
              <label htmlFor="username" className="text-sm text-gray-200">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="yourname..."
                className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm text-gray-200">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
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
                placeholder="min 6 chars..."
                className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                required
              />

              <label className="mt-1 inline-flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-3 w-3 accent-sky-500"
                  checked={showPassword}
                  onChange={() => setShowPassword((p) => !p)}
                />
                Show
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="confirm" className="text-sm text-gray-200">
                Confirm password
              </label>
              <input
                id="confirm"
                name="confirm"
                type={showPassword ? "text" : "password"}
                placeholder="repeat password..."
                className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-sm font-semibold py-2 transition-colors"
            >
              {loading ? "Creating..." : "Create account"}
            </button>

            {msg && <p className="text-xs text-gray-300">{msg}</p>}
          </form>

          <p className="mt-4 text-xs text-gray-400">
            Already have an account?{" "}
            <Link href="/discover/login" className="text-sky-400 hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
