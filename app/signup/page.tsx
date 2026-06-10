"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail, User } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import OAuthButtons from "@/components/auth/OAuthButtons";
import TurnstileWidget, { isTurnstileEnabled } from "@/components/auth/TurnstileWidget";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/components/i18n/LanguageProvider";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const from = params.get("from") || "/onboarding";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const captchaEnabled = isTurnstileEnabled();

  // Token CAPTCHA sekali pakai -> muat ulang widget agar dapat token baru.
  function resetCaptcha() {
    setCaptchaToken("");
    setCaptchaKey((k) => k + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Validasi password: minimal 8 karakter & konfirmasi harus sama.
    if (password.length < 8) {
      setError(t("auth.passwordMin"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mendaftar");
        resetCaptcha();
        return;
      }
      // Setelah daftar -> langsung onboarding.
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title={t("auth.signupTitle")} subtitle={t("auth.signupSubtitle")}>
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher />
      </div>
      <OAuthButtons from={from} />

      <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        {t("auth.orSignupEmail")}
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-zinc-700">
            {t("auth.name")}
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-zinc-700">
            {t("auth.email")}
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

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">
            {t("auth.password")}
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
              placeholder={t("auth.passwordHint")}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-700">
            {t("auth.confirmPassword")}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("auth.confirmPasswordPh")}
              className={`w-full rounded-xl border bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-yellow-400/40 ${
                confirmPassword && confirmPassword !== password
                  ? "border-red-300 focus:border-red-400"
                  : "border-zinc-200 focus:border-yellow-400"
              }`}
            />
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="text-xs text-red-500">{t("auth.passwordMismatch")}</p>
          )}
        </div>

        {captchaEnabled && (
          <TurnstileWidget key={captchaKey} onToken={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
        )}

        <button
          type="submit"
          disabled={loading || (captchaEnabled && !captchaToken)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-400 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? t("auth.creating") : t("auth.signup")}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-zinc-400">
          Dengan mendaftar, kamu menyetujui Syarat Layanan & Kebijakan Privasi SantaMaria.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-zinc-900 underline-offset-2 hover:underline">
          {t("auth.login")}
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <SignupForm />
    </Suspense>
  );
}
