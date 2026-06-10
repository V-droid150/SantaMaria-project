"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Password minimal 8 karakter");
    if (password !== confirm) return setError("Konfirmasi password tidak sama");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengatur ulang password");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <AuthShell title="Tautan tidak valid" subtitle="Token reset tidak ditemukan.">
        <Link
          href="/forgot-password"
          className="inline-block rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-yellow-300"
        >
          Minta tautan baru
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Berhasil!" subtitle="Password kamu sudah diperbarui.">
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <p className="text-sm text-zinc-600">Mengarahkan ke halaman masuk...</p>
          <Link href="/login" className="font-semibold text-zinc-900 hover:underline">
            Masuk sekarang
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Atur Password Baru" subtitle="Masukkan password baru untuk akunmu.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">
            Password Baru
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="confirm" className="text-sm font-medium text-zinc-700">
            Konfirmasi Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Menyimpan..." : "Simpan Password"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <ResetForm />
    </Suspense>
  );
}
