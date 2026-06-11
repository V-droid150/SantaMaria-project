// Skeleton tampilan back-office — dipakai sebagai fallback `loading.tsx`
// di tiap halaman dashboard. Tujuannya memberi umpan balik INSTAN saat
// navigasi (klik 1x langsung terasa pindah) tanpa layar kosong/loader penuh.
// Sengaja statis & ringan (tanpa "use client") agar muncul seketika.

import Logo from "@/components/brand/Logo";

function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-zinc-200/80 ${className}`} />;
}

export default function AppSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900">
      {/* Sidebar (sama posisi dgn AppShell, supaya tak ada kedip) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-zinc-900 lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400 text-zinc-900">
            <Logo className="h-6 w-6" />
          </div>
          <span className="text-lg font-bold text-white">
            Santa<span className="text-yellow-400">Maria</span>
          </span>
        </div>
        <nav className="flex-1 space-y-1.5 p-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
              <div className="h-5 w-5 shrink-0 animate-pulse rounded bg-zinc-700" />
              <div className="h-3.5 w-28 animate-pulse rounded bg-zinc-700" />
            </div>
          ))}
        </nav>
      </aside>

      {/* Konten */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md sm:px-6">
          <div className="ml-auto flex items-center gap-3">
            <Bar className="h-8 w-8 rounded-lg" />
            <Bar className="h-9 w-28 rounded-xl" />
          </div>
        </header>

        {/* Area konten */}
        <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
          {/* Judul halaman */}
          <div className="space-y-2">
            <Bar className="h-7 w-48" />
            <Bar className="h-4 w-64" />
          </div>

          {/* Kartu ringkasan */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <Bar className="h-4 w-24" />
                <Bar className="mt-3 h-7 w-32" />
              </div>
            ))}
          </div>

          {/* Blok konten besar */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <Bar className="h-5 w-40" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Bar key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
