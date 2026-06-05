"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk");
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-2xl font-extrabold text-yellow-400">
            S
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-zinc-900">
              Santa<span className="text-yellow-500">Maria</span>
            </h1>
            <p className="text-sm text-zinc-500">Masuk ke dasbor toko Anda</p>
          </div>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@santamaria.id"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <p className="pt-2 text-center text-xs text-zinc-400">
            Demo: admin@santamaria.id / password123
          </p>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <LoginForm />
    </Suspense>
  );
}
