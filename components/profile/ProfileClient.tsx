"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ImagePlus, UserCircle, Mail, Shield, KeyRound, Check } from "lucide-react";
import { getInitials } from "@/lib/format";
import { useI18n } from "@/components/i18n/LanguageProvider";

function compressImage(file: File, maxSize = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas tidak didukung"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

const inputCls =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40";

export default function ProfileClient({
  name: initialName,
  email,
  image: initialImage,
  roleLabel,
  hasPassword,
}: {
  name: string;
  email: string;
  image: string | null;
  roleLabel: string;
  hasPassword: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();

  const [name, setName] = useState(initialName);
  const [image, setImage] = useState<string | null>(initialImage);
  const [imgLoading, setImgLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError(t("prof.errPhoto"));
    setError(null);
    setImgLoading(true);
    try {
      setImage(await compressImage(file));
    } catch {
      setError(t("prof.errPhotoProcess"));
    } finally {
      setImgLoading(false);
    }
  }

  async function save() {
    setError(null);
    setOkMsg(null);
    if (!name.trim()) return setError(t("prof.errName"));

    const wantPassword = newPassword.length > 0;
    if (wantPassword) {
      if (newPassword.length < 8) return setError(t("prof.errMin"));
      if (newPassword !== confirmPassword) return setError(t("prof.errMismatch"));
      if (hasPassword && !currentPassword) return setError(t("prof.errCurrent"));
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          image,
          currentPassword: wantPassword ? currentPassword : undefined,
          newPassword: wantPassword ? newPassword : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("common.networkError"));
        return;
      }
      setOkMsg(t("prof.saved"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh(); // perbarui nama/foto di topbar
    } catch {
      setError(t("common.networkError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("prof.title")}</h1>
        <p className="text-sm text-zinc-500">{t("prof.subtitle")}</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
      )}
      {okMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <Check className="h-4 w-4" /> {okMsg}
        </div>
      )}

      {/* Identitas */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-yellow-400 text-2xl font-bold text-zinc-900">
            {imgLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={name} className="h-full w-full object-cover" />
            ) : (
              getInitials(name)
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-yellow-400">
              <ImagePlus className="h-4 w-4" />
              {image ? t("prof.changePhoto") : t("prof.uploadPhoto")}
              <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            </label>
            {image && (
              <button
                type="button"
                onClick={() => setImage(null)}
                className="text-left text-xs font-medium text-red-500 hover:underline"
              >
                {t("prof.removePhoto")}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
            <UserCircle className="h-4 w-4 text-zinc-400" /> {t("prof.name")}
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
              <Mail className="h-4 w-4 text-zinc-400" /> {t("prof.email")}
            </label>
            <input value={email} disabled className={`${inputCls} cursor-not-allowed opacity-60`} />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
              <Shield className="h-4 w-4 text-zinc-400" /> {t("prof.role")}
            </label>
            <input value={roleLabel} disabled className={`${inputCls} cursor-not-allowed opacity-60`} />
          </div>
        </div>
      </section>

      {/* Password */}
      <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-yellow-500" />
          <h2 className="font-bold">{hasPassword ? t("prof.changePassword") : t("prof.setPassword")}</h2>
        </div>
        <p className="text-sm text-zinc-500">
          {hasPassword ? t("prof.passwordHint") : t("prof.setPasswordHint")}
        </p>

        {hasPassword && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("prof.currentPassword")}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("prof.newPassword")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("prof.min8")}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("prof.confirmPassword")}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("prof.min8")}
              className={inputCls}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("prof.save")}
        </button>
      </div>
    </div>
  );
}
