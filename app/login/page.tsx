"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, Mail } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";
import OAuthButtons from "@/components/auth/OAuthButtons";
import TurnstileWidget, { isTurnstileEnabled } from "@/components/auth/TurnstileWidget";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/components/i18n/LanguageProvider";
import LoadingScreen from "@/components/ui/LoadingScreen";

const OAUTH_ERRORS: Record<string, string> = {
  oauth_not_configured: "Login sosial belum dikonfigurasi. Gunakan email & password.",
  oauth_failed: "Gagal masuk dengan akun sosial. Coba lagi.",
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useI18n();
  const from = params.get("from") || "/dashboard";
  const oauthError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    oauthError ? OAUTH_ERRORS[oauthError] ?? null : null
  );
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
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
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk");
        resetCaptcha();
        return;
      }
      setRedirecting(true); // tampilkan layar loading hingga dashboard siap
      router.push(from);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  }

  if (redirecting) return <LoadingScreen label={t("auth.processing")} />;

  return (
    <AuthShell title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <div className="mb-4 flex justify-end">
        <LanguageSwitcher />
      </div>
      <OAuthButtons from={from} />

      <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        {t("auth.orEmail")}
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40"
            />
          </div>
        </div>

        <div className="-mt-1 text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-zinc-500 transition hover:text-zinc-900"
          >
            Lupa password?
          </Link>
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
          {loading ? t("auth.processing") : t("auth.login")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-zinc-900 underline-offset-2 hover:underline">
          {t("auth.registerFree")}
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <LoginForm />
    </Suspense>
  );
}
