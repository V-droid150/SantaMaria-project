import { Loader2 } from "lucide-react";
import Logo from "@/components/brand/Logo";

// Layar loading full-screen (dipakai mis. setelah berhasil login).
export default function LoadingScreen({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafa]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-yellow-400">
          <Logo className="h-9 w-9" />
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
        {label && <p className="text-sm text-zinc-500">{label}</p>}
      </div>
    </div>
  );
}
