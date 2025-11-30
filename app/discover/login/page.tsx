"use client";

import React from "react";
import Link from "next/link";
import Prism from "@/components/Prism";

export default function LoginPage() {
  const [message, setMessage] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();

    if (!username || !password) {
      setMessage("Vui lòng nhập đầy đủ username và password.");
      return;
    }

    // Xử lý login ở đây (call API, Supabase, v.v.)
    console.log("Login with:", { username, password });

    setMessage(`Đã submit với username: ${username}`);
  };

  return (
    <section className="min-h-[calc(100vh-80px)] flex items-start justify-center px-4 pt-6">
      {/* Form rộng bằng CardNav: w-[90%] max-w-[800px] */}
      <Prism />
      <div className="w-[90%] max-w-[800px]">
        <div className="w-full rounded-2xl border border-white/10 bg-gray-900/80 backdrop-blur p-6 shadow-xl">
          <h1 className="mb-4 text-xl font-semibold text-sky-300 text-center">
            Login Page
          </h1>

          <form
            className="w-full flex flex-col gap-4"
            onSubmit={handleSubmit}
          >
            {/* Username */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="username"
                className="text-sm text-gray-200"
              >
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Nhập username"
                className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                required
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="password"
                className="text-sm text-gray-200"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Nhập password"
                className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                required
              />
            </div>

            {/* Button submit */}
            <button
              type="submit"
              className="mt-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-sm font-semibold py-2 transition-colors"
            >
              Đăng nhập
            </button>
          </form>

          {/* Thông báo dưới form */}
          {message && (
            <p className="mt-3 text-xs text-gray-300">
              {message}
            </p>
          )}

          {/* Link sang form Signin */}
          <p className="mt-4 text-xs text-gray-400">
            Chưa có tài khoản?{" "}
            <Link
              href="/discover/signin"
              className="text-sky-400 hover:underline"
            >
              Click here!
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
