"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, X, Loader2, UserCog, UserX, ShieldCheck } from "lucide-react";
import type { Role } from "@prisma/client";
import { getInitials } from "@/lib/format";
import { useI18n } from "@/components/i18n/LanguageProvider";

export type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  isSelf: boolean;
};

const ROLE_BADGE: Record<Role, string> = {
  ADMIN: "bg-zinc-900 text-yellow-400",
  KASIR: "bg-yellow-400 text-zinc-900",
  STAF_GUDANG: "bg-zinc-100 text-zinc-600",
};

export default function StaffClient({ staff }: { staff: StaffRow[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffRow | null>(null);

  async function toggleActive(s: StaffRow) {
    if (s.isSelf) return;
    if (s.isActive && !confirm(t("stf.confirmDeactivate"))) return;
    const res = await fetch(`/api/staff/${s.id}`, {
      method: s.isActive ? "DELETE" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: s.isActive ? undefined : JSON.stringify({ isActive: true }),
    });
    if (res.ok) router.refresh();
    else {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? t("common.networkError"));
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("stf.title")}</h1>
          <p className="text-sm text-zinc-500">{t("stf.subtitle")}</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-yellow-300"
        >
          <Plus className="h-4 w-4" /> {t("stf.add")}
        </button>
      </div>

      {/* Penjelasan role */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <RoleInfo title={t("role.ADMIN")} desc={t("stf.adminDesc")} />
        <RoleInfo title={t("role.KASIR")} desc={t("stf.kasirDesc")} />
        <RoleInfo title={t("role.STAF_GUDANG")} desc={t("stf.gudangDesc")} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-3 font-semibold">{t("stf.colName")}</th>
                <th className="px-5 py-3 font-semibold">{t("stf.colEmail")}</th>
                <th className="px-5 py-3 font-semibold">{t("stf.colRole")}</th>
                <th className="px-5 py-3 font-semibold">{t("stf.colStatus")}</th>
                <th className="px-5 py-3 text-right font-semibold">{t("stf.colAction")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {staff.map((s) => (
                <tr key={s.id} className="transition hover:bg-yellow-400/5">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-yellow-400">
                        {getInitials(s.name)}
                      </div>
                      <span className="font-semibold text-zinc-900">
                        {s.name}
                        {s.isSelf && <span className="ml-2 text-xs font-normal text-zinc-400">{t("stf.you")}</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-500">{s.email}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_BADGE[s.role]}`}>
                      {t(`role.${s.role}`)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold ${
                        s.isActive ? "text-yellow-600" : "text-zinc-400"
                      }`}
                    >
                      {s.isActive ? <ShieldCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                      {s.isActive ? t("stf.active") : t("stf.inactive")}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditing(s);
                          setModalOpen(true);
                        }}
                        className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                        aria-label="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {!s.isSelf && (
                        <button
                          onClick={() => toggleActive(s)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                            s.isActive
                              ? "text-red-500 hover:bg-red-50"
                              : "text-yellow-600 hover:bg-yellow-50"
                          }`}
                        >
                          {s.isActive ? t("stf.deactivate") : t("stf.activate")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <StaffModal
          staff={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function RoleInfo({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-400/15 text-yellow-500">
        <UserCog className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="text-xs text-zinc-500">{desc}</p>
      </div>
    </div>
  );
}

function StaffModal({
  staff,
  onClose,
  onSaved,
}: {
  staff: StaffRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const isEdit = !!staff;
  const [name, setName] = useState(staff?.name ?? "");
  const [email, setEmail] = useState(staff?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(staff?.role ?? "KASIR");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);
    if (!name.trim()) return setError("Nama wajib diisi");
    if (!isEdit && (!email.trim() || !password)) return setError("Email & password wajib diisi");
    if (password && password.length < 8) return setError("Password minimal 8 karakter");

    setSaving(true);
    try {
      const url = isEdit ? `/api/staff/${staff!.id}` : "/api/staff";
      const payload = isEdit
        ? { name, role, password: password || undefined }
        : { name, email, password, role };
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
        return;
      }
      onSaved();
    } catch {
      setError("Kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none transition focus:border-yellow-400 focus:bg-white focus:ring-2 focus:ring-yellow-400/40";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-bold">{isEdit ? t("stf.modalEdit") : t("stf.modalAdd")}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("stf.name")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("cust.email")} {isEdit ? "" : "*"}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isEdit}
              className={`${inputCls} disabled:bg-zinc-100 disabled:text-zinc-400`}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">
              {isEdit ? t("stf.passwordNew") : t("stf.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? t("stf.passwordNewPh") : t("stf.passwordPh")}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-700">{t("stf.role")}</label>
            {staff?.isSelf ? (
              <p className="rounded-xl bg-zinc-100 px-3 py-2.5 text-sm text-zinc-500">
                {t("stf.roleLocked")}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(["ADMIN", "KASIR", "STAF_GUDANG"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      role === r
                        ? "border-yellow-400 bg-yellow-400/10 text-zinc-900"
                        : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                    }`}
                  >
                    {t(`role.${r}`)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
