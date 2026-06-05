"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Store,
  Briefcase,
  Tag,
  Boxes,
  Package,
  Cloud,
  Layers,
  Target,
  Megaphone,
} from "lucide-react";

type ProductFocus = "PHYSICAL" | "DIGITAL" | "BOTH";

type FormState = {
  storeName: string;
  businessType: string;
  category: string;
  productFocus: ProductFocus;
  scale: string;
  goals: string[];
  channels: string[];
};

const BUSINESS_TYPES = [
  "Pemilik UMKM / Toko",
  "Freelancer / Jasa",
  "Reseller / Dropshipper",
  "Content Creator",
  "Lainnya",
];

const CATEGORIES = [
  "Kuliner & Minuman",
  "Fashion & Aksesoris",
  "Kerajinan / Handmade",
  "Elektronik & Gadget",
  "Jasa & Produk Digital",
  "Kesehatan & Kecantikan",
  "Lainnya",
];

const SCALES = [
  "Baru mau mulai",
  "< Rp 10 juta / bulan",
  "Rp 10 - 50 juta / bulan",
  "Rp 50 - 200 juta / bulan",
  "> Rp 200 juta / bulan",
];

const GOALS = [
  "Kelola stok barang",
  "Catat keuangan",
  "Sistem kasir (POS)",
  "Laporan penjualan",
  "Kelola pelanggan",
  "Jualan online",
];

const CHANNELS = ["Toko fisik", "Online shop sendiri", "Marketplace", "WhatsApp / Sosmed"];

const FOCUS_OPTIONS: { value: ProductFocus; label: string; desc: string; icon: React.ElementType }[] =
  [
    { value: "PHYSICAL", label: "Produk Fisik", desc: "Barang yang dikirim/diambil", icon: Package },
    { value: "DIGITAL", label: "Produk Digital", desc: "E-book, voucher, jasa online", icon: Cloud },
    { value: "BOTH", label: "Keduanya", desc: "Fisik & digital", icon: Layers },
  ];

const TOTAL_STEPS = 6;

export default function OnboardingWizard({ userName }: { userName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    storeName: "",
    businessType: "",
    category: "",
    productFocus: "PHYSICAL",
    scale: "",
    goals: [],
    channels: [],
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleArray(key: "goals" | "channels", value: string) {
    setForm((f) => {
      const arr = f[key];
      return {
        ...f,
        [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value],
      };
    });
  }

  // Validasi minimal per langkah (tombol lanjut nonaktif jika belum cukup).
  const canProceed = (() => {
    switch (step) {
      case 1:
        return form.storeName.trim().length > 0 && form.businessType.length > 0;
      case 2:
        return form.category.length > 0;
      case 3:
        return !!form.productFocus;
      case 4:
        return form.scale.length > 0;
      case 5:
        return form.goals.length > 0;
      case 6:
        return form.channels.length > 0;
      default:
        return false;
    }
  })();

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setSubmitting(false);
    }
  }

  function next() {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else finish();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      {/* Header + progress */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-sm font-extrabold text-yellow-400">
            S
          </div>
          <span className="font-bold text-zinc-900">
            Santa<span className="text-yellow-500">Maria</span>
          </span>
          <span className="ml-auto text-xs font-medium text-zinc-400">
            Langkah {step} dari {TOTAL_STEPS}
          </span>
        </div>
        <div className="h-1 w-full bg-zinc-100">
          <div
            className="h-1 bg-yellow-400 transition-all duration-300"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </header>

      {/* Konten langkah */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-8 sm:py-12">
        {step === 1 && (
          <Step
            icon={Store}
            title={`Halo, ${userName.split(" ")[0]}! 👋`}
            subtitle="Ceritakan sedikit tentang bisnismu."
          >
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-700">Nama toko / bisnis</label>
                <input
                  autoFocus
                  value={form.storeName}
                  onChange={(e) => update("storeName", e.target.value)}
                  placeholder="contoh: Kopi Senja, Toko Berkah"
                  className="w-full rounded-xl border border-zinc-200 bg-white py-3 px-4 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <Briefcase className="h-4 w-4 text-zinc-400" /> Kamu seorang...
                </label>
                <ChipGroup
                  options={BUSINESS_TYPES}
                  selected={[form.businessType]}
                  onSelect={(v) => update("businessType", v)}
                />
              </div>
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step icon={Tag} title="Apa yang kamu jual?" subtitle="Pilih kategori yang paling sesuai.">
            <ChipGroup
              options={CATEGORIES}
              selected={[form.category]}
              onSelect={(v) => update("category", v)}
            />
          </Step>
        )}

        {step === 3 && (
          <Step icon={Boxes} title="Jenis produk" subtitle="Kamu menjual produk seperti apa?">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FOCUS_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = form.productFocus === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => update("productFocus", opt.value)}
                    className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-yellow-400 bg-yellow-400/10 ring-2 ring-yellow-400/40"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        active ? "bg-yellow-400 text-zinc-900" : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900">{opt.label}</p>
                    <p className="text-xs text-zinc-500">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step icon={Target} title="Skala usaha" subtitle="Perkiraan omzet bulanan saat ini.">
            <ChipGroup
              options={SCALES}
              selected={[form.scale]}
              onSelect={(v) => update("scale", v)}
            />
          </Step>
        )}

        {step === 5 && (
          <Step
            icon={Target}
            title="Apa tujuan utamamu?"
            subtitle="Boleh pilih lebih dari satu."
          >
            <ChipGroup
              options={GOALS}
              selected={form.goals}
              multi
              onSelect={(v) => toggleArray("goals", v)}
            />
          </Step>
        )}

        {step === 6 && (
          <Step icon={Megaphone} title="Di mana kamu berjualan?" subtitle="Boleh pilih lebih dari satu.">
            <ChipGroup
              options={CHANNELS}
              selected={form.channels}
              multi
              onSelect={(v) => toggleArray("channels", v)}
            />
          </Step>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Navigasi */}
        <div className="mt-auto flex items-center gap-3 pt-10">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali
            </button>
          )}
          <button
            onClick={next}
            disabled={!canProceed || submitting}
            className="ml-auto flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-zinc-900 transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === TOTAL_STEPS ? (
              <>
                Selesai & Masuk <Check className="h-4 w-4" />
              </>
            ) : (
              <>
                Lanjut <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

/* ---------- Sub-komponen ---------- */

function Step({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/15 text-yellow-500">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onSelect,
  multi = false,
}: {
  options: string[];
  selected: string[];
  onSelect: (value: string) => void;
  multi?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
              active
                ? "border-yellow-400 bg-yellow-400/10 text-zinc-900 ring-2 ring-yellow-400/40"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
            }`}
          >
            {multi && (
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-md border ${
                  active ? "border-yellow-400 bg-yellow-400 text-zinc-900" : "border-zinc-300"
                }`}
              >
                {active && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            )}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
