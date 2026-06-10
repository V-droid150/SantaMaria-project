import Link from "next/link";

// Kerangka halaman legal (Syarat / Privasi) — publik, tanpa login.
export default function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      <header className="bg-zinc-900 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 font-extrabold text-zinc-900">
              S
            </div>
            <span className="text-lg font-bold">
              Santa<span className="text-yellow-400">Maria</span>
            </span>
          </Link>
          <Link href="/login" className="text-sm text-zinc-300 transition hover:text-white">
            Masuk
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">Terakhir diperbarui: {updated}</p>
        <div className="mt-6 space-y-6 text-sm leading-relaxed text-zinc-700">{children}</div>

        <footer className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-200 pt-6 text-sm text-zinc-500">
          <Link href="/terms" className="transition hover:text-zinc-900">
            Syarat Layanan
          </Link>
          <Link href="/privacy" className="transition hover:text-zinc-900">
            Kebijakan Privasi
          </Link>
          <Link href="/login" className="transition hover:text-zinc-900">
            Kembali ke aplikasi
          </Link>
        </footer>
      </main>
    </div>
  );
}

// Bagian berjudul untuk dipakai di halaman legal.
export function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-zinc-900">{heading}</h2>
      {children}
    </section>
  );
}
