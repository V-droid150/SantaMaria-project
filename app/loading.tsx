import { Loader2 } from "lucide-react";

// Ditampilkan instan saat navigasi antar halaman (umpan balik klik langsung terasa).
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-xl font-extrabold text-yellow-400">
          S
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
      </div>
    </div>
  );
}
