import Link from "next/link";
import { Check } from "lucide-react";

// Layout auth dua kolom: panel brand (hitam, desktop) + area form (putih).
// Responsif: di mobile/tablet hanya area form yang tampil, full width.
export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      {/* Panel brand — hanya desktop */}
      <aside className="relative hidden w-1/2 flex-col justify-between bg-zinc-900 p-12 text-white lg:flex xl:w-[45%]">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-xl font-extrabold text-zinc-900">
            S
          </div>
          <span className="text-xl font-bold">
            Santa<span className="text-yellow-400">Maria</span>
          </span>
        </Link>

        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight xl:text-4xl">
            Kelola bisnismu, <span className="text-yellow-400">jualan jadi mudah.</span>
          </h2>
          <p className="mt-4 text-zinc-400">
            Satu aplikasi untuk kasir, stok, keuangan, dan pelanggan — untuk produk fisik maupun
            digital.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Kasir (POS) multi-channel & struk otomatis",
              "Pelacakan stok real-time + stock opname",
              "Laporan laba/rugi & arus kas",
            ].map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-zinc-900">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-zinc-500">© {new Date().getFullYear()} SantaMaria</p>
      </aside>

      {/* Area form */}
      <main className="flex flex-1 items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-sm">
          {/* Logo untuk mobile */}
          <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-xl font-extrabold text-yellow-400">
              S
            </div>
          </div>

          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
            <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
