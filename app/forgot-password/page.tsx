"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true); // selalu sukses generik (tak bocorkan keberadaan akun)
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Lupa Password" subtitle="Masukkan email akunmu untuk menerima tautan reset.">
      {sent ? (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <p className="text-sm text-zinc-600">
            Jika <b>{email}</b> terdaftar, kami telah mengirim tautan untuk mengatur ulang password.
            Cek kotak masuk (dan folder spam) kamu.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
          >
            Kembali ke Masuk
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="kamu@email.com"
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
            {loading ? "Mengirim..." : "Kirim Tautan Reset"}
          </button>
          <p className="text-center text-sm text-zinc-500">
            Ingat passwordmu?{" "}
            <Link href="/login" className="font-semibold text-zinc-900 hover:underline">
              Masuk
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
